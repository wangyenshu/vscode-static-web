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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/comparers", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/strings", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/notebook/browser/contrib/find/findMatchDecorationModel", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/search/browser/replace", "vs/workbench/contrib/search/browser/notebookSearch/searchNotebookHelpers", "vs/workbench/contrib/search/common/notebookSearch", "vs/workbench/contrib/search/common/searchNotebookHelpers", "vs/workbench/services/search/common/replace", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchHelpers", "vs/workbench/contrib/search/common/cellSearchModel"], function (require, exports, async_1, cancellation_1, comparers_1, decorators_1, errors, event_1, lazy_1, lifecycle_1, map_1, network_1, strings_1, ternarySearchTree_1, uri_1, range_1, model_1, textModel_1, model_2, configuration_1, instantiation_1, label_1, log_1, progress_1, telemetry_1, colorRegistry_1, themeService_1, uriIdentity_1, findMatchDecorationModel_1, notebookEditorWidget_1, notebookEditorService_1, notebookCommon_1, replace_1, searchNotebookHelpers_1, notebookSearch_1, searchNotebookHelpers_2, replace_2, search_1, searchHelpers_1, cellSearchModel_1) {
    "use strict";
    var FileMatch_1, FolderMatch_1, RangeHighlightDecorations_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangeHighlightDecorations = exports.ISearchViewModelWorkbenchService = exports.SearchViewModelWorkbenchService = exports.SearchModel = exports.SearchModelLocation = exports.SearchResult = exports.FolderMatchNoRoot = exports.FolderMatchWorkspaceRoot = exports.FolderMatchWithResource = exports.FolderMatch = exports.FileMatch = exports.MatchInNotebook = exports.CellMatch = exports.Match = void 0;
    exports.searchMatchComparer = searchMatchComparer;
    exports.compareNotebookPos = compareNotebookPos;
    exports.searchComparer = searchComparer;
    exports.textSearchMatchesToNotebookMatches = textSearchMatchesToNotebookMatches;
    exports.arrayContainsElementOrParent = arrayContainsElementOrParent;
    class Match {
        static { this.MAX_PREVIEW_CHARS = 250; }
        constructor(_parent, _fullPreviewLines, _fullPreviewRange, _documentRange, aiContributed) {
            this._parent = _parent;
            this._fullPreviewLines = _fullPreviewLines;
            this.aiContributed = aiContributed;
            this._oneLinePreviewText = _fullPreviewLines[_fullPreviewRange.startLineNumber];
            const adjustedEndCol = _fullPreviewRange.startLineNumber === _fullPreviewRange.endLineNumber ?
                _fullPreviewRange.endColumn :
                this._oneLinePreviewText.length;
            this._rangeInPreviewText = new search_1.OneLineRange(1, _fullPreviewRange.startColumn + 1, adjustedEndCol + 1);
            this._range = new range_1.Range(_documentRange.startLineNumber + 1, _documentRange.startColumn + 1, _documentRange.endLineNumber + 1, _documentRange.endColumn + 1);
            this._fullPreviewRange = _fullPreviewRange;
            this._id = this._parent.id() + '>' + this._range + this.getMatchString();
        }
        id() {
            return this._id;
        }
        parent() {
            return this._parent;
        }
        text() {
            return this._oneLinePreviewText;
        }
        range() {
            return this._range;
        }
        preview() {
            const fullBefore = this._oneLinePreviewText.substring(0, this._rangeInPreviewText.startColumn - 1), before = (0, strings_1.lcut)(fullBefore, 26, '…');
            let inside = this.getMatchString(), after = this._oneLinePreviewText.substring(this._rangeInPreviewText.endColumn - 1);
            let charsRemaining = Match.MAX_PREVIEW_CHARS - before.length;
            inside = inside.substr(0, charsRemaining);
            charsRemaining -= inside.length;
            after = after.substr(0, charsRemaining);
            return {
                before,
                fullBefore,
                inside,
                after,
            };
        }
        get replaceString() {
            const searchModel = this.parent().parent().searchModel;
            if (!searchModel.replacePattern) {
                throw new Error('searchModel.replacePattern must be set before accessing replaceString');
            }
            const fullMatchText = this.fullMatchText();
            let replaceString = searchModel.replacePattern.getReplaceString(fullMatchText, searchModel.preserveCase);
            if (replaceString !== null) {
                return replaceString;
            }
            // Search/find normalize line endings - check whether \r prevents regex from matching
            const fullMatchTextWithoutCR = fullMatchText.replace(/\r\n/g, '\n');
            if (fullMatchTextWithoutCR !== fullMatchText) {
                replaceString = searchModel.replacePattern.getReplaceString(fullMatchTextWithoutCR, searchModel.preserveCase);
                if (replaceString !== null) {
                    return replaceString;
                }
            }
            // If match string is not matching then regex pattern has a lookahead expression
            const contextMatchTextWithSurroundingContent = this.fullMatchText(true);
            replaceString = searchModel.replacePattern.getReplaceString(contextMatchTextWithSurroundingContent, searchModel.preserveCase);
            if (replaceString !== null) {
                return replaceString;
            }
            // Search/find normalize line endings, this time in full context
            const contextMatchTextWithoutCR = contextMatchTextWithSurroundingContent.replace(/\r\n/g, '\n');
            if (contextMatchTextWithoutCR !== contextMatchTextWithSurroundingContent) {
                replaceString = searchModel.replacePattern.getReplaceString(contextMatchTextWithoutCR, searchModel.preserveCase);
                if (replaceString !== null) {
                    return replaceString;
                }
            }
            // Match string is still not matching. Could be unsupported matches (multi-line).
            return searchModel.replacePattern.pattern;
        }
        fullMatchText(includeSurrounding = false) {
            let thisMatchPreviewLines;
            if (includeSurrounding) {
                thisMatchPreviewLines = this._fullPreviewLines;
            }
            else {
                thisMatchPreviewLines = this._fullPreviewLines.slice(this._fullPreviewRange.startLineNumber, this._fullPreviewRange.endLineNumber + 1);
                thisMatchPreviewLines[thisMatchPreviewLines.length - 1] = thisMatchPreviewLines[thisMatchPreviewLines.length - 1].slice(0, this._fullPreviewRange.endColumn);
                thisMatchPreviewLines[0] = thisMatchPreviewLines[0].slice(this._fullPreviewRange.startColumn);
            }
            return thisMatchPreviewLines.join('\n');
        }
        rangeInPreview() {
            // convert to editor's base 1 positions.
            return {
                ...this._fullPreviewRange,
                startColumn: this._fullPreviewRange.startColumn + 1,
                endColumn: this._fullPreviewRange.endColumn + 1
            };
        }
        fullPreviewLines() {
            return this._fullPreviewLines.slice(this._fullPreviewRange.startLineNumber, this._fullPreviewRange.endLineNumber + 1);
        }
        getMatchString() {
            return this._oneLinePreviewText.substring(this._rangeInPreviewText.startColumn - 1, this._rangeInPreviewText.endColumn - 1);
        }
    }
    exports.Match = Match;
    __decorate([
        decorators_1.memoize
    ], Match.prototype, "preview", null);
    class CellMatch {
        constructor(_parent, _cell, _cellIndex) {
            this._parent = _parent;
            this._cell = _cell;
            this._cellIndex = _cellIndex;
            this._contentMatches = new Map();
            this._webviewMatches = new Map();
            this._context = new Map();
        }
        hasCellViewModel() {
            return !(this._cell instanceof cellSearchModel_1.CellSearchModel);
        }
        get context() {
            return new Map(this._context);
        }
        matches() {
            return [...this._contentMatches.values(), ...this._webviewMatches.values()];
        }
        get contentMatches() {
            return Array.from(this._contentMatches.values());
        }
        get webviewMatches() {
            return Array.from(this._webviewMatches.values());
        }
        remove(matches) {
            if (!Array.isArray(matches)) {
                matches = [matches];
            }
            for (const match of matches) {
                this._contentMatches.delete(match.id());
                this._webviewMatches.delete(match.id());
            }
        }
        clearAllMatches() {
            this._contentMatches.clear();
            this._webviewMatches.clear();
        }
        addContentMatches(textSearchMatches) {
            const contentMatches = textSearchMatchesToNotebookMatches(textSearchMatches, this);
            contentMatches.forEach((match) => {
                this._contentMatches.set(match.id(), match);
            });
            this.addContext(textSearchMatches);
        }
        addContext(textSearchMatches) {
            if (!this.cell) {
                // todo: get closed notebook results in search editor
                return;
            }
            this.cell.resolveTextModel().then((textModel) => {
                const textResultsWithContext = (0, searchHelpers_1.getTextSearchMatchWithModelContext)(textSearchMatches, textModel, this.parent.parent().query);
                const contexts = textResultsWithContext.filter((result => !(0, search_1.resultIsMatch)(result)));
                contexts.map(context => ({ ...context, lineNumber: context.lineNumber + 1 }))
                    .forEach((context) => { this._context.set(context.lineNumber, context.text); });
            });
        }
        addWebviewMatches(textSearchMatches) {
            const webviewMatches = textSearchMatchesToNotebookMatches(textSearchMatches, this);
            webviewMatches.forEach((match) => {
                this._webviewMatches.set(match.id(), match);
            });
            // TODO: add webview results to context
        }
        setCellModel(cell) {
            this._cell = cell;
        }
        get parent() {
            return this._parent;
        }
        get id() {
            return this._cell?.id ?? `${searchNotebookHelpers_2.rawCellPrefix}${this.cellIndex}`;
        }
        get cellIndex() {
            return this._cellIndex;
        }
        get cell() {
            return this._cell;
        }
    }
    exports.CellMatch = CellMatch;
    class MatchInNotebook extends Match {
        constructor(_cellParent, _fullPreviewLines, _fullPreviewRange, _documentRange, webviewIndex) {
            super(_cellParent.parent, _fullPreviewLines, _fullPreviewRange, _documentRange, false);
            this._cellParent = _cellParent;
            this._id = this._parent.id() + '>' + this._cellParent.cellIndex + (webviewIndex ? '_' + webviewIndex : '') + '_' + this.notebookMatchTypeString() + this._range + this.getMatchString();
            this._webviewIndex = webviewIndex;
        }
        parent() {
            return this._cellParent.parent;
        }
        get cellParent() {
            return this._cellParent;
        }
        notebookMatchTypeString() {
            return this.isWebviewMatch() ? 'webview' : 'content';
        }
        isWebviewMatch() {
            return this._webviewIndex !== undefined;
        }
        isReadonly() {
            return (!this._cellParent.hasCellViewModel()) || this.isWebviewMatch();
        }
        get cellIndex() {
            return this._cellParent.cellIndex;
        }
        get webviewIndex() {
            return this._webviewIndex;
        }
        get cell() {
            return this._cellParent.cell;
        }
    }
    exports.MatchInNotebook = MatchInNotebook;
    let FileMatch = class FileMatch extends lifecycle_1.Disposable {
        static { FileMatch_1 = this; }
        static { this._CURRENT_FIND_MATCH = textModel_1.ModelDecorationOptions.register({
            description: 'search-current-find-match',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            zIndex: 13,
            className: 'currentFindMatch',
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            },
            minimap: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapFindMatch),
                position: 1 /* MinimapPosition.Inline */
            }
        }); }
        static { this._FIND_MATCH = textModel_1.ModelDecorationOptions.register({
            description: 'search-find-match',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'findMatch',
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            },
            minimap: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapFindMatch),
                position: 1 /* MinimapPosition.Inline */
            }
        }); }
        static getDecorationOption(selected) {
            return (selected ? FileMatch_1._CURRENT_FIND_MATCH : FileMatch_1._FIND_MATCH);
        }
        get context() {
            return new Map(this._context);
        }
        get cellContext() {
            const cellContext = new Map();
            this._cellMatches.forEach(cellMatch => {
                cellContext.set(cellMatch.id, cellMatch.context);
            });
            return cellContext;
        }
        // #endregion
        constructor(_query, _previewOptions, _maxResults, _parent, rawMatch, _closestRoot, searchInstanceID, modelService, replaceService, labelService, notebookEditorService) {
            super();
            this._query = _query;
            this._previewOptions = _previewOptions;
            this._maxResults = _maxResults;
            this._parent = _parent;
            this.rawMatch = rawMatch;
            this._closestRoot = _closestRoot;
            this.searchInstanceID = searchInstanceID;
            this.modelService = modelService;
            this.replaceService = replaceService;
            this.notebookEditorService = notebookEditorService;
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this._model = null;
            this._modelListener = null;
            this._selectedMatch = null;
            this._modelDecorations = [];
            this._context = new Map();
            // #region notebook fields
            this._notebookEditorWidget = null;
            this._editorWidgetListener = null;
            this.replaceQ = Promise.resolve();
            this._resource = this.rawMatch.resource;
            this._textMatches = new Map();
            this._removedTextMatches = new Set();
            this._updateScheduler = new async_1.RunOnceScheduler(this.updateMatchesForModel.bind(this), 250);
            this._name = new lazy_1.Lazy(() => labelService.getUriBasenameLabel(this.resource));
            this._cellMatches = new Map();
            this._notebookUpdateScheduler = new async_1.RunOnceScheduler(this.updateMatchesForEditorWidget.bind(this), 250);
        }
        addWebviewMatchesToCell(cellID, webviewMatches) {
            const cellMatch = this.getCellMatch(cellID);
            if (cellMatch !== undefined) {
                cellMatch.addWebviewMatches(webviewMatches);
            }
        }
        addContentMatchesToCell(cellID, contentMatches) {
            const cellMatch = this.getCellMatch(cellID);
            if (cellMatch !== undefined) {
                cellMatch.addContentMatches(contentMatches);
            }
        }
        getCellMatch(cellID) {
            return this._cellMatches.get(cellID);
        }
        addCellMatch(rawCell) {
            const cellMatch = new CellMatch(this, (0, searchNotebookHelpers_1.isINotebookCellMatchWithModel)(rawCell) ? rawCell.cell : undefined, rawCell.index);
            this._cellMatches.set(cellMatch.id, cellMatch);
            this.addWebviewMatchesToCell(cellMatch.id, rawCell.webviewResults);
            this.addContentMatchesToCell(cellMatch.id, rawCell.contentResults);
        }
        get closestRoot() {
            return this._closestRoot;
        }
        hasReadonlyMatches() {
            return this.matches().some(m => m instanceof MatchInNotebook && m.isReadonly());
        }
        createMatches(isAiContributed) {
            const model = this.modelService.getModel(this._resource);
            if (model && !isAiContributed) {
                // todo: handle better when ai contributed results has model, currently, createMatches does not work for this
                this.bindModel(model);
                this.updateMatchesForModel();
            }
            else {
                const notebookEditorWidgetBorrow = this.notebookEditorService.retrieveExistingWidgetFromURI(this.resource);
                if (notebookEditorWidgetBorrow?.value) {
                    this.bindNotebookEditorWidget(notebookEditorWidgetBorrow.value);
                }
                if (this.rawMatch.results) {
                    this.rawMatch.results
                        .filter(search_1.resultIsMatch)
                        .forEach(rawMatch => {
                        textSearchResultToMatches(rawMatch, this, isAiContributed)
                            .forEach(m => this.add(m));
                    });
                }
                if ((0, searchNotebookHelpers_1.isINotebookFileMatchWithModel)(this.rawMatch) || (0, searchNotebookHelpers_2.isINotebookFileMatchNoModel)(this.rawMatch)) {
                    this.rawMatch.cellResults?.forEach(cell => this.addCellMatch(cell));
                    this.setNotebookFindMatchDecorationsUsingCellMatches(this.cellMatches());
                    this._onChange.fire({ forceUpdateModel: true });
                }
                this.addContext(this.rawMatch.results);
            }
        }
        bindModel(model) {
            this._model = model;
            this._modelListener = this._model.onDidChangeContent(() => {
                this._updateScheduler.schedule();
            });
            this._model.onWillDispose(() => this.onModelWillDispose());
            this.updateHighlights();
        }
        onModelWillDispose() {
            // Update matches because model might have some dirty changes
            this.updateMatchesForModel();
            this.unbindModel();
        }
        unbindModel() {
            if (this._model) {
                this._updateScheduler.cancel();
                this._model.changeDecorations((accessor) => {
                    this._modelDecorations = accessor.deltaDecorations(this._modelDecorations, []);
                });
                this._model = null;
                this._modelListener.dispose();
            }
        }
        updateMatchesForModel() {
            // this is called from a timeout and might fire
            // after the model has been disposed
            if (!this._model) {
                return;
            }
            this._textMatches = new Map();
            const wordSeparators = this._query.isWordMatch && this._query.wordSeparators ? this._query.wordSeparators : null;
            const matches = this._model
                .findMatches(this._query.pattern, this._model.getFullModelRange(), !!this._query.isRegExp, !!this._query.isCaseSensitive, wordSeparators, false, this._maxResults ?? Number.MAX_SAFE_INTEGER);
            this.updateMatches(matches, true, this._model, false);
        }
        async updatesMatchesForLineAfterReplace(lineNumber, modelChange) {
            if (!this._model) {
                return;
            }
            const range = {
                startLineNumber: lineNumber,
                startColumn: this._model.getLineMinColumn(lineNumber),
                endLineNumber: lineNumber,
                endColumn: this._model.getLineMaxColumn(lineNumber)
            };
            const oldMatches = Array.from(this._textMatches.values()).filter(match => match.range().startLineNumber === lineNumber);
            oldMatches.forEach(match => this._textMatches.delete(match.id()));
            const wordSeparators = this._query.isWordMatch && this._query.wordSeparators ? this._query.wordSeparators : null;
            const matches = this._model.findMatches(this._query.pattern, range, !!this._query.isRegExp, !!this._query.isCaseSensitive, wordSeparators, false, this._maxResults ?? Number.MAX_SAFE_INTEGER);
            this.updateMatches(matches, modelChange, this._model, false);
            // await this.updateMatchesForEditorWidget();
        }
        updateMatches(matches, modelChange, model, isAiContributed) {
            const textSearchResults = (0, searchHelpers_1.editorMatchesToTextSearchResults)(matches, model, this._previewOptions);
            textSearchResults.forEach(textSearchResult => {
                textSearchResultToMatches(textSearchResult, this, isAiContributed).forEach(match => {
                    if (!this._removedTextMatches.has(match.id())) {
                        this.add(match);
                        if (this.isMatchSelected(match)) {
                            this._selectedMatch = match;
                        }
                    }
                });
            });
            this.addContext((0, searchHelpers_1.getTextSearchMatchWithModelContext)(textSearchResults, model, this.parent().parent().query));
            this._onChange.fire({ forceUpdateModel: modelChange });
            this.updateHighlights();
        }
        updateHighlights() {
            if (!this._model) {
                return;
            }
            this._model.changeDecorations((accessor) => {
                const newDecorations = (this.parent().showHighlights
                    ? this.matches().map(match => ({
                        range: match.range(),
                        options: FileMatch_1.getDecorationOption(this.isMatchSelected(match))
                    }))
                    : []);
                this._modelDecorations = accessor.deltaDecorations(this._modelDecorations, newDecorations);
            });
        }
        id() {
            return this.resource.toString();
        }
        parent() {
            return this._parent;
        }
        matches() {
            const cellMatches = Array.from(this._cellMatches.values()).flatMap((e) => e.matches());
            return [...this._textMatches.values(), ...cellMatches];
        }
        textMatches() {
            return Array.from(this._textMatches.values());
        }
        cellMatches() {
            return Array.from(this._cellMatches.values());
        }
        remove(matches) {
            if (!Array.isArray(matches)) {
                matches = [matches];
            }
            for (const match of matches) {
                this.removeMatch(match);
                this._removedTextMatches.add(match.id());
            }
            this._onChange.fire({ didRemove: true });
        }
        async replace(toReplace) {
            return this.replaceQ = this.replaceQ.finally(async () => {
                await this.replaceService.replace(toReplace);
                await this.updatesMatchesForLineAfterReplace(toReplace.range().startLineNumber, false);
            });
        }
        setSelectedMatch(match) {
            if (match) {
                if (!this.isMatchSelected(match) && match instanceof MatchInNotebook) {
                    this._selectedMatch = match;
                    return;
                }
                if (!this._textMatches.has(match.id())) {
                    return;
                }
                if (this.isMatchSelected(match)) {
                    return;
                }
            }
            this._selectedMatch = match;
            this.updateHighlights();
        }
        getSelectedMatch() {
            return this._selectedMatch;
        }
        isMatchSelected(match) {
            return !!this._selectedMatch && this._selectedMatch.id() === match.id();
        }
        count() {
            return this.matches().length;
        }
        get resource() {
            return this._resource;
        }
        name() {
            return this._name.value;
        }
        addContext(results) {
            if (!results) {
                return;
            }
            const contexts = results
                .filter((result => !(0, search_1.resultIsMatch)(result)));
            return contexts.forEach(context => this._context.set(context.lineNumber, context.text));
        }
        add(match, trigger) {
            this._textMatches.set(match.id(), match);
            if (trigger) {
                this._onChange.fire({ forceUpdateModel: true });
            }
        }
        removeMatch(match) {
            if (match instanceof MatchInNotebook) {
                match.cellParent.remove(match);
                if (match.cellParent.matches().length === 0) {
                    this._cellMatches.delete(match.cellParent.id);
                }
            }
            else {
                this._textMatches.delete(match.id());
            }
            if (this.isMatchSelected(match)) {
                this.setSelectedMatch(null);
                this._findMatchDecorationModel?.clearCurrentFindMatchDecoration();
            }
            else {
                this.updateHighlights();
            }
            if (match instanceof MatchInNotebook) {
                this.setNotebookFindMatchDecorationsUsingCellMatches(this.cellMatches());
            }
        }
        async resolveFileStat(fileService) {
            this._fileStat = await fileService.stat(this.resource).catch(() => undefined);
        }
        get fileStat() {
            return this._fileStat;
        }
        set fileStat(stat) {
            this._fileStat = stat;
        }
        dispose() {
            this.setSelectedMatch(null);
            this.unbindModel();
            this.unbindNotebookEditorWidget();
            this._onDispose.fire();
            super.dispose();
        }
        hasOnlyReadOnlyMatches() {
            return this.matches().every(match => (match instanceof MatchInNotebook && match.isReadonly()));
        }
        // #region strictly notebook methods
        bindNotebookEditorWidget(widget) {
            if (this._notebookEditorWidget === widget) {
                return;
            }
            this._notebookEditorWidget = widget;
            this._editorWidgetListener = this._notebookEditorWidget.textModel?.onDidChangeContent((e) => {
                if (!e.rawEvents.some(event => event.kind === notebookCommon_1.NotebookCellsChangeType.ChangeCellContent || event.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange)) {
                    return;
                }
                this._notebookUpdateScheduler.schedule();
            }) ?? null;
            this._addNotebookHighlights();
        }
        unbindNotebookEditorWidget(widget) {
            if (widget && this._notebookEditorWidget !== widget) {
                return;
            }
            if (this._notebookEditorWidget) {
                this._notebookUpdateScheduler.cancel();
                this._editorWidgetListener?.dispose();
            }
            this._removeNotebookHighlights();
            this._notebookEditorWidget = null;
        }
        updateNotebookHighlights() {
            if (this.parent().showHighlights) {
                this._addNotebookHighlights();
                this.setNotebookFindMatchDecorationsUsingCellMatches(Array.from(this._cellMatches.values()));
            }
            else {
                this._removeNotebookHighlights();
            }
        }
        _addNotebookHighlights() {
            if (!this._notebookEditorWidget) {
                return;
            }
            this._findMatchDecorationModel?.stopWebviewFind();
            this._findMatchDecorationModel?.dispose();
            this._findMatchDecorationModel = new findMatchDecorationModel_1.FindMatchDecorationModel(this._notebookEditorWidget, this.searchInstanceID);
            if (this._selectedMatch instanceof MatchInNotebook) {
                this.highlightCurrentFindMatchDecoration(this._selectedMatch);
            }
        }
        _removeNotebookHighlights() {
            if (this._findMatchDecorationModel) {
                this._findMatchDecorationModel?.stopWebviewFind();
                this._findMatchDecorationModel?.dispose();
                this._findMatchDecorationModel = undefined;
            }
        }
        updateNotebookMatches(matches, modelChange) {
            if (!this._notebookEditorWidget) {
                return;
            }
            const oldCellMatches = new Map(this._cellMatches);
            if (this._notebookEditorWidget.getId() !== this._lastEditorWidgetIdForUpdate) {
                this._cellMatches.clear();
                this._lastEditorWidgetIdForUpdate = this._notebookEditorWidget.getId();
            }
            matches.forEach(match => {
                let existingCell = this._cellMatches.get(match.cell.id);
                if (this._notebookEditorWidget && !existingCell) {
                    const index = this._notebookEditorWidget.getCellIndex(match.cell);
                    const existingRawCell = oldCellMatches.get(`${searchNotebookHelpers_2.rawCellPrefix}${index}`);
                    if (existingRawCell) {
                        existingRawCell.setCellModel(match.cell);
                        existingRawCell.clearAllMatches();
                        existingCell = existingRawCell;
                    }
                }
                existingCell?.clearAllMatches();
                const cell = existingCell ?? new CellMatch(this, match.cell, match.index);
                cell.addContentMatches((0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(match.contentMatches, match.cell));
                cell.addWebviewMatches((0, searchNotebookHelpers_1.webviewMatchesToTextSearchMatches)(match.webviewMatches));
                this._cellMatches.set(cell.id, cell);
            });
            this._findMatchDecorationModel?.setAllFindMatchesDecorations(matches);
            if (this._selectedMatch instanceof MatchInNotebook) {
                this.highlightCurrentFindMatchDecoration(this._selectedMatch);
            }
            this._onChange.fire({ forceUpdateModel: modelChange });
        }
        setNotebookFindMatchDecorationsUsingCellMatches(cells) {
            if (!this._findMatchDecorationModel) {
                return;
            }
            const cellFindMatch = cells.map((cell) => {
                const webviewMatches = cell.webviewMatches.map(match => {
                    return {
                        index: match.webviewIndex,
                    };
                });
                const findMatches = cell.contentMatches.map(match => {
                    return new model_1.FindMatch(match.range(), [match.text()]);
                });
                return {
                    cell: cell.cell,
                    index: cell.cellIndex,
                    contentMatches: findMatches,
                    webviewMatches: webviewMatches
                };
            });
            try {
                this._findMatchDecorationModel.setAllFindMatchesDecorations(cellFindMatch);
            }
            catch (e) {
                // no op, might happen due to bugs related to cell output regex search
            }
        }
        async updateMatchesForEditorWidget() {
            if (!this._notebookEditorWidget) {
                return;
            }
            this._textMatches = new Map();
            const wordSeparators = this._query.isWordMatch && this._query.wordSeparators ? this._query.wordSeparators : null;
            const allMatches = await this._notebookEditorWidget
                .find(this._query.pattern, {
                regex: this._query.isRegExp,
                wholeWord: this._query.isWordMatch,
                caseSensitive: this._query.isCaseSensitive,
                wordSeparators: wordSeparators ?? undefined,
                includeMarkupInput: this._query.notebookInfo?.isInNotebookMarkdownInput,
                includeMarkupPreview: this._query.notebookInfo?.isInNotebookMarkdownPreview,
                includeCodeInput: this._query.notebookInfo?.isInNotebookCellInput,
                includeOutput: this._query.notebookInfo?.isInNotebookCellOutput,
            }, cancellation_1.CancellationToken.None, false, true, this.searchInstanceID);
            this.updateNotebookMatches(allMatches, true);
        }
        async showMatch(match) {
            const offset = await this.highlightCurrentFindMatchDecoration(match);
            this.setSelectedMatch(match);
            this.revealCellRange(match, offset);
        }
        async highlightCurrentFindMatchDecoration(match) {
            if (!this._findMatchDecorationModel || !match.cell) {
                // match cell should never be a CellSearchModel if the notebook is open
                return null;
            }
            if (match.webviewIndex === undefined) {
                return this._findMatchDecorationModel.highlightCurrentFindMatchDecorationInCell(match.cell, match.range());
            }
            else {
                return this._findMatchDecorationModel.highlightCurrentFindMatchDecorationInWebview(match.cell, match.webviewIndex);
            }
        }
        revealCellRange(match, outputOffset) {
            if (!this._notebookEditorWidget || !match.cell) {
                // match cell should never be a CellSearchModel if the notebook is open
                return;
            }
            if (match.webviewIndex !== undefined) {
                const index = this._notebookEditorWidget.getCellIndex(match.cell);
                if (index !== undefined) {
                    this._notebookEditorWidget.revealCellOffsetInCenter(match.cell, outputOffset ?? 0);
                }
            }
            else {
                match.cell.updateEditState(match.cell.getEditState(), 'focusNotebookCell');
                this._notebookEditorWidget.setCellEditorSelection(match.cell, match.range());
                this._notebookEditorWidget.revealRangeInCenterIfOutsideViewportAsync(match.cell, match.range());
            }
        }
    };
    exports.FileMatch = FileMatch;
    exports.FileMatch = FileMatch = FileMatch_1 = __decorate([
        __param(7, model_2.IModelService),
        __param(8, replace_1.IReplaceService),
        __param(9, label_1.ILabelService),
        __param(10, notebookEditorService_1.INotebookEditorService)
    ], FileMatch);
    let FolderMatch = FolderMatch_1 = class FolderMatch extends lifecycle_1.Disposable {
        constructor(_resource, _id, _index, _query, _parent, _searchResult, _closestRoot, replaceService, instantiationService, labelService, uriIdentityService) {
            super();
            this._resource = _resource;
            this._id = _id;
            this._index = _index;
            this._query = _query;
            this._parent = _parent;
            this._searchResult = _searchResult;
            this._closestRoot = _closestRoot;
            this.replaceService = replaceService;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this._replacingAll = false;
            this._fileMatches = new map_1.ResourceMap();
            this._folderMatches = new map_1.ResourceMap();
            this._folderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._unDisposedFileMatches = new map_1.ResourceMap();
            this._unDisposedFolderMatches = new map_1.ResourceMap();
            this._name = new lazy_1.Lazy(() => this.resource ? labelService.getUriBasenameLabel(this.resource) : '');
        }
        get searchModel() {
            return this._searchResult.searchModel;
        }
        get showHighlights() {
            return this._parent.showHighlights;
        }
        get closestRoot() {
            return this._closestRoot;
        }
        set replacingAll(b) {
            this._replacingAll = b;
        }
        id() {
            return this._id;
        }
        get resource() {
            return this._resource;
        }
        index() {
            return this._index;
        }
        name() {
            return this._name.value;
        }
        parent() {
            return this._parent;
        }
        bindModel(model) {
            const fileMatch = this._fileMatches.get(model.uri);
            if (fileMatch) {
                fileMatch.bindModel(model);
            }
            else {
                const folderMatch = this.getFolderMatch(model.uri);
                const match = folderMatch?.getDownstreamFileMatch(model.uri);
                match?.bindModel(model);
            }
        }
        async bindNotebookEditorWidget(editor, resource) {
            const fileMatch = this._fileMatches.get(resource);
            if (fileMatch) {
                fileMatch.bindNotebookEditorWidget(editor);
                await fileMatch.updateMatchesForEditorWidget();
            }
            else {
                const folderMatches = this.folderMatchesIterator();
                for (const elem of folderMatches) {
                    await elem.bindNotebookEditorWidget(editor, resource);
                }
            }
        }
        unbindNotebookEditorWidget(editor, resource) {
            const fileMatch = this._fileMatches.get(resource);
            if (fileMatch) {
                fileMatch.unbindNotebookEditorWidget(editor);
            }
            else {
                const folderMatches = this.folderMatchesIterator();
                for (const elem of folderMatches) {
                    elem.unbindNotebookEditorWidget(editor, resource);
                }
            }
        }
        createIntermediateFolderMatch(resource, id, index, query, baseWorkspaceFolder) {
            const folderMatch = this._register(this.instantiationService.createInstance(FolderMatchWithResource, resource, id, index, query, this, this._searchResult, baseWorkspaceFolder));
            this.configureIntermediateMatch(folderMatch);
            this.doAddFolder(folderMatch);
            return folderMatch;
        }
        configureIntermediateMatch(folderMatch) {
            const disposable = folderMatch.onChange((event) => this.onFolderChange(folderMatch, event));
            this._register(folderMatch.onDispose(() => disposable.dispose()));
        }
        clear(clearingAll = false) {
            const changed = this.allDownstreamFileMatches();
            this.disposeMatches();
            this._onChange.fire({ elements: changed, removed: true, added: false, clearingAll });
        }
        remove(matches) {
            if (!Array.isArray(matches)) {
                matches = [matches];
            }
            const allMatches = getFileMatches(matches);
            this.doRemoveFile(allMatches);
        }
        async replace(match) {
            return this.replaceService.replace([match]).then(() => {
                this.doRemoveFile([match], true, true, true);
            });
        }
        replaceAll() {
            const matches = this.matches();
            return this.batchReplace(matches);
        }
        matches() {
            return [...this.fileMatchesIterator(), ...this.folderMatchesIterator()];
        }
        fileMatchesIterator() {
            return this._fileMatches.values();
        }
        folderMatchesIterator() {
            return this._folderMatches.values();
        }
        isEmpty() {
            return (this.fileCount() + this.folderCount()) === 0;
        }
        getDownstreamFileMatch(uri) {
            const directChildFileMatch = this._fileMatches.get(uri);
            if (directChildFileMatch) {
                return directChildFileMatch;
            }
            const folderMatch = this.getFolderMatch(uri);
            const match = folderMatch?.getDownstreamFileMatch(uri);
            if (match) {
                return match;
            }
            return null;
        }
        allDownstreamFileMatches() {
            let recursiveChildren = [];
            const iterator = this.folderMatchesIterator();
            for (const elem of iterator) {
                recursiveChildren = recursiveChildren.concat(elem.allDownstreamFileMatches());
            }
            return [...this.fileMatchesIterator(), ...recursiveChildren];
        }
        fileCount() {
            return this._fileMatches.size;
        }
        folderCount() {
            return this._folderMatches.size;
        }
        count() {
            return this.fileCount() + this.folderCount();
        }
        recursiveFileCount() {
            return this.allDownstreamFileMatches().length;
        }
        recursiveMatchCount() {
            return this.allDownstreamFileMatches().reduce((prev, match) => prev + match.count(), 0);
        }
        get query() {
            return this._query;
        }
        addFileMatch(raw, silent, searchInstanceID, isAiContributed) {
            // when adding a fileMatch that has intermediate directories
            const added = [];
            const updated = [];
            raw.forEach(rawFileMatch => {
                const existingFileMatch = this.getDownstreamFileMatch(rawFileMatch.resource);
                if (existingFileMatch) {
                    if (rawFileMatch.results) {
                        rawFileMatch
                            .results
                            .filter(search_1.resultIsMatch)
                            .forEach(m => {
                            textSearchResultToMatches(m, existingFileMatch, isAiContributed)
                                .forEach(m => existingFileMatch.add(m));
                        });
                    }
                    // add cell matches
                    if ((0, searchNotebookHelpers_1.isINotebookFileMatchWithModel)(rawFileMatch) || (0, searchNotebookHelpers_2.isINotebookFileMatchNoModel)(rawFileMatch)) {
                        rawFileMatch.cellResults?.forEach(rawCellMatch => {
                            const existingCellMatch = existingFileMatch.getCellMatch((0, searchNotebookHelpers_1.getIDFromINotebookCellMatch)(rawCellMatch));
                            if (existingCellMatch) {
                                existingCellMatch.addContentMatches(rawCellMatch.contentResults);
                                existingCellMatch.addWebviewMatches(rawCellMatch.webviewResults);
                            }
                            else {
                                existingFileMatch.addCellMatch(rawCellMatch);
                            }
                        });
                    }
                    updated.push(existingFileMatch);
                    if (rawFileMatch.results && rawFileMatch.results.length > 0) {
                        existingFileMatch.addContext(rawFileMatch.results);
                    }
                }
                else {
                    if (this instanceof FolderMatchWorkspaceRoot || this instanceof FolderMatchNoRoot) {
                        const fileMatch = this.createAndConfigureFileMatch(rawFileMatch, searchInstanceID);
                        added.push(fileMatch);
                    }
                }
            });
            const elements = [...added, ...updated];
            if (!silent && elements.length) {
                this._onChange.fire({ elements, added: !!added.length });
            }
        }
        doAddFile(fileMatch) {
            this._fileMatches.set(fileMatch.resource, fileMatch);
            if (this._unDisposedFileMatches.has(fileMatch.resource)) {
                this._unDisposedFileMatches.delete(fileMatch.resource);
            }
        }
        hasOnlyReadOnlyMatches() {
            return Array.from(this._fileMatches.values()).every(fm => fm.hasOnlyReadOnlyMatches());
        }
        uriHasParent(parent, child) {
            return this.uriIdentityService.extUri.isEqualOrParent(child, parent) && !this.uriIdentityService.extUri.isEqual(child, parent);
        }
        isInParentChain(folderMatch) {
            let matchItem = this;
            while (matchItem instanceof FolderMatch_1) {
                if (matchItem.id() === folderMatch.id()) {
                    return true;
                }
                matchItem = matchItem.parent();
            }
            return false;
        }
        getFolderMatch(resource) {
            const folderMatch = this._folderMatchesMap.findSubstr(resource);
            return folderMatch;
        }
        doAddFolder(folderMatch) {
            if (this instanceof FolderMatchWithResource && !this.uriHasParent(this.resource, folderMatch.resource)) {
                throw Error(`${folderMatch.resource} does not belong as a child of ${this.resource}`);
            }
            else if (this.isInParentChain(folderMatch)) {
                throw Error(`${folderMatch.resource} is a parent of ${this.resource}`);
            }
            this._folderMatches.set(folderMatch.resource, folderMatch);
            this._folderMatchesMap.set(folderMatch.resource, folderMatch);
            if (this._unDisposedFolderMatches.has(folderMatch.resource)) {
                this._unDisposedFolderMatches.delete(folderMatch.resource);
            }
        }
        async batchReplace(matches) {
            const allMatches = getFileMatches(matches);
            await this.replaceService.replace(allMatches);
            this.doRemoveFile(allMatches, true, true, true);
        }
        onFileChange(fileMatch, removed = false) {
            let added = false;
            if (!this._fileMatches.has(fileMatch.resource)) {
                this.doAddFile(fileMatch);
                added = true;
            }
            if (fileMatch.count() === 0) {
                this.doRemoveFile([fileMatch], false, false);
                added = false;
                removed = true;
            }
            if (!this._replacingAll) {
                this._onChange.fire({ elements: [fileMatch], added: added, removed: removed });
            }
        }
        onFolderChange(folderMatch, event) {
            if (!this._folderMatches.has(folderMatch.resource)) {
                this.doAddFolder(folderMatch);
            }
            if (folderMatch.isEmpty()) {
                this._folderMatches.delete(folderMatch.resource);
                folderMatch.dispose();
            }
            this._onChange.fire(event);
        }
        doRemoveFile(fileMatches, dispose = true, trigger = true, keepReadonly = false) {
            const removed = [];
            for (const match of fileMatches) {
                if (this._fileMatches.get(match.resource)) {
                    if (keepReadonly && match.hasReadonlyMatches()) {
                        continue;
                    }
                    this._fileMatches.delete(match.resource);
                    if (dispose) {
                        match.dispose();
                    }
                    else {
                        this._unDisposedFileMatches.set(match.resource, match);
                    }
                    removed.push(match);
                }
                else {
                    const folder = this.getFolderMatch(match.resource);
                    if (folder) {
                        folder.doRemoveFile([match], dispose, trigger);
                    }
                    else {
                        throw Error(`FileMatch ${match.resource} is not located within FolderMatch ${this.resource}`);
                    }
                }
            }
            if (trigger) {
                this._onChange.fire({ elements: removed, removed: true });
            }
        }
        disposeMatches() {
            [...this._fileMatches.values()].forEach((fileMatch) => fileMatch.dispose());
            [...this._folderMatches.values()].forEach((folderMatch) => folderMatch.disposeMatches());
            [...this._unDisposedFileMatches.values()].forEach((fileMatch) => fileMatch.dispose());
            [...this._unDisposedFolderMatches.values()].forEach((folderMatch) => folderMatch.disposeMatches());
            this._fileMatches.clear();
            this._folderMatches.clear();
            this._unDisposedFileMatches.clear();
            this._unDisposedFolderMatches.clear();
        }
        dispose() {
            this.disposeMatches();
            this._onDispose.fire();
            super.dispose();
        }
    };
    exports.FolderMatch = FolderMatch;
    exports.FolderMatch = FolderMatch = FolderMatch_1 = __decorate([
        __param(7, replace_1.IReplaceService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, label_1.ILabelService),
        __param(10, uriIdentity_1.IUriIdentityService)
    ], FolderMatch);
    let FolderMatchWithResource = class FolderMatchWithResource extends FolderMatch {
        constructor(_resource, _id, _index, _query, _parent, _searchResult, _closestRoot, replaceService, instantiationService, labelService, uriIdentityService) {
            super(_resource, _id, _index, _query, _parent, _searchResult, _closestRoot, replaceService, instantiationService, labelService, uriIdentityService);
            this._normalizedResource = new lazy_1.Lazy(() => this.uriIdentityService.extUri.removeTrailingPathSeparator(this.uriIdentityService.extUri.normalizePath(this.resource)));
        }
        get resource() {
            return this._resource;
        }
        get normalizedResource() {
            return this._normalizedResource.value;
        }
    };
    exports.FolderMatchWithResource = FolderMatchWithResource;
    exports.FolderMatchWithResource = FolderMatchWithResource = __decorate([
        __param(7, replace_1.IReplaceService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, label_1.ILabelService),
        __param(10, uriIdentity_1.IUriIdentityService)
    ], FolderMatchWithResource);
    /**
     * FolderMatchWorkspaceRoot => folder for workspace root
     */
    let FolderMatchWorkspaceRoot = class FolderMatchWorkspaceRoot extends FolderMatchWithResource {
        constructor(_resource, _id, _index, _query, _parent, _ai, replaceService, instantiationService, labelService, uriIdentityService) {
            super(_resource, _id, _index, _query, _parent, _parent, null, replaceService, instantiationService, labelService, uriIdentityService);
            this._ai = _ai;
        }
        normalizedUriParent(uri) {
            return this.uriIdentityService.extUri.normalizePath(this.uriIdentityService.extUri.dirname(uri));
        }
        uriEquals(uri1, ur2) {
            return this.uriIdentityService.extUri.isEqual(uri1, ur2);
        }
        createFileMatch(query, previewOptions, maxResults, parent, rawFileMatch, closestRoot, searchInstanceID) {
            const fileMatch = this.instantiationService.createInstance(FileMatch, query, previewOptions, maxResults, parent, rawFileMatch, closestRoot, searchInstanceID);
            fileMatch.createMatches(this._ai);
            parent.doAddFile(fileMatch);
            const disposable = fileMatch.onChange(({ didRemove }) => parent.onFileChange(fileMatch, didRemove));
            this._register(fileMatch.onDispose(() => disposable.dispose()));
            return fileMatch;
        }
        createAndConfigureFileMatch(rawFileMatch, searchInstanceID) {
            if (!this.uriHasParent(this.resource, rawFileMatch.resource)) {
                throw Error(`${rawFileMatch.resource} is not a descendant of ${this.resource}`);
            }
            const fileMatchParentParts = [];
            let uri = this.normalizedUriParent(rawFileMatch.resource);
            while (!this.uriEquals(this.normalizedResource, uri)) {
                fileMatchParentParts.unshift(uri);
                const prevUri = uri;
                uri = this.uriIdentityService.extUri.removeTrailingPathSeparator(this.normalizedUriParent(uri));
                if (this.uriEquals(prevUri, uri)) {
                    throw Error(`${rawFileMatch.resource} is not correctly configured as a child of ${this.normalizedResource}`);
                }
            }
            const root = this.closestRoot ?? this;
            let parent = this;
            for (let i = 0; i < fileMatchParentParts.length; i++) {
                let folderMatch = parent.getFolderMatch(fileMatchParentParts[i]);
                if (!folderMatch) {
                    folderMatch = parent.createIntermediateFolderMatch(fileMatchParentParts[i], fileMatchParentParts[i].toString(), -1, this._query, root);
                }
                parent = folderMatch;
            }
            return this.createFileMatch(this._query.contentPattern, this._query.previewOptions, this._query.maxResults, parent, rawFileMatch, root, searchInstanceID);
        }
    };
    exports.FolderMatchWorkspaceRoot = FolderMatchWorkspaceRoot;
    exports.FolderMatchWorkspaceRoot = FolderMatchWorkspaceRoot = __decorate([
        __param(6, replace_1.IReplaceService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, label_1.ILabelService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], FolderMatchWorkspaceRoot);
    /**
     * BaseFolderMatch => optional resource ("other files" node)
     * FolderMatch => required resource (normal folder node)
     */
    let FolderMatchNoRoot = class FolderMatchNoRoot extends FolderMatch {
        constructor(_id, _index, _query, _parent, replaceService, instantiationService, labelService, uriIdentityService) {
            super(null, _id, _index, _query, _parent, _parent, null, replaceService, instantiationService, labelService, uriIdentityService);
        }
        createAndConfigureFileMatch(rawFileMatch, searchInstanceID) {
            const fileMatch = this._register(this.instantiationService.createInstance(FileMatch, this._query.contentPattern, this._query.previewOptions, this._query.maxResults, this, rawFileMatch, null, searchInstanceID));
            fileMatch.createMatches(false); // currently, no support for AI results in out-of-workspace files
            this.doAddFile(fileMatch);
            const disposable = fileMatch.onChange(({ didRemove }) => this.onFileChange(fileMatch, didRemove));
            this._register(fileMatch.onDispose(() => disposable.dispose()));
            return fileMatch;
        }
    };
    exports.FolderMatchNoRoot = FolderMatchNoRoot;
    exports.FolderMatchNoRoot = FolderMatchNoRoot = __decorate([
        __param(4, replace_1.IReplaceService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, label_1.ILabelService),
        __param(7, uriIdentity_1.IUriIdentityService)
    ], FolderMatchNoRoot);
    let elemAIndex = -1;
    let elemBIndex = -1;
    /**
     * Compares instances of the same match type. Different match types should not be siblings
     * and their sort order is undefined.
     */
    function searchMatchComparer(elementA, elementB, sortOrder = "default" /* SearchSortOrder.Default */) {
        if (elementA instanceof FileMatch && elementB instanceof FolderMatch) {
            return 1;
        }
        if (elementB instanceof FileMatch && elementA instanceof FolderMatch) {
            return -1;
        }
        if (elementA instanceof FolderMatch && elementB instanceof FolderMatch) {
            elemAIndex = elementA.index();
            elemBIndex = elementB.index();
            if (elemAIndex !== -1 && elemBIndex !== -1) {
                return elemAIndex - elemBIndex;
            }
            switch (sortOrder) {
                case "countDescending" /* SearchSortOrder.CountDescending */:
                    return elementB.count() - elementA.count();
                case "countAscending" /* SearchSortOrder.CountAscending */:
                    return elementA.count() - elementB.count();
                case "type" /* SearchSortOrder.Type */:
                    return (0, comparers_1.compareFileExtensions)(elementA.name(), elementB.name());
                case "fileNames" /* SearchSortOrder.FileNames */:
                    return (0, comparers_1.compareFileNames)(elementA.name(), elementB.name());
                // Fall through otherwise
                default:
                    if (!elementA.resource || !elementB.resource) {
                        return 0;
                    }
                    return (0, comparers_1.comparePaths)(elementA.resource.fsPath, elementB.resource.fsPath) || (0, comparers_1.compareFileNames)(elementA.name(), elementB.name());
            }
        }
        if (elementA instanceof FileMatch && elementB instanceof FileMatch) {
            switch (sortOrder) {
                case "countDescending" /* SearchSortOrder.CountDescending */:
                    return elementB.count() - elementA.count();
                case "countAscending" /* SearchSortOrder.CountAscending */:
                    return elementA.count() - elementB.count();
                case "type" /* SearchSortOrder.Type */:
                    return (0, comparers_1.compareFileExtensions)(elementA.name(), elementB.name());
                case "fileNames" /* SearchSortOrder.FileNames */:
                    return (0, comparers_1.compareFileNames)(elementA.name(), elementB.name());
                case "modified" /* SearchSortOrder.Modified */: {
                    const fileStatA = elementA.fileStat;
                    const fileStatB = elementB.fileStat;
                    if (fileStatA && fileStatB) {
                        return fileStatB.mtime - fileStatA.mtime;
                    }
                }
                // Fall through otherwise
                default:
                    return (0, comparers_1.comparePaths)(elementA.resource.fsPath, elementB.resource.fsPath) || (0, comparers_1.compareFileNames)(elementA.name(), elementB.name());
            }
        }
        if (elementA instanceof MatchInNotebook && elementB instanceof MatchInNotebook) {
            return compareNotebookPos(elementA, elementB);
        }
        if (elementA instanceof Match && elementB instanceof Match) {
            return range_1.Range.compareRangesUsingStarts(elementA.range(), elementB.range());
        }
        return 0;
    }
    function compareNotebookPos(match1, match2) {
        if (match1.cellIndex === match2.cellIndex) {
            if (match1.webviewIndex !== undefined && match2.webviewIndex !== undefined) {
                return match1.webviewIndex - match2.webviewIndex;
            }
            else if (match1.webviewIndex === undefined && match2.webviewIndex === undefined) {
                return range_1.Range.compareRangesUsingStarts(match1.range(), match2.range());
            }
            else {
                // webview matches should always be after content matches
                if (match1.webviewIndex !== undefined) {
                    return 1;
                }
                else {
                    return -1;
                }
            }
        }
        else if (match1.cellIndex < match2.cellIndex) {
            return -1;
        }
        else {
            return 1;
        }
    }
    function searchComparer(elementA, elementB, sortOrder = "default" /* SearchSortOrder.Default */) {
        const elemAParents = createParentList(elementA);
        const elemBParents = createParentList(elementB);
        let i = elemAParents.length - 1;
        let j = elemBParents.length - 1;
        while (i >= 0 && j >= 0) {
            if (elemAParents[i].id() !== elemBParents[j].id()) {
                return searchMatchComparer(elemAParents[i], elemBParents[j], sortOrder);
            }
            i--;
            j--;
        }
        const elemAAtEnd = i === 0;
        const elemBAtEnd = j === 0;
        if (elemAAtEnd && !elemBAtEnd) {
            return 1;
        }
        else if (!elemAAtEnd && elemBAtEnd) {
            return -1;
        }
        return 0;
    }
    function createParentList(element) {
        const parentArray = [];
        let currElement = element;
        while (!(currElement instanceof SearchResult)) {
            parentArray.push(currElement);
            currElement = currElement.parent();
        }
        return parentArray;
    }
    let SearchResult = class SearchResult extends lifecycle_1.Disposable {
        constructor(searchModel, replaceService, instantiationService, modelService, uriIdentityService, notebookEditorService) {
            super();
            this.searchModel = searchModel;
            this.replaceService = replaceService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.uriIdentityService = uriIdentityService;
            this.notebookEditorService = notebookEditorService;
            this._onChange = this._register(new event_1.PauseableEmitter({
                merge: mergeSearchResultEvents
            }));
            this.onChange = this._onChange.event;
            this._folderMatches = [];
            this._aiFolderMatches = [];
            this._otherFilesMatch = null;
            this._folderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._aiFolderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._showHighlights = false;
            this._query = null;
            this.disposePastResults = () => Promise.resolve();
            this._isDirty = false;
            this._rangeHighlightDecorations = this.instantiationService.createInstance(RangeHighlightDecorations);
            this.modelService.getModels().forEach(model => this.onModelAdded(model));
            this._register(this.modelService.onModelAdded(model => this.onModelAdded(model)));
            this._register(this.notebookEditorService.onDidAddNotebookEditor(widget => {
                if (widget instanceof notebookEditorWidget_1.NotebookEditorWidget) {
                    this.onDidAddNotebookEditorWidget(widget);
                }
            }));
            this._register(this.onChange(e => {
                if (e.removed) {
                    this._isDirty = !this.isEmpty() || !this.isEmpty(true);
                }
            }));
        }
        async batchReplace(elementsToReplace) {
            try {
                this._onChange.pause();
                await Promise.all(elementsToReplace.map(async (elem) => {
                    const parent = elem.parent();
                    if ((parent instanceof FolderMatch || parent instanceof FileMatch) && arrayContainsElementOrParent(parent, elementsToReplace)) {
                        // skip any children who have parents in the array
                        return;
                    }
                    if (elem instanceof FileMatch) {
                        await elem.parent().replace(elem);
                    }
                    else if (elem instanceof Match) {
                        await elem.parent().replace(elem);
                    }
                    else if (elem instanceof FolderMatch) {
                        await elem.replaceAll();
                    }
                }));
            }
            finally {
                this._onChange.resume();
            }
        }
        batchRemove(elementsToRemove) {
            // need to check that we aren't trying to remove elements twice
            const removedElems = [];
            try {
                this._onChange.pause();
                elementsToRemove.forEach((currentElement) => {
                    if (!arrayContainsElementOrParent(currentElement, removedElems)) {
                        currentElement.parent().remove(currentElement);
                        removedElems.push(currentElement);
                    }
                });
            }
            finally {
                this._onChange.resume();
            }
        }
        get isDirty() {
            return this._isDirty;
        }
        get query() {
            return this._query;
        }
        set query(query) {
            // When updating the query we could change the roots, so keep a reference to them to clean up when we trigger `disposePastResults`
            const oldFolderMatches = this.folderMatches();
            this.disposePastResults = async () => {
                oldFolderMatches.forEach(match => match.clear());
                oldFolderMatches.forEach(match => match.dispose());
                this._isDirty = false;
            };
            this._cachedSearchComplete = undefined;
            this._aiCachedSearchComplete = undefined;
            this._rangeHighlightDecorations.removeHighlightRange();
            this._folderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._aiFolderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            if (!query) {
                return;
            }
            this._folderMatches = (query && query.folderQueries || [])
                .map(fq => fq.folder)
                .map((resource, index) => this._createBaseFolderMatch(resource, resource.toString(), index, query, false));
            this._folderMatches.forEach(fm => this._folderMatchesMap.set(fm.resource, fm));
            this._aiFolderMatches = (query && query.folderQueries || [])
                .map(fq => fq.folder)
                .map((resource, index) => this._createBaseFolderMatch(resource, resource.toString(), index, query, true));
            this._aiFolderMatches.forEach(fm => this._aiFolderMatchesMap.set(fm.resource, fm));
            this._otherFilesMatch = this._createBaseFolderMatch(null, 'otherFiles', this._folderMatches.length + this._aiFolderMatches.length + 1, query, false);
            this._query = query;
        }
        setCachedSearchComplete(cachedSearchComplete, ai) {
            if (ai) {
                this._aiCachedSearchComplete = cachedSearchComplete;
            }
            else {
                this._cachedSearchComplete = cachedSearchComplete;
            }
        }
        getCachedSearchComplete(ai) {
            return ai ? this._aiCachedSearchComplete : this._cachedSearchComplete;
        }
        onDidAddNotebookEditorWidget(widget) {
            this._onWillChangeModelListener?.dispose();
            this._onWillChangeModelListener = widget.onWillChangeModel((model) => {
                if (model) {
                    this.onNotebookEditorWidgetRemoved(widget, model?.uri);
                }
            });
            this._onDidChangeModelListener?.dispose();
            // listen to view model change as we are searching on both inputs and outputs
            this._onDidChangeModelListener = widget.onDidAttachViewModel(() => {
                if (widget.hasModel()) {
                    this.onNotebookEditorWidgetAdded(widget, widget.textModel.uri);
                }
            });
        }
        onModelAdded(model) {
            const folderMatch = this._folderMatchesMap.findSubstr(model.uri);
            folderMatch?.bindModel(model);
        }
        async onNotebookEditorWidgetAdded(editor, resource) {
            const folderMatch = this._folderMatchesMap.findSubstr(resource);
            await folderMatch?.bindNotebookEditorWidget(editor, resource);
        }
        onNotebookEditorWidgetRemoved(editor, resource) {
            const folderMatch = this._folderMatchesMap.findSubstr(resource);
            folderMatch?.unbindNotebookEditorWidget(editor, resource);
        }
        _createBaseFolderMatch(resource, id, index, query, ai) {
            let folderMatch;
            if (resource) {
                folderMatch = this._register(this.instantiationService.createInstance(FolderMatchWorkspaceRoot, resource, id, index, query, this, ai));
            }
            else {
                folderMatch = this._register(this.instantiationService.createInstance(FolderMatchNoRoot, id, index, query, this));
            }
            const disposable = folderMatch.onChange((event) => this._onChange.fire(event));
            this._register(folderMatch.onDispose(() => disposable.dispose()));
            return folderMatch;
        }
        add(allRaw, searchInstanceID, ai, silent = false) {
            // Split up raw into a list per folder so we can do a batch add per folder.
            const { byFolder, other } = this.groupFilesByFolder(allRaw, ai);
            byFolder.forEach(raw => {
                if (!raw.length) {
                    return;
                }
                // ai results go into the respective folder
                const folderMatch = ai ? this.getAIFolderMatch(raw[0].resource) : this.getFolderMatch(raw[0].resource);
                folderMatch?.addFileMatch(raw, silent, searchInstanceID, ai);
            });
            if (!ai) {
                this._otherFilesMatch?.addFileMatch(other, silent, searchInstanceID, false);
            }
            this.disposePastResults();
        }
        clear() {
            this.folderMatches().forEach((folderMatch) => folderMatch.clear(true));
            this.folderMatches(true);
            this.disposeMatches();
            this._folderMatches = [];
            this._aiFolderMatches = [];
            this._otherFilesMatch = null;
        }
        remove(matches, ai = false) {
            if (!Array.isArray(matches)) {
                matches = [matches];
            }
            matches.forEach(m => {
                if (m instanceof FolderMatch) {
                    m.clear();
                }
            });
            const fileMatches = matches.filter(m => m instanceof FileMatch);
            const { byFolder, other } = this.groupFilesByFolder(fileMatches, ai);
            byFolder.forEach(matches => {
                if (!matches.length) {
                    return;
                }
                this.getFolderMatch(matches[0].resource).remove(matches);
            });
            if (other.length) {
                this.getFolderMatch(other[0].resource).remove(other);
            }
        }
        replace(match) {
            return this.getFolderMatch(match.resource).replace(match);
        }
        replaceAll(progress) {
            this.replacingAll = true;
            const promise = this.replaceService.replace(this.matches(), progress);
            return promise.then(() => {
                this.replacingAll = false;
                this.clear();
            }, () => {
                this.replacingAll = false;
            });
        }
        folderMatches(ai = false) {
            if (ai) {
                return this._aiFolderMatches;
            }
            return this._otherFilesMatch ?
                [
                    ...this._folderMatches,
                    this._otherFilesMatch
                ] :
                [
                    ...this._folderMatches
                ];
        }
        matches(ai = false) {
            const matches = [];
            this.folderMatches(ai).forEach(folderMatch => {
                matches.push(folderMatch.allDownstreamFileMatches());
            });
            return [].concat(...matches);
        }
        isEmpty(ai = false) {
            return this.folderMatches(ai).every((folderMatch) => folderMatch.isEmpty());
        }
        fileCount(ai = false) {
            return this.folderMatches(ai).reduce((prev, match) => prev + match.recursiveFileCount(), 0);
        }
        count(ai = false) {
            return this.matches(ai).reduce((prev, match) => prev + match.count(), 0);
        }
        get showHighlights() {
            return this._showHighlights;
        }
        toggleHighlights(value) {
            if (this._showHighlights === value) {
                return;
            }
            this._showHighlights = value;
            let selectedMatch = null;
            this.matches().forEach((fileMatch) => {
                fileMatch.updateHighlights();
                fileMatch.updateNotebookHighlights();
                if (!selectedMatch) {
                    selectedMatch = fileMatch.getSelectedMatch();
                }
            });
            if (this._showHighlights && selectedMatch) {
                // TS?
                this._rangeHighlightDecorations.highlightRange(selectedMatch.parent().resource, selectedMatch.range());
            }
            else {
                this._rangeHighlightDecorations.removeHighlightRange();
            }
        }
        get rangeHighlightDecorations() {
            return this._rangeHighlightDecorations;
        }
        getFolderMatch(resource) {
            const folderMatch = this._folderMatchesMap.findSubstr(resource);
            return folderMatch ? folderMatch : this._otherFilesMatch;
        }
        getAIFolderMatch(resource) {
            const folderMatch = this._aiFolderMatchesMap.findSubstr(resource);
            return folderMatch;
        }
        set replacingAll(running) {
            this.folderMatches().forEach((folderMatch) => {
                folderMatch.replacingAll = running;
            });
        }
        groupFilesByFolder(fileMatches, ai) {
            const rawPerFolder = new map_1.ResourceMap();
            const otherFileMatches = [];
            (ai ? this._aiFolderMatches : this._folderMatches).forEach(fm => rawPerFolder.set(fm.resource, []));
            fileMatches.forEach(rawFileMatch => {
                const folderMatch = ai ? this.getAIFolderMatch(rawFileMatch.resource) : this.getFolderMatch(rawFileMatch.resource);
                if (!folderMatch) {
                    // foldermatch was previously removed by user or disposed for some reason
                    return;
                }
                const resource = folderMatch.resource;
                if (resource) {
                    rawPerFolder.get(resource).push(rawFileMatch);
                }
                else {
                    otherFileMatches.push(rawFileMatch);
                }
            });
            return {
                byFolder: rawPerFolder,
                other: otherFileMatches
            };
        }
        disposeMatches() {
            this.folderMatches().forEach(folderMatch => folderMatch.dispose());
            this.folderMatches(true).forEach(folderMatch => folderMatch.dispose());
            this._folderMatches = [];
            this._aiFolderMatches = [];
            this._folderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._aiFolderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._rangeHighlightDecorations.removeHighlightRange();
        }
        async dispose() {
            this._onWillChangeModelListener?.dispose();
            this._onDidChangeModelListener?.dispose();
            this._rangeHighlightDecorations.dispose();
            this.disposeMatches();
            super.dispose();
            await this.disposePastResults();
        }
    };
    exports.SearchResult = SearchResult;
    exports.SearchResult = SearchResult = __decorate([
        __param(1, replace_1.IReplaceService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, model_2.IModelService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, notebookEditorService_1.INotebookEditorService)
    ], SearchResult);
    var SearchModelLocation;
    (function (SearchModelLocation) {
        SearchModelLocation[SearchModelLocation["PANEL"] = 0] = "PANEL";
        SearchModelLocation[SearchModelLocation["QUICK_ACCESS"] = 1] = "QUICK_ACCESS";
    })(SearchModelLocation || (exports.SearchModelLocation = SearchModelLocation = {}));
    let SearchModel = class SearchModel extends lifecycle_1.Disposable {
        constructor(searchService, telemetryService, configurationService, instantiationService, logService, notebookSearchService, progressService) {
            super();
            this.searchService = searchService;
            this.telemetryService = telemetryService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.notebookSearchService = notebookSearchService;
            this.progressService = progressService;
            this._searchQuery = null;
            this._replaceActive = false;
            this._replaceString = null;
            this._replacePattern = null;
            this._preserveCase = false;
            this._startStreamDelay = Promise.resolve();
            this._resultQueue = [];
            this._aiResultQueue = [];
            this._onReplaceTermChanged = this._register(new event_1.Emitter());
            this.onReplaceTermChanged = this._onReplaceTermChanged.event;
            this._onSearchResultChanged = this._register(new event_1.PauseableEmitter({
                merge: mergeSearchResultEvents
            }));
            this.onSearchResultChanged = this._onSearchResultChanged.event;
            this.currentCancelTokenSource = null;
            this.currentAICancelTokenSource = null;
            this.searchCancelledForNewSearch = false;
            this.aiSearchCancelledForNewSearch = false;
            this.location = SearchModelLocation.PANEL;
            this._searchResult = this.instantiationService.createInstance(SearchResult, this);
            this._register(this._searchResult.onChange((e) => this._onSearchResultChanged.fire(e)));
        }
        isReplaceActive() {
            return this._replaceActive;
        }
        set replaceActive(replaceActive) {
            this._replaceActive = replaceActive;
        }
        get replacePattern() {
            return this._replacePattern;
        }
        get replaceString() {
            return this._replaceString || '';
        }
        set preserveCase(value) {
            this._preserveCase = value;
        }
        get preserveCase() {
            return this._preserveCase;
        }
        set replaceString(replaceString) {
            this._replaceString = replaceString;
            if (this._searchQuery) {
                this._replacePattern = new replace_2.ReplacePattern(replaceString, this._searchQuery.contentPattern);
            }
            this._onReplaceTermChanged.fire();
        }
        get searchResult() {
            return this._searchResult;
        }
        async addAIResults(onProgress) {
            if (this.searchResult.count(true)) {
                // already has matches
                return;
            }
            else {
                if (this._searchQuery) {
                    await this.aiSearch({ ...this._searchQuery, contentPattern: this._searchQuery.contentPattern.pattern, type: 3 /* QueryType.aiText */ }, onProgress, this.currentCancelTokenSource?.token);
                }
            }
        }
        async doAISearchWithModal(searchQuery, searchInstanceID, token, onProgress) {
            const promise = this.searchService.aiTextSearch(searchQuery, token, async (p) => {
                this.onSearchProgress(p, searchInstanceID, false, true);
                onProgress?.(p);
            });
            return this.progressService.withProgress({
                location: 15 /* ProgressLocation.Notification */,
                type: 'syncing',
                title: 'Searching for AI results...',
            }, async (_) => promise);
        }
        aiSearch(query, onProgress, callerToken) {
            const searchInstanceID = Date.now().toString();
            const tokenSource = this.currentAICancelTokenSource = new cancellation_1.CancellationTokenSource(callerToken);
            const start = Date.now();
            const asyncAIResults = this.doAISearchWithModal(query, searchInstanceID, this.currentAICancelTokenSource.token, async (p) => {
                this.onSearchProgress(p, searchInstanceID, false, true);
                onProgress?.(p);
            })
                .then(value => {
                this.onSearchCompleted(value, Date.now() - start, searchInstanceID, true);
                return value;
            }, e => {
                this.onSearchError(e, Date.now() - start, true);
                throw e;
            }).finally(() => tokenSource.dispose());
            return asyncAIResults;
        }
        doSearch(query, progressEmitter, searchQuery, searchInstanceID, onProgress, callerToken) {
            const asyncGenerateOnProgress = async (p) => {
                progressEmitter.fire();
                this.onSearchProgress(p, searchInstanceID, false, false);
                onProgress?.(p);
            };
            const syncGenerateOnProgress = (p) => {
                progressEmitter.fire();
                this.onSearchProgress(p, searchInstanceID, true);
                onProgress?.(p);
            };
            const tokenSource = this.currentCancelTokenSource = new cancellation_1.CancellationTokenSource(callerToken);
            const notebookResult = this.notebookSearchService.notebookSearch(query, tokenSource.token, searchInstanceID, asyncGenerateOnProgress);
            const textResult = this.searchService.textSearchSplitSyncAsync(searchQuery, this.currentCancelTokenSource.token, asyncGenerateOnProgress, notebookResult.openFilesToScan, notebookResult.allScannedFiles);
            const syncResults = textResult.syncResults.results;
            syncResults.forEach(p => { if (p) {
                syncGenerateOnProgress(p);
            } });
            const getAsyncResults = async () => {
                const searchStart = Date.now();
                // resolve async parts of search
                const allClosedEditorResults = await textResult.asyncResults;
                const resolvedNotebookResults = await notebookResult.completeData;
                tokenSource.dispose();
                const searchLength = Date.now() - searchStart;
                const resolvedResult = {
                    results: [...allClosedEditorResults.results, ...resolvedNotebookResults.results],
                    messages: [...allClosedEditorResults.messages, ...resolvedNotebookResults.messages],
                    limitHit: allClosedEditorResults.limitHit || resolvedNotebookResults.limitHit,
                    exit: allClosedEditorResults.exit,
                    stats: allClosedEditorResults.stats,
                };
                this.logService.trace(`whole search time | ${searchLength}ms`);
                return resolvedResult;
            };
            return {
                asyncResults: getAsyncResults(),
                syncResults
            };
        }
        search(query, onProgress, callerToken) {
            this.cancelSearch(true);
            this._searchQuery = query;
            if (!this.searchConfig.searchOnType) {
                this.searchResult.clear();
            }
            const searchInstanceID = Date.now().toString();
            this._searchResult.query = this._searchQuery;
            const progressEmitter = this._register(new event_1.Emitter());
            this._replacePattern = new replace_2.ReplacePattern(this.replaceString, this._searchQuery.contentPattern);
            // In search on type case, delay the streaming of results just a bit, so that we don't flash the only "local results" fast path
            this._startStreamDelay = new Promise(resolve => setTimeout(resolve, this.searchConfig.searchOnType ? 150 : 0));
            const req = this.doSearch(query, progressEmitter, this._searchQuery, searchInstanceID, onProgress, callerToken);
            const asyncResults = req.asyncResults;
            const syncResults = req.syncResults;
            if (onProgress) {
                syncResults.forEach(p => {
                    if (p) {
                        onProgress(p);
                    }
                });
            }
            const start = Date.now();
            let event;
            const progressEmitterPromise = new Promise(resolve => {
                event = event_1.Event.once(progressEmitter.event)(resolve);
                return event;
            });
            Promise.race([asyncResults, progressEmitterPromise]).finally(() => {
                /* __GDPR__
                    "searchResultsFirstRender" : {
                        "owner": "roblourens",
                        "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                    }
                */
                event?.dispose();
                this.telemetryService.publicLog('searchResultsFirstRender', { duration: Date.now() - start });
            });
            try {
                return {
                    asyncResults: asyncResults.then(value => {
                        this.onSearchCompleted(value, Date.now() - start, searchInstanceID, false);
                        return value;
                    }, e => {
                        this.onSearchError(e, Date.now() - start, false);
                        throw e;
                    }),
                    syncResults
                };
            }
            finally {
                /* __GDPR__
                    "searchResultsFinished" : {
                        "owner": "roblourens",
                        "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                    }
                */
                this.telemetryService.publicLog('searchResultsFinished', { duration: Date.now() - start });
            }
        }
        onSearchCompleted(completed, duration, searchInstanceID, ai) {
            if (!this._searchQuery) {
                throw new Error('onSearchCompleted must be called after a search is started');
            }
            if (ai) {
                this._searchResult.add(this._aiResultQueue, searchInstanceID, true);
                this._aiResultQueue.length = 0;
            }
            else {
                this._searchResult.add(this._resultQueue, searchInstanceID, false);
                this._resultQueue.length = 0;
            }
            this.searchResult.setCachedSearchComplete(completed, ai);
            const options = Object.assign({}, this._searchQuery.contentPattern);
            delete options.pattern;
            const stats = completed && completed.stats;
            const fileSchemeOnly = this._searchQuery.folderQueries.every(fq => fq.folder.scheme === network_1.Schemas.file);
            const otherSchemeOnly = this._searchQuery.folderQueries.every(fq => fq.folder.scheme !== network_1.Schemas.file);
            const scheme = fileSchemeOnly ? network_1.Schemas.file :
                otherSchemeOnly ? 'other' :
                    'mixed';
            /* __GDPR__
                "searchResultsShown" : {
                    "owner": "roblourens",
                    "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "fileCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "options": { "${inline}": [ "${IPatternInfo}" ] },
                    "duration": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "type" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                    "scheme" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                    "searchOnTypeEnabled" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog('searchResultsShown', {
                count: this._searchResult.count(),
                fileCount: this._searchResult.fileCount(),
                options,
                duration,
                type: stats && stats.type,
                scheme,
                searchOnTypeEnabled: this.searchConfig.searchOnType
            });
            return completed;
        }
        onSearchError(e, duration, ai) {
            if (errors.isCancellationError(e)) {
                this.onSearchCompleted((ai ? this.aiSearchCancelledForNewSearch : this.searchCancelledForNewSearch)
                    ? { exit: 1 /* SearchCompletionExitCode.NewSearchStarted */, results: [], messages: [] }
                    : undefined, duration, '', ai);
                if (ai) {
                    this.aiSearchCancelledForNewSearch = false;
                }
                else {
                    this.searchCancelledForNewSearch = false;
                }
            }
        }
        onSearchProgress(p, searchInstanceID, sync = true, ai = false) {
            const targetQueue = ai ? this._aiResultQueue : this._resultQueue;
            if (p.resource) {
                targetQueue.push(p);
                if (sync) {
                    if (targetQueue.length) {
                        this._searchResult.add(targetQueue, searchInstanceID, false, true);
                        targetQueue.length = 0;
                    }
                }
                else {
                    this._startStreamDelay.then(() => {
                        if (targetQueue.length) {
                            this._searchResult.add(targetQueue, searchInstanceID, ai, true);
                            targetQueue.length = 0;
                        }
                    });
                }
            }
        }
        get searchConfig() {
            return this.configurationService.getValue('search');
        }
        cancelSearch(cancelledForNewSearch = false) {
            if (this.currentCancelTokenSource) {
                this.searchCancelledForNewSearch = cancelledForNewSearch;
                this.currentCancelTokenSource.cancel();
                return true;
            }
            return false;
        }
        cancelAISearch(cancelledForNewSearch = false) {
            if (this.currentAICancelTokenSource) {
                this.aiSearchCancelledForNewSearch = cancelledForNewSearch;
                this.currentAICancelTokenSource.cancel();
                return true;
            }
            return false;
        }
        dispose() {
            this.cancelSearch();
            this.cancelAISearch();
            this.searchResult.dispose();
            super.dispose();
        }
    };
    exports.SearchModel = SearchModel;
    exports.SearchModel = SearchModel = __decorate([
        __param(0, search_1.ISearchService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, log_1.ILogService),
        __param(5, notebookSearch_1.INotebookSearchService),
        __param(6, progress_1.IProgressService)
    ], SearchModel);
    let SearchViewModelWorkbenchService = class SearchViewModelWorkbenchService {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            this._searchModel = null;
        }
        get searchModel() {
            if (!this._searchModel) {
                this._searchModel = this.instantiationService.createInstance(SearchModel);
            }
            return this._searchModel;
        }
        set searchModel(searchModel) {
            this._searchModel?.dispose();
            this._searchModel = searchModel;
        }
    };
    exports.SearchViewModelWorkbenchService = SearchViewModelWorkbenchService;
    exports.SearchViewModelWorkbenchService = SearchViewModelWorkbenchService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], SearchViewModelWorkbenchService);
    exports.ISearchViewModelWorkbenchService = (0, instantiation_1.createDecorator)('searchViewModelWorkbenchService');
    /**
     * Can add a range highlight decoration to a model.
     * It will automatically remove it when the model has its decorations changed.
     */
    let RangeHighlightDecorations = class RangeHighlightDecorations {
        static { RangeHighlightDecorations_1 = this; }
        constructor(_modelService) {
            this._modelService = _modelService;
            this._decorationId = null;
            this._model = null;
            this._modelDisposables = new lifecycle_1.DisposableStore();
        }
        removeHighlightRange() {
            if (this._model && this._decorationId) {
                const decorationId = this._decorationId;
                this._model.changeDecorations((accessor) => {
                    accessor.removeDecoration(decorationId);
                });
            }
            this._decorationId = null;
        }
        highlightRange(resource, range, ownerId = 0) {
            let model;
            if (uri_1.URI.isUri(resource)) {
                model = this._modelService.getModel(resource);
            }
            else {
                model = resource;
            }
            if (model) {
                this.doHighlightRange(model, range);
            }
        }
        doHighlightRange(model, range) {
            this.removeHighlightRange();
            model.changeDecorations((accessor) => {
                this._decorationId = accessor.addDecoration(range, RangeHighlightDecorations_1._RANGE_HIGHLIGHT_DECORATION);
            });
            this.setModel(model);
        }
        setModel(model) {
            if (this._model !== model) {
                this.clearModelListeners();
                this._model = model;
                this._modelDisposables.add(this._model.onDidChangeDecorations((e) => {
                    this.clearModelListeners();
                    this.removeHighlightRange();
                    this._model = null;
                }));
                this._modelDisposables.add(this._model.onWillDispose(() => {
                    this.clearModelListeners();
                    this.removeHighlightRange();
                    this._model = null;
                }));
            }
        }
        clearModelListeners() {
            this._modelDisposables.clear();
        }
        dispose() {
            if (this._model) {
                this.removeHighlightRange();
                this._model = null;
            }
            this._modelDisposables.dispose();
        }
        static { this._RANGE_HIGHLIGHT_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'search-range-highlight',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'rangeHighlight',
            isWholeLine: true
        }); }
    };
    exports.RangeHighlightDecorations = RangeHighlightDecorations;
    exports.RangeHighlightDecorations = RangeHighlightDecorations = RangeHighlightDecorations_1 = __decorate([
        __param(0, model_2.IModelService)
    ], RangeHighlightDecorations);
    function textSearchResultToMatches(rawMatch, fileMatch, isAiContributed) {
        const previewLines = rawMatch.preview.text.split('\n');
        if (Array.isArray(rawMatch.ranges)) {
            return rawMatch.ranges.map((r, i) => {
                const previewRange = rawMatch.preview.matches[i];
                return new Match(fileMatch, previewLines, previewRange, r, isAiContributed);
            });
        }
        else {
            const previewRange = rawMatch.preview.matches;
            const match = new Match(fileMatch, previewLines, previewRange, rawMatch.ranges, isAiContributed);
            return [match];
        }
    }
    // text search to notebook matches
    function textSearchMatchesToNotebookMatches(textSearchMatches, cell) {
        const notebookMatches = [];
        textSearchMatches.forEach((textSearchMatch) => {
            const previewLines = textSearchMatch.preview.text.split('\n');
            if (Array.isArray(textSearchMatch.ranges)) {
                textSearchMatch.ranges.forEach((r, i) => {
                    const previewRange = textSearchMatch.preview.matches[i];
                    const match = new MatchInNotebook(cell, previewLines, previewRange, r, textSearchMatch.webviewIndex);
                    notebookMatches.push(match);
                });
            }
            else {
                const previewRange = textSearchMatch.preview.matches;
                const match = new MatchInNotebook(cell, previewLines, previewRange, textSearchMatch.ranges, textSearchMatch.webviewIndex);
                notebookMatches.push(match);
            }
        });
        return notebookMatches;
    }
    function arrayContainsElementOrParent(element, testArray) {
        do {
            if (testArray.includes(element)) {
                return true;
            }
        } while (!(element.parent() instanceof SearchResult) && (element = element.parent()));
        return false;
    }
    function getFileMatches(matches) {
        const folderMatches = [];
        const fileMatches = [];
        matches.forEach((e) => {
            if (e instanceof FileMatch) {
                fileMatches.push(e);
            }
            else {
                folderMatches.push(e);
            }
        });
        return fileMatches.concat(folderMatches.map(e => e.allDownstreamFileMatches()).flat());
    }
    function mergeSearchResultEvents(events) {
        const retEvent = {
            elements: [],
            added: false,
            removed: false,
        };
        events.forEach((e) => {
            if (e.added) {
                retEvent.added = true;
            }
            if (e.removed) {
                retEvent.removed = true;
            }
            retEvent.elements = retEvent.elements.concat(e.elements);
        });
        return retEvent;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9zZWFyY2hNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBKzZDaEcsa0RBb0VDO0lBRUQsZ0RBb0JDO0lBQ0Qsd0NBc0JDO0lBNjVCRCxnRkFpQkM7SUFFRCxvRUFRQztJQTU2RUQsTUFBYSxLQUFLO2lCQUVPLHNCQUFpQixHQUFHLEdBQUcsQ0FBQztRQVFoRCxZQUFzQixPQUFrQixFQUFVLGlCQUEyQixFQUFFLGlCQUErQixFQUFFLGNBQTRCLEVBQWtCLGFBQXNCO1lBQTlKLFlBQU8sR0FBUCxPQUFPLENBQVc7WUFBVSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQVU7WUFBaUYsa0JBQWEsR0FBYixhQUFhLENBQVM7WUFDbkwsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLGVBQWUsS0FBSyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDN0YsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUM7WUFDakMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUkscUJBQVksQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFdEcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGFBQUssQ0FDdEIsY0FBYyxDQUFDLGVBQWUsR0FBRyxDQUFDLEVBQ2xDLGNBQWMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUM5QixjQUFjLENBQUMsYUFBYSxHQUFHLENBQUMsRUFDaEMsY0FBYyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUUvQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7WUFFM0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMxRSxDQUFDO1FBRUQsRUFBRTtZQUNELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNqQixDQUFDO1FBRUQsTUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsSUFBSTtZQUNILE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ2pDLENBQUM7UUFFRCxLQUFLO1lBQ0osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFHRCxPQUFPO1lBQ04sTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsRUFDakcsTUFBTSxHQUFHLElBQUEsY0FBSSxFQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFcEMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUNqQyxLQUFLLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXBGLElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzdELE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMxQyxjQUFjLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNoQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFeEMsT0FBTztnQkFDTixNQUFNO2dCQUNOLFVBQVU7Z0JBQ1YsTUFBTTtnQkFDTixLQUFLO2FBQ0wsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLGFBQWE7WUFDaEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQztZQUN2RCxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLHVFQUF1RSxDQUFDLENBQUM7WUFDMUYsQ0FBQztZQUVELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUMzQyxJQUFJLGFBQWEsR0FBRyxXQUFXLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDekcsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sYUFBYSxDQUFDO1lBQ3RCLENBQUM7WUFFRCxxRkFBcUY7WUFDckYsTUFBTSxzQkFBc0IsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwRSxJQUFJLHNCQUFzQixLQUFLLGFBQWEsRUFBRSxDQUFDO2dCQUM5QyxhQUFhLEdBQUcsV0FBVyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsRUFBRSxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzlHLElBQUksYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO29CQUM1QixPQUFPLGFBQWEsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUM7WUFFRCxnRkFBZ0Y7WUFDaEYsTUFBTSxzQ0FBc0MsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hFLGFBQWEsR0FBRyxXQUFXLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLHNDQUFzQyxFQUFFLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM5SCxJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDNUIsT0FBTyxhQUFhLENBQUM7WUFDdEIsQ0FBQztZQUVELGdFQUFnRTtZQUNoRSxNQUFNLHlCQUF5QixHQUFHLHNDQUFzQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEcsSUFBSSx5QkFBeUIsS0FBSyxzQ0FBc0MsRUFBRSxDQUFDO2dCQUMxRSxhQUFhLEdBQUcsV0FBVyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyx5QkFBeUIsRUFBRSxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2pILElBQUksYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO29CQUM1QixPQUFPLGFBQWEsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUM7WUFFRCxpRkFBaUY7WUFDakYsT0FBTyxXQUFXLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQztRQUMzQyxDQUFDO1FBRUQsYUFBYSxDQUFDLGtCQUFrQixHQUFHLEtBQUs7WUFDdkMsSUFBSSxxQkFBK0IsQ0FBQztZQUNwQyxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3hCLHFCQUFxQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUNoRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AscUJBQXFCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZJLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzdKLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0YsQ0FBQztZQUVELE9BQU8scUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxjQUFjO1lBQ2Isd0NBQXdDO1lBQ3hDLE9BQU87Z0JBQ04sR0FBRyxJQUFJLENBQUMsaUJBQWlCO2dCQUN6QixXQUFXLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsR0FBRyxDQUFDO2dCQUNuRCxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsR0FBRyxDQUFDO2FBQy9DLENBQUM7UUFDSCxDQUFDO1FBRUQsZ0JBQWdCO1lBQ2YsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2SCxDQUFDO1FBRUQsY0FBYztZQUNiLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzdILENBQUM7O0lBdElGLHNCQXVJQztJQTFGQTtRQURDLG9CQUFPO3dDQW1CUDtJQTBFRixNQUFhLFNBQVM7UUFLckIsWUFDa0IsT0FBa0IsRUFDM0IsS0FBaUMsRUFDeEIsVUFBa0I7WUFGbEIsWUFBTyxHQUFQLE9BQU8sQ0FBVztZQUMzQixVQUFLLEdBQUwsS0FBSyxDQUE0QjtZQUN4QixlQUFVLEdBQVYsVUFBVSxDQUFRO1lBR25DLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7WUFDMUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQUMxRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1FBQzNDLENBQUM7UUFFTSxnQkFBZ0I7WUFDdEIsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssWUFBWSxpQ0FBZSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxPQUFPO1lBQ04sT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRUQsSUFBSSxjQUFjO1lBQ2pCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELElBQUksY0FBYztZQUNqQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFRCxNQUFNLENBQUMsT0FBNEM7WUFDbEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUNELEtBQUssTUFBTSxLQUFLLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6QyxDQUFDO1FBQ0YsQ0FBQztRQUVELGVBQWU7WUFDZCxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDOUIsQ0FBQztRQUVELGlCQUFpQixDQUFDLGlCQUFxQztZQUN0RCxNQUFNLGNBQWMsR0FBRyxrQ0FBa0MsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNuRixjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRU0sVUFBVSxDQUFDLGlCQUFxQztZQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQixxREFBcUQ7Z0JBQ3JELE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO2dCQUMvQyxNQUFNLHNCQUFzQixHQUFHLElBQUEsa0RBQWtDLEVBQUMsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBTSxDQUFDLENBQUM7Z0JBQzdILE1BQU0sUUFBUSxHQUFHLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFBLHNCQUFhLEVBQUMsTUFBTSxDQUFDLENBQTBDLENBQUMsQ0FBQztnQkFDNUgsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3FCQUMzRSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEYsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsaUJBQWlCLENBQUMsaUJBQXFDO1lBQ3RELE1BQU0sY0FBYyxHQUFHLGtDQUFrQyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ25GLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsdUNBQXVDO1FBQ3hDLENBQUM7UUFHRCxZQUFZLENBQUMsSUFBb0I7WUFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbkIsQ0FBQztRQUVELElBQUksTUFBTTtZQUNULE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsSUFBSSxFQUFFO1lBQ0wsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxHQUFHLHFDQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzlELENBQUM7UUFFRCxJQUFJLFNBQVM7WUFDWixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUVELElBQUksSUFBSTtZQUNQLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO0tBRUQ7SUFyR0QsOEJBcUdDO0lBRUQsTUFBYSxlQUFnQixTQUFRLEtBQUs7UUFHekMsWUFBNkIsV0FBc0IsRUFBRSxpQkFBMkIsRUFBRSxpQkFBK0IsRUFBRSxjQUE0QixFQUFFLFlBQXFCO1lBQ3JLLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUQzRCxnQkFBVyxHQUFYLFdBQVcsQ0FBVztZQUVsRCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEwsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7UUFDbkMsQ0FBQztRQUVRLE1BQU07WUFDZCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVPLHVCQUF1QjtZQUM5QixPQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDdEQsQ0FBQztRQUVNLGNBQWM7WUFDcEIsT0FBTyxJQUFJLENBQUMsYUFBYSxLQUFLLFNBQVMsQ0FBQztRQUN6QyxDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDeEUsQ0FBQztRQUVELElBQUksU0FBUztZQUNaLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUM7UUFDbkMsQ0FBQztRQUVELElBQUksWUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBSSxJQUFJO1lBQ1AsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztRQUM5QixDQUFDO0tBQ0Q7SUF4Q0QsMENBd0NDO0lBR00sSUFBTSxTQUFTLEdBQWYsTUFBTSxTQUFVLFNBQVEsc0JBQVU7O2lCQUVoQix3QkFBbUIsR0FBRyxrQ0FBc0IsQ0FBQyxRQUFRLENBQUM7WUFDN0UsV0FBVyxFQUFFLDJCQUEyQjtZQUN4QyxVQUFVLDREQUFvRDtZQUM5RCxNQUFNLEVBQUUsRUFBRTtZQUNWLFNBQVMsRUFBRSxrQkFBa0I7WUFDN0IsYUFBYSxFQUFFO2dCQUNkLEtBQUssRUFBRSxJQUFBLCtCQUFnQixFQUFDLGdEQUFnQyxDQUFDO2dCQUN6RCxRQUFRLEVBQUUseUJBQWlCLENBQUMsTUFBTTthQUNsQztZQUNELE9BQU8sRUFBRTtnQkFDUixLQUFLLEVBQUUsSUFBQSwrQkFBZ0IsRUFBQyxnQ0FBZ0IsQ0FBQztnQkFDekMsUUFBUSxnQ0FBd0I7YUFDaEM7U0FDRCxDQUFDLEFBYnlDLENBYXhDO2lCQUVxQixnQkFBVyxHQUFHLGtDQUFzQixDQUFDLFFBQVEsQ0FBQztZQUNyRSxXQUFXLEVBQUUsbUJBQW1CO1lBQ2hDLFVBQVUsNERBQW9EO1lBQzlELFNBQVMsRUFBRSxXQUFXO1lBQ3RCLGFBQWEsRUFBRTtnQkFDZCxLQUFLLEVBQUUsSUFBQSwrQkFBZ0IsRUFBQyxnREFBZ0MsQ0FBQztnQkFDekQsUUFBUSxFQUFFLHlCQUFpQixDQUFDLE1BQU07YUFDbEM7WUFDRCxPQUFPLEVBQUU7Z0JBQ1IsS0FBSyxFQUFFLElBQUEsK0JBQWdCLEVBQUMsZ0NBQWdCLENBQUM7Z0JBQ3pDLFFBQVEsZ0NBQXdCO2FBQ2hDO1NBQ0QsQ0FBQyxBQVppQyxDQVloQztRQUVLLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxRQUFpQjtZQUNuRCxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxXQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLFdBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBd0JELElBQVcsT0FBTztZQUNqQixPQUFPLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRUQsSUFBVyxXQUFXO1lBQ3JCLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1lBQzNELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNyQyxXQUFXLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xELENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxXQUFXLENBQUM7UUFDcEIsQ0FBQztRQVFELGFBQWE7UUFFYixZQUNTLE1BQW9CLEVBQ3BCLGVBQXNELEVBQ3RELFdBQStCLEVBQy9CLE9BQW9CLEVBQ3BCLFFBQW9CLEVBQ3BCLFlBQTZDLEVBQ3BDLGdCQUF3QixFQUMxQixZQUE0QyxFQUMxQyxjQUFnRCxFQUNsRCxZQUEyQixFQUNsQixxQkFBOEQ7WUFFdEYsS0FBSyxFQUFFLENBQUM7WUFaQSxXQUFNLEdBQU4sTUFBTSxDQUFjO1lBQ3BCLG9CQUFlLEdBQWYsZUFBZSxDQUF1QztZQUN0RCxnQkFBVyxHQUFYLFdBQVcsQ0FBb0I7WUFDL0IsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNwQixhQUFRLEdBQVIsUUFBUSxDQUFZO1lBQ3BCLGlCQUFZLEdBQVosWUFBWSxDQUFpQztZQUNwQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7WUFDVCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN6QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFFeEIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQXJEN0UsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXVELENBQUMsQ0FBQztZQUNoRyxhQUFRLEdBQStELElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1lBRTdGLGVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNoRCxjQUFTLEdBQWdCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBSWhELFdBQU0sR0FBc0IsSUFBSSxDQUFDO1lBQ2pDLG1CQUFjLEdBQXVCLElBQUksQ0FBQztZQUsxQyxtQkFBYyxHQUFpQixJQUFJLENBQUM7WUFJcEMsc0JBQWlCLEdBQWEsRUFBRSxDQUFDO1lBRWpDLGFBQVEsR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQWNsRCwwQkFBMEI7WUFDbEIsMEJBQXFCLEdBQWdDLElBQUksQ0FBQztZQUMxRCwwQkFBcUIsR0FBdUIsSUFBSSxDQUFDO1lBb09qRCxhQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBaE5wQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQWlCLENBQUM7WUFDN0MsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFDN0MsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksd0JBQWdCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksV0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM3RSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksR0FBRyxFQUFxQixDQUFDO1lBQ2pELElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLHdCQUFnQixDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekcsQ0FBQztRQUVELHVCQUF1QixDQUFDLE1BQWMsRUFBRSxjQUFrQztZQUN6RSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM3QixTQUFTLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNGLENBQUM7UUFFRCx1QkFBdUIsQ0FBQyxNQUFjLEVBQUUsY0FBa0M7WUFDekUsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsU0FBUyxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdDLENBQUM7UUFDRixDQUFDO1FBRUQsWUFBWSxDQUFDLE1BQWM7WUFDMUIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRUQsWUFBWSxDQUFDLE9BQWdFO1lBQzVFLE1BQU0sU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxJQUFBLHFEQUE2QixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hILElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRUQsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFFRCxrQkFBa0I7WUFDakIsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLGVBQWUsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBRUQsYUFBYSxDQUFDLGVBQXdCO1lBQ3JDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN6RCxJQUFJLEtBQUssSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMvQiw2R0FBNkc7Z0JBQzdHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQzlCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRTNHLElBQUksMEJBQTBCLEVBQUUsS0FBSyxFQUFFLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakUsQ0FBQztnQkFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTzt5QkFDbkIsTUFBTSxDQUFDLHNCQUFhLENBQUM7eUJBQ3JCLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTt3QkFDbkIseUJBQXlCLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxlQUFlLENBQUM7NkJBQ3hELE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDN0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQztnQkFFRCxJQUFJLElBQUEscURBQTZCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUEsbURBQTJCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ2hHLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDcEUsSUFBSSxDQUFDLCtDQUErQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO29CQUN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2pELENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hDLENBQUM7UUFDRixDQUFDO1FBRUQsU0FBUyxDQUFDLEtBQWlCO1lBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3pELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDekIsQ0FBQztRQUVPLGtCQUFrQjtZQUN6Qiw2REFBNkQ7WUFDN0QsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFFTyxXQUFXO1lBQ2xCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtvQkFDMUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hGLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUNuQixJQUFJLENBQUMsY0FBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hDLENBQUM7UUFDRixDQUFDO1FBRU8scUJBQXFCO1lBQzVCLCtDQUErQztZQUMvQyxvQ0FBb0M7WUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbEIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO1lBRTdDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ2pILE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNO2lCQUN6QixXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRS9MLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFJUyxLQUFLLENBQUMsaUNBQWlDLENBQUMsVUFBa0IsRUFBRSxXQUFvQjtZQUN6RixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHO2dCQUNiLGVBQWUsRUFBRSxVQUFVO2dCQUMzQixXQUFXLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7Z0JBQ3JELGFBQWEsRUFBRSxVQUFVO2dCQUN6QixTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7YUFDbkQsQ0FBQztZQUNGLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxlQUFlLEtBQUssVUFBVSxDQUFDLENBQUM7WUFDeEgsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEUsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDakgsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQy9MLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTdELDZDQUE2QztRQUM5QyxDQUFDO1FBSU8sYUFBYSxDQUFDLE9BQW9CLEVBQUUsV0FBb0IsRUFBRSxLQUFpQixFQUFFLGVBQXdCO1lBQzVHLE1BQU0saUJBQWlCLEdBQUcsSUFBQSxnREFBZ0MsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNqRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtnQkFDNUMseUJBQXlCLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDbEYsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDL0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDaEIsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7NEJBQ2pDLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO3dCQUM3QixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxVQUFVLENBQUMsSUFBQSxrREFBa0MsRUFBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQU0sQ0FBQyxDQUFDLENBQUM7WUFFN0csSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3pCLENBQUM7UUFFRCxnQkFBZ0I7WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDMUMsTUFBTSxjQUFjLEdBQUcsQ0FDdEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLGNBQWM7b0JBQzNCLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBdUI7d0JBQ3BELEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFO3dCQUNwQixPQUFPLEVBQUUsV0FBUyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQ25FLENBQUEsQ0FBQztvQkFDRixDQUFDLENBQUMsRUFBRSxDQUNMLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDNUYsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsRUFBRTtZQUNELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBRUQsTUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsT0FBTztZQUNOLE1BQU0sV0FBVyxHQUFzQixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzFHLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxXQUFXLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsV0FBVztZQUNWLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVELFdBQVc7WUFDVixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxNQUFNLENBQUMsT0FBd0I7WUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVELEtBQUssTUFBTSxLQUFLLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUdELEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBZ0I7WUFDN0IsT0FBTyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUN2RCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELGdCQUFnQixDQUFDLEtBQW1CO1lBQ25DLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBRVgsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxZQUFZLGVBQWUsRUFBRSxDQUFDO29CQUN0RSxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztvQkFDNUIsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUN4QyxPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLE9BQU87Z0JBQ1IsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztZQUM1QixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRUQsZ0JBQWdCO1lBQ2YsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQzVCLENBQUM7UUFFRCxlQUFlLENBQUMsS0FBWTtZQUMzQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLEtBQUssS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3pFLENBQUM7UUFFRCxLQUFLO1lBQ0osT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQzlCLENBQUM7UUFFRCxJQUFJLFFBQVE7WUFDWCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQUk7WUFDSCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxVQUFVLENBQUMsT0FBd0M7WUFDbEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUFDLE9BQU87WUFBQyxDQUFDO1lBRXpCLE1BQU0sUUFBUSxHQUFHLE9BQU87aUJBQ3RCLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQ2pCLENBQUMsSUFBQSxzQkFBYSxFQUFDLE1BQU0sQ0FBQyxDQUEwQyxDQUFDLENBQUM7WUFFcEUsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBRUQsR0FBRyxDQUFDLEtBQVksRUFBRSxPQUFpQjtZQUNsQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekMsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDakQsQ0FBQztRQUNGLENBQUM7UUFFTyxXQUFXLENBQUMsS0FBWTtZQUUvQixJQUFJLEtBQUssWUFBWSxlQUFlLEVBQUUsQ0FBQztnQkFDdEMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9CLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQy9DLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLElBQUksQ0FBQyx5QkFBeUIsRUFBRSwrQkFBK0IsRUFBRSxDQUFDO1lBQ25FLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUN6QixDQUFDO1lBQ0QsSUFBSSxLQUFLLFlBQVksZUFBZSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQywrQ0FBK0MsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUMxRSxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsV0FBeUI7WUFDOUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRUQsSUFBVyxRQUFRO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUN2QixDQUFDO1FBRUQsSUFBVyxRQUFRLENBQUMsSUFBOEM7WUFDakUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdkIsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdkIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxzQkFBc0I7WUFDckIsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLFlBQVksZUFBZSxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEcsQ0FBQztRQUVELG9DQUFvQztRQUNwQyx3QkFBd0IsQ0FBQyxNQUE0QjtZQUNwRCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDM0MsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsTUFBTSxDQUFDO1lBRXBDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsU0FBUyxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzNGLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssd0NBQXVCLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyx3Q0FBdUIsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO29CQUNoSixPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztZQUNYLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFRCwwQkFBMEIsQ0FBQyxNQUE2QjtZQUN2RCxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ3JELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMscUJBQXFCLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDdkMsQ0FBQztZQUNELElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7UUFDbkMsQ0FBQztRQUVELHdCQUF3QjtZQUN2QixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQywrQ0FBK0MsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUNsQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLHNCQUFzQjtZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ2pDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLHlCQUF5QixFQUFFLGVBQWUsRUFBRSxDQUFDO1lBQ2xELElBQUksQ0FBQyx5QkFBeUIsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxtREFBd0IsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDakgsSUFBSSxJQUFJLENBQUMsY0FBYyxZQUFZLGVBQWUsRUFBRSxDQUFDO2dCQUNwRCxJQUFJLENBQUMsbUNBQW1DLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQy9ELENBQUM7UUFDRixDQUFDO1FBRU8seUJBQXlCO1lBQ2hDLElBQUksSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxlQUFlLEVBQUUsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLHlCQUF5QixFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMseUJBQXlCLEdBQUcsU0FBUyxDQUFDO1lBQzVDLENBQUM7UUFDRixDQUFDO1FBRU8scUJBQXFCLENBQUMsT0FBaUMsRUFBRSxXQUFvQjtZQUNwRixJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ2pDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQW9CLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNyRSxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztnQkFDOUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN4RSxDQUFDO1lBQ0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDdkIsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxJQUFJLENBQUMscUJBQXFCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDakQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2xFLE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRyxxQ0FBYSxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQ3ZFLElBQUksZUFBZSxFQUFFLENBQUM7d0JBQ3JCLGVBQWUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUN6QyxlQUFlLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQ2xDLFlBQVksR0FBRyxlQUFlLENBQUM7b0JBQ2hDLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxZQUFZLEVBQUUsZUFBZSxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sSUFBSSxHQUFHLFlBQVksSUFBSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLHlEQUFpQyxFQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzVGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLHlEQUFpQyxFQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUNoRixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXRDLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RFLElBQUksSUFBSSxDQUFDLGNBQWMsWUFBWSxlQUFlLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFTywrQ0FBK0MsQ0FBQyxLQUFrQjtZQUN6RSxJQUFJLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxhQUFhLEdBQTZCLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDbEUsTUFBTSxjQUFjLEdBQTJCLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUM5RSxPQUE2Qjt3QkFDNUIsS0FBSyxFQUFFLEtBQUssQ0FBQyxZQUFZO3FCQUN6QixDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO2dCQUNILE1BQU0sV0FBVyxHQUFnQixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDaEUsT0FBTyxJQUFJLGlCQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckQsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsT0FBK0I7b0JBQzlCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtvQkFDZixLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVM7b0JBQ3JCLGNBQWMsRUFBRSxXQUFXO29CQUMzQixjQUFjLEVBQUUsY0FBYztpQkFDOUIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyw0QkFBNEIsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM1RSxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixzRUFBc0U7WUFDdkUsQ0FBQztRQUNGLENBQUM7UUFDRCxLQUFLLENBQUMsNEJBQTRCO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDakMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO1lBRTdDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ2pILE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQjtpQkFDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO2dCQUMxQixLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRO2dCQUMzQixTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXO2dCQUNsQyxhQUFhLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlO2dCQUMxQyxjQUFjLEVBQUUsY0FBYyxJQUFJLFNBQVM7Z0JBQzNDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLHlCQUF5QjtnQkFDdkUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsMkJBQTJCO2dCQUMzRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxxQkFBcUI7Z0JBQ2pFLGFBQWEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxzQkFBc0I7YUFDL0QsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUVoRSxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTSxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQXNCO1lBQzVDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLG1DQUFtQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRU8sS0FBSyxDQUFDLG1DQUFtQyxDQUFDLEtBQXNCO1lBQ3ZFLElBQUksQ0FBQyxJQUFJLENBQUMseUJBQXlCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3BELHVFQUF1RTtnQkFDdkUsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsSUFBSSxLQUFLLENBQUMsWUFBWSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyx5Q0FBeUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzVHLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyw0Q0FBNEMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNwSCxDQUFDO1FBQ0YsQ0FBQztRQUVPLGVBQWUsQ0FBQyxLQUFzQixFQUFFLFlBQTJCO1lBQzFFLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hELHVFQUF1RTtnQkFDdkUsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLEtBQUssQ0FBQyxZQUFZLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3RDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsWUFBWSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNwRixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztnQkFDM0UsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQzdFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx5Q0FBeUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ2pHLENBQUM7UUFDRixDQUFDOztJQTFrQlcsOEJBQVM7d0JBQVQsU0FBUztRQXFGbkIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsWUFBQSw4Q0FBc0IsQ0FBQTtPQXhGWixTQUFTLENBNmtCckI7SUFTTSxJQUFNLFdBQVcsbUJBQWpCLE1BQU0sV0FBWSxTQUFRLHNCQUFVO1FBZ0IxQyxZQUNXLFNBQXFCLEVBQ3ZCLEdBQVcsRUFDVCxNQUFjLEVBQ2QsTUFBa0IsRUFDcEIsT0FBbUMsRUFDbkMsYUFBMkIsRUFDM0IsWUFBNkMsRUFDcEMsY0FBZ0QsRUFDMUMsb0JBQThELEVBQ3RFLFlBQTJCLEVBQ3JCLGtCQUEwRDtZQUUvRSxLQUFLLEVBQUUsQ0FBQztZQVpFLGNBQVMsR0FBVCxTQUFTLENBQVk7WUFDdkIsUUFBRyxHQUFILEdBQUcsQ0FBUTtZQUNULFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxXQUFNLEdBQU4sTUFBTSxDQUFZO1lBQ3BCLFlBQU8sR0FBUCxPQUFPLENBQTRCO1lBQ25DLGtCQUFhLEdBQWIsYUFBYSxDQUFjO1lBQzNCLGlCQUFZLEdBQVosWUFBWSxDQUFpQztZQUNuQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDdkIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUU3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBekJ0RSxjQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZ0IsQ0FBQyxDQUFDO1lBQ3pELGFBQVEsR0FBd0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7WUFFdEQsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2hELGNBQVMsR0FBZ0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFPaEQsa0JBQWEsR0FBWSxLQUFLLENBQUM7WUFpQnRDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxpQkFBVyxFQUFhLENBQUM7WUFDakQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLGlCQUFXLEVBQTJCLENBQUM7WUFDakUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLHFDQUFpQixDQUFDLE9BQU8sQ0FBMEIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDekksSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksaUJBQVcsRUFBYSxDQUFDO1lBQzNELElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLGlCQUFXLEVBQTJCLENBQUM7WUFDM0UsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFdBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuRyxDQUFDO1FBRUQsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztRQUN2QyxDQUFDO1FBRUQsSUFBSSxjQUFjO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRUQsSUFBSSxZQUFZLENBQUMsQ0FBVTtZQUMxQixJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBRUQsRUFBRTtZQUNELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNqQixDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxLQUFLO1lBQ0osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFJO1lBQ0gsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUN6QixDQUFDO1FBRUQsTUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsU0FBUyxDQUFDLEtBQWlCO1lBQzFCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVuRCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLEtBQUssR0FBRyxXQUFXLEVBQUUsc0JBQXNCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM3RCxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLHdCQUF3QixDQUFDLE1BQTRCLEVBQUUsUUFBYTtZQUN6RSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVsRCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDM0MsTUFBTSxTQUFTLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztZQUNoRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ25ELEtBQUssTUFBTSxJQUFJLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ2xDLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsMEJBQTBCLENBQUMsTUFBNEIsRUFBRSxRQUFhO1lBQ3JFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRWxELElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsU0FBUyxDQUFDLDBCQUEwQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDbkQsS0FBSyxNQUFNLElBQUksSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDbEMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztZQUNGLENBQUM7UUFFRixDQUFDO1FBRU0sNkJBQTZCLENBQUMsUUFBYSxFQUFFLEVBQVUsRUFBRSxLQUFhLEVBQUUsS0FBaUIsRUFBRSxtQkFBNkM7WUFDOUksTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVCQUF1QixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDakwsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUIsT0FBTyxXQUFXLENBQUM7UUFDcEIsQ0FBQztRQUVNLDBCQUEwQixDQUFDLFdBQW9DO1lBQ3JFLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDNUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLEdBQUcsS0FBSztZQUN4QixNQUFNLE9BQU8sR0FBZ0IsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDN0QsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBRUQsTUFBTSxDQUFDLE9BQXNGO1lBQzVGLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JCLENBQUM7WUFDRCxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFnQjtZQUM3QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNyRCxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM5QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxVQUFVO1lBQ1QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQy9CLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsT0FBTztZQUNOLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQsbUJBQW1CO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBRUQsT0FBTztZQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxzQkFBc0IsQ0FBQyxHQUFRO1lBQzlCLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEQsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO2dCQUMxQixPQUFPLG9CQUFvQixDQUFDO1lBQzdCLENBQUM7WUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sS0FBSyxHQUFHLFdBQVcsRUFBRSxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2RCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELHdCQUF3QjtZQUN2QixJQUFJLGlCQUFpQixHQUFnQixFQUFFLENBQUM7WUFDeEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDOUMsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDN0IsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7WUFDL0UsQ0FBQztZQUVELE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEdBQUcsaUJBQWlCLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRU8sU0FBUztZQUNoQixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBQy9CLENBQUM7UUFFTyxXQUFXO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUM7UUFDakMsQ0FBQztRQUVELEtBQUs7WUFDSixPQUFPLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDOUMsQ0FBQztRQUVELGtCQUFrQjtZQUNqQixPQUFPLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUMvQyxDQUFDO1FBRUQsbUJBQW1CO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUMsTUFBTSxDQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqRyxDQUFDO1FBRUQsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxZQUFZLENBQUMsR0FBaUIsRUFBRSxNQUFlLEVBQUUsZ0JBQXdCLEVBQUUsZUFBd0I7WUFDbEcsNERBQTREO1lBQzVELE1BQU0sS0FBSyxHQUFnQixFQUFFLENBQUM7WUFDOUIsTUFBTSxPQUFPLEdBQWdCLEVBQUUsQ0FBQztZQUVoQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUMxQixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzdFLElBQUksaUJBQWlCLEVBQUUsQ0FBQztvQkFFdkIsSUFBSSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQzFCLFlBQVk7NkJBQ1YsT0FBTzs2QkFDUCxNQUFNLENBQUMsc0JBQWEsQ0FBQzs2QkFDckIsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFOzRCQUNaLHlCQUF5QixDQUFDLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUM7aUNBQzlELE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUMxQyxDQUFDLENBQUMsQ0FBQztvQkFDTCxDQUFDO29CQUVELG1CQUFtQjtvQkFDbkIsSUFBSSxJQUFBLHFEQUE2QixFQUFDLFlBQVksQ0FBQyxJQUFJLElBQUEsbURBQTJCLEVBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQzt3QkFDOUYsWUFBWSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7NEJBQ2hELE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxDQUFDLElBQUEsbURBQTJCLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzs0QkFDcEcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO2dDQUN2QixpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7Z0NBQ2pFLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQzs0QkFDbEUsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQzs0QkFDOUMsQ0FBQzt3QkFDRixDQUFDLENBQUMsQ0FBQztvQkFDSixDQUFDO29CQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFFaEMsSUFBSSxZQUFZLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUM3RCxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNwRCxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLElBQUksWUFBWSx3QkFBd0IsSUFBSSxJQUFJLFlBQVksaUJBQWlCLEVBQUUsQ0FBQzt3QkFDbkYsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO3dCQUNuRixLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUN2QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxLQUFLLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUMxRCxDQUFDO1FBQ0YsQ0FBQztRQUVELFNBQVMsQ0FBQyxTQUFvQjtZQUM3QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDekQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEQsQ0FBQztRQUNGLENBQUM7UUFFRCxzQkFBc0I7WUFDckIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFFUyxZQUFZLENBQUMsTUFBVyxFQUFFLEtBQVU7WUFDN0MsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDaEksQ0FBQztRQUVPLGVBQWUsQ0FBQyxXQUFvQztZQUUzRCxJQUFJLFNBQVMsR0FBK0IsSUFBSSxDQUFDO1lBQ2pELE9BQU8sU0FBUyxZQUFZLGFBQVcsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLFNBQVMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztvQkFDekMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFDRCxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2hDLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTSxjQUFjLENBQUMsUUFBYTtZQUNsQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxXQUFXLENBQUMsV0FBb0M7WUFDL0MsSUFBSSxJQUFJLFlBQVksdUJBQXVCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hHLE1BQU0sS0FBSyxDQUFDLEdBQUcsV0FBVyxDQUFDLFFBQVEsa0NBQWtDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLE1BQU0sS0FBSyxDQUFDLEdBQUcsV0FBVyxDQUFDLFFBQVEsbUJBQW1CLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLENBQUM7WUFFRCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM5RCxJQUFJLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzdELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVELENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFnRDtZQUMxRSxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFM0MsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFTSxZQUFZLENBQUMsU0FBb0IsRUFBRSxPQUFPLEdBQUcsS0FBSztZQUN4RCxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMxQixLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM3QyxLQUFLLEdBQUcsS0FBSyxDQUFDO2dCQUNkLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNoRixDQUFDO1FBQ0YsQ0FBQztRQUVNLGNBQWMsQ0FBQyxXQUFvQyxFQUFFLEtBQW1CO1lBQzlFLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBQ0QsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNqRCxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkIsQ0FBQztZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFTyxZQUFZLENBQUMsV0FBd0IsRUFBRSxVQUFtQixJQUFJLEVBQUUsVUFBbUIsSUFBSSxFQUFFLFlBQVksR0FBRyxLQUFLO1lBRXBILE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNuQixLQUFLLE1BQU0sS0FBSyxJQUFJLFdBQTBCLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDM0MsSUFBSSxZQUFZLElBQUksS0FBSyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQzt3QkFDaEQsU0FBUztvQkFDVixDQUFDO29CQUNELElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDekMsSUFBSSxPQUFPLEVBQUUsQ0FBQzt3QkFDYixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2pCLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3hELENBQUM7b0JBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNuRCxJQUFJLE1BQU0sRUFBRSxDQUFDO3dCQUNaLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ2hELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxNQUFNLEtBQUssQ0FBQyxhQUFhLEtBQUssQ0FBQyxRQUFRLHNDQUFzQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDL0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzNELENBQUM7UUFDRixDQUFDO1FBRU8sY0FBYztZQUNyQixDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQW9CLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBd0IsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFDdEcsQ0FBQyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQW9CLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2pHLENBQUMsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUF3QixFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztZQUNoSCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QyxDQUFDO1FBRVEsT0FBTztZQUNmLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0QsQ0FBQTtJQTFZWSxrQ0FBVzswQkFBWCxXQUFXO1FBd0JyQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFlBQUEsaUNBQW1CLENBQUE7T0EzQlQsV0FBVyxDQTBZdkI7SUFFTSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLFdBQVc7UUFJdkQsWUFBWSxTQUFjLEVBQUUsR0FBVyxFQUFFLE1BQWMsRUFBRSxNQUFrQixFQUFFLE9BQW1DLEVBQUUsYUFBMkIsRUFBRSxZQUE2QyxFQUMxSyxjQUErQixFQUN6QixvQkFBMkMsRUFDbkQsWUFBMkIsRUFDckIsa0JBQXVDO1lBRTVELEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLG9CQUFvQixFQUFFLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3BKLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLFdBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUNoSixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25CLENBQUM7UUFFRCxJQUFhLFFBQVE7WUFDcEIsT0FBTyxJQUFJLENBQUMsU0FBVSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxJQUFJLGtCQUFrQjtZQUNyQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7UUFDdkMsQ0FBQztLQUNELENBQUE7SUF0QlksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFLakMsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFCQUFhLENBQUE7UUFDYixZQUFBLGlDQUFtQixDQUFBO09BUlQsdUJBQXVCLENBc0JuQztJQUVEOztPQUVHO0lBQ0ksSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSx1QkFBdUI7UUFDcEUsWUFBWSxTQUFjLEVBQUUsR0FBVyxFQUFFLE1BQWMsRUFBRSxNQUFrQixFQUFFLE9BQXFCLEVBQW1CLEdBQVksRUFDL0csY0FBK0IsRUFDekIsb0JBQTJDLEVBQ25ELFlBQTJCLEVBQ3JCLGtCQUF1QztZQUU1RCxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQU5sQixRQUFHLEdBQUgsR0FBRyxDQUFTO1FBT2pJLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxHQUFRO1lBQ25DLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBRU8sU0FBUyxDQUFDLElBQVMsRUFBRSxHQUFRO1lBQ3BDLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFTyxlQUFlLENBQUMsS0FBbUIsRUFBRSxjQUFxRCxFQUFFLFVBQThCLEVBQUUsTUFBbUIsRUFBRSxZQUF3QixFQUFFLFdBQTRDLEVBQUUsZ0JBQXdCO1lBQ3hQLE1BQU0sU0FBUyxHQUNkLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQ3ZDLFNBQVMsRUFDVCxLQUFLLEVBQ0wsY0FBYyxFQUNkLFVBQVUsRUFDVixNQUFNLEVBQ04sWUFBWSxFQUNaLFdBQVcsRUFDWCxnQkFBZ0IsQ0FDaEIsQ0FBQztZQUNILFNBQVMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUIsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDcEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEUsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELDJCQUEyQixDQUFDLFlBQTZCLEVBQUUsZ0JBQXdCO1lBRWxGLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzlELE1BQU0sS0FBSyxDQUFDLEdBQUcsWUFBWSxDQUFDLFFBQVEsMkJBQTJCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2pGLENBQUM7WUFFRCxNQUFNLG9CQUFvQixHQUFVLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTFELE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0RCxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQztnQkFDcEIsR0FBRyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hHLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDbEMsTUFBTSxLQUFLLENBQUMsR0FBRyxZQUFZLENBQUMsUUFBUSw4Q0FBOEMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztnQkFDOUcsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQztZQUN0QyxJQUFJLE1BQU0sR0FBZ0IsSUFBSSxDQUFDO1lBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdEQsSUFBSSxXQUFXLEdBQXdDLE1BQU0sQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNsQixXQUFXLEdBQUcsTUFBTSxDQUFDLDZCQUE2QixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hJLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLFdBQVcsQ0FBQztZQUN0QixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDM0osQ0FBQztLQUNELENBQUE7SUFuRVksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFFbEMsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLGlDQUFtQixDQUFBO09BTFQsd0JBQXdCLENBbUVwQztJQUVEOzs7T0FHRztJQUNJLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsV0FBVztRQUNqRCxZQUFZLEdBQVcsRUFBRSxNQUFjLEVBQUUsTUFBa0IsRUFBRSxPQUFxQixFQUNoRSxjQUErQixFQUN6QixvQkFBMkMsRUFDbkQsWUFBMkIsRUFDckIsa0JBQXVDO1lBRzVELEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLG9CQUFvQixFQUFFLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2xJLENBQUM7UUFFRCwyQkFBMkIsQ0FBQyxZQUF3QixFQUFFLGdCQUF3QjtZQUM3RSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQ3hFLFNBQVMsRUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUN0QixJQUFJLEVBQUUsWUFBWSxFQUNsQixJQUFJLEVBQ0osZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxpRUFBaUU7WUFDakcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMxQixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNsRyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRSxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO0tBQ0QsQ0FBQTtJQTFCWSw4Q0FBaUI7Z0NBQWpCLGlCQUFpQjtRQUUzQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsaUNBQW1CLENBQUE7T0FMVCxpQkFBaUIsQ0EwQjdCO0lBRUQsSUFBSSxVQUFVLEdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDNUIsSUFBSSxVQUFVLEdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDNUI7OztPQUdHO0lBQ0gsU0FBZ0IsbUJBQW1CLENBQUMsUUFBeUIsRUFBRSxRQUF5QixFQUFFLG1EQUFvRDtRQUU3SSxJQUFJLFFBQVEsWUFBWSxTQUFTLElBQUksUUFBUSxZQUFZLFdBQVcsRUFBRSxDQUFDO1lBQ3RFLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUVELElBQUksUUFBUSxZQUFZLFNBQVMsSUFBSSxRQUFRLFlBQVksV0FBVyxFQUFFLENBQUM7WUFDdEUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7UUFFRCxJQUFJLFFBQVEsWUFBWSxXQUFXLElBQUksUUFBUSxZQUFZLFdBQVcsRUFBRSxDQUFDO1lBQ3hFLFVBQVUsR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDOUIsVUFBVSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5QixJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsSUFBSSxVQUFVLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsT0FBTyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQ2hDLENBQUM7WUFFRCxRQUFRLFNBQVMsRUFBRSxDQUFDO2dCQUNuQjtvQkFDQyxPQUFPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzVDO29CQUNDLE9BQU8sUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDNUM7b0JBQ0MsT0FBTyxJQUFBLGlDQUFxQixFQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDaEU7b0JBQ0MsT0FBTyxJQUFBLDRCQUFnQixFQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDM0QseUJBQXlCO2dCQUN6QjtvQkFDQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDOUMsT0FBTyxDQUFDLENBQUM7b0JBQ1YsQ0FBQztvQkFDRCxPQUFPLElBQUEsd0JBQVksRUFBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUEsNEJBQWdCLEVBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2hJLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxRQUFRLFlBQVksU0FBUyxJQUFJLFFBQVEsWUFBWSxTQUFTLEVBQUUsQ0FBQztZQUNwRSxRQUFRLFNBQVMsRUFBRSxDQUFDO2dCQUNuQjtvQkFDQyxPQUFPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzVDO29CQUNDLE9BQU8sUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDNUM7b0JBQ0MsT0FBTyxJQUFBLGlDQUFxQixFQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDaEU7b0JBQ0MsT0FBTyxJQUFBLDRCQUFnQixFQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDM0QsOENBQTZCLENBQUMsQ0FBQyxDQUFDO29CQUMvQixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO29CQUNwQyxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO29CQUNwQyxJQUFJLFNBQVMsSUFBSSxTQUFTLEVBQUUsQ0FBQzt3QkFDNUIsT0FBTyxTQUFTLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7b0JBRTFDLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCx5QkFBeUI7Z0JBQ3pCO29CQUNDLE9BQU8sSUFBQSx3QkFBWSxFQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksSUFBQSw0QkFBZ0IsRUFBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFDaEksQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLFFBQVEsWUFBWSxlQUFlLElBQUksUUFBUSxZQUFZLGVBQWUsRUFBRSxDQUFDO1lBQ2hGLE9BQU8sa0JBQWtCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxJQUFJLFFBQVEsWUFBWSxLQUFLLElBQUksUUFBUSxZQUFZLEtBQUssRUFBRSxDQUFDO1lBQzVELE9BQU8sYUFBSyxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRUQsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO0lBRUQsU0FBZ0Isa0JBQWtCLENBQUMsTUFBdUIsRUFBRSxNQUF1QjtRQUNsRixJQUFJLE1BQU0sQ0FBQyxTQUFTLEtBQUssTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBRTNDLElBQUksTUFBTSxDQUFDLFlBQVksS0FBSyxTQUFTLElBQUksTUFBTSxDQUFDLFlBQVksS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDNUUsT0FBTyxNQUFNLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7WUFDbEQsQ0FBQztpQkFBTSxJQUFJLE1BQU0sQ0FBQyxZQUFZLEtBQUssU0FBUyxJQUFJLE1BQU0sQ0FBQyxZQUFZLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ25GLE9BQU8sYUFBSyxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUN2RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AseURBQXlEO2dCQUN6RCxJQUFJLE1BQU0sQ0FBQyxZQUFZLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3ZDLE9BQU8sQ0FBQyxDQUFDO2dCQUNWLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQzthQUFNLElBQUksTUFBTSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDaEQsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO0lBQ0YsQ0FBQztJQUNELFNBQWdCLGNBQWMsQ0FBQyxRQUF5QixFQUFFLFFBQXlCLEVBQUUsbURBQW9EO1FBQ3hJLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRWhELElBQUksQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDekIsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELE9BQU8sbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RSxDQUFDO1lBQ0QsQ0FBQyxFQUFFLENBQUM7WUFDSixDQUFDLEVBQUUsQ0FBQztRQUNMLENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFM0IsSUFBSSxVQUFVLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUMvQixPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7YUFBTSxJQUFJLENBQUMsVUFBVSxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ3RDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDO1FBQ0QsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUF3QjtRQUNqRCxNQUFNLFdBQVcsR0FBc0IsRUFBRSxDQUFDO1FBQzFDLElBQUksV0FBVyxHQUFtQyxPQUFPLENBQUM7UUFFMUQsT0FBTyxDQUFDLENBQUMsV0FBVyxZQUFZLFlBQVksQ0FBQyxFQUFFLENBQUM7WUFDL0MsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5QixXQUFXLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFFRCxPQUFPLFdBQVcsQ0FBQztJQUNwQixDQUFDO0lBRU0sSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBYSxTQUFRLHNCQUFVO1FBc0IzQyxZQUNpQixXQUF3QixFQUN2QixjQUFnRCxFQUMxQyxvQkFBNEQsRUFDcEUsWUFBNEMsRUFDdEMsa0JBQXdELEVBQ3JELHFCQUE4RDtZQUV0RixLQUFLLEVBQUUsQ0FBQztZQVBRLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ04sbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ3pCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDckIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNwQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBMUIvRSxjQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFlO2dCQUNyRSxLQUFLLEVBQUUsdUJBQXVCO2FBQzlCLENBQUMsQ0FBQyxDQUFDO1lBQ0ssYUFBUSxHQUF3QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUN0RCxtQkFBYyxHQUErQixFQUFFLENBQUM7WUFDaEQscUJBQWdCLEdBQStCLEVBQUUsQ0FBQztZQUNsRCxxQkFBZ0IsR0FBdUIsSUFBSSxDQUFDO1lBQzVDLHNCQUFpQixHQUFvRCxxQ0FBaUIsQ0FBQyxPQUFPLENBQTJCLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RMLHdCQUFtQixHQUFvRCxxQ0FBaUIsQ0FBQyxPQUFPLENBQTJCLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hMLG9CQUFlLEdBQVksS0FBSyxDQUFDO1lBQ2pDLFdBQU0sR0FBc0IsSUFBSSxDQUFDO1lBRWpDLHVCQUFrQixHQUF3QixHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbEUsYUFBUSxHQUFHLEtBQUssQ0FBQztZQWdCeEIsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUN0RyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3pFLElBQUksTUFBTSxZQUFZLDJDQUFvQixFQUFFLENBQUM7b0JBQzVDLElBQUksQ0FBQyw0QkFBNEIsQ0FBdUIsTUFBTSxDQUFDLENBQUM7Z0JBQ2pFLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBb0M7WUFDdEQsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO29CQUN0RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBRTdCLElBQUksQ0FBQyxNQUFNLFlBQVksV0FBVyxJQUFJLE1BQU0sWUFBWSxTQUFTLENBQUMsSUFBSSw0QkFBNEIsQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsRUFBRSxDQUFDO3dCQUMvSCxrREFBa0Q7d0JBQ2xELE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxJQUFJLElBQUksWUFBWSxTQUFTLEVBQUUsQ0FBQzt3QkFDL0IsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNuQyxDQUFDO3lCQUFNLElBQUksSUFBSSxZQUFZLEtBQUssRUFBRSxDQUFDO3dCQUNsQyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ25DLENBQUM7eUJBQU0sSUFBSSxJQUFJLFlBQVksV0FBVyxFQUFFLENBQUM7d0JBQ3hDLE1BQU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUN6QixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN6QixDQUFDO1FBQ0YsQ0FBQztRQUVELFdBQVcsQ0FBQyxnQkFBbUM7WUFDOUMsK0RBQStEO1lBQy9ELE1BQU0sWUFBWSxHQUFzQixFQUFFLENBQUM7WUFFM0MsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3ZCLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFFO29CQUMzQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUM7d0JBQ2pFLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQW9ELGNBQWMsQ0FBQyxDQUFDO3dCQUNsRyxZQUFZLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUNuQyxDQUFDO2dCQUNGLENBQUMsQ0FDQSxDQUFDO1lBQ0gsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxLQUFLLENBQUMsS0FBd0I7WUFDakMsa0lBQWtJO1lBQ2xJLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzlDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLElBQUksRUFBRTtnQkFDcEMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ2pELGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN2QixDQUFDLENBQUM7WUFFRixJQUFJLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxTQUFTLENBQUM7WUFFekMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDdkQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLHFDQUFpQixDQUFDLE9BQU8sQ0FBMEIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDekksSUFBSSxDQUFDLG1CQUFtQixHQUFHLHFDQUFpQixDQUFDLE9BQU8sQ0FBMEIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFM0ksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsYUFBYSxJQUFJLEVBQUUsQ0FBQztpQkFDeEQsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztpQkFDcEIsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQTJCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUV0SSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRS9FLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsYUFBYSxJQUFJLEVBQUUsQ0FBQztpQkFDMUQsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztpQkFDcEIsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQTJCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVySSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbkYsSUFBSSxDQUFDLGdCQUFnQixHQUFzQixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFeEssSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDckIsQ0FBQztRQUVELHVCQUF1QixDQUFDLG9CQUFpRCxFQUFFLEVBQVc7WUFDckYsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDUixJQUFJLENBQUMsdUJBQXVCLEdBQUcsb0JBQW9CLENBQUM7WUFDckQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQztZQUNuRCxDQUFDO1FBQ0YsQ0FBQztRQUVELHVCQUF1QixDQUFDLEVBQVc7WUFDbEMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDO1FBQ3ZFLENBQUM7UUFFTyw0QkFBNEIsQ0FBQyxNQUE0QjtZQUVoRSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDM0MsSUFBSSxDQUFDLDBCQUEwQixHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FDekQsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDVCxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN4RCxDQUFDO1lBQ0YsQ0FBQyxDQUNELENBQUM7WUFFRixJQUFJLENBQUMseUJBQXlCLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDMUMsNkVBQTZFO1lBQzdFLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQzNELEdBQUcsRUFBRTtnQkFDSixJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUN2QixJQUFJLENBQUMsMkJBQTJCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2hFLENBQUM7WUFDRixDQUFDLENBQ0QsQ0FBQztRQUNILENBQUM7UUFFTyxZQUFZLENBQUMsS0FBaUI7WUFDckMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRU8sS0FBSyxDQUFDLDJCQUEyQixDQUFDLE1BQTRCLEVBQUUsUUFBYTtZQUNwRixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sV0FBVyxFQUFFLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRU8sNkJBQTZCLENBQUMsTUFBNEIsRUFBRSxRQUFhO1lBQ2hGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEUsV0FBVyxFQUFFLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRU8sc0JBQXNCLENBQUMsUUFBb0IsRUFBRSxFQUFVLEVBQUUsS0FBYSxFQUFFLEtBQWlCLEVBQUUsRUFBVztZQUM3RyxJQUFJLFdBQXdCLENBQUM7WUFDN0IsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4SSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25ILENBQUM7WUFDRCxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQy9FLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFHRCxHQUFHLENBQUMsTUFBb0IsRUFBRSxnQkFBd0IsRUFBRSxFQUFXLEVBQUUsU0FBa0IsS0FBSztZQUN2RiwyRUFBMkU7WUFFM0UsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2pCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCwyQ0FBMkM7Z0JBQzNDLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZHLFdBQVcsRUFBRSxZQUFZLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDVCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0UsQ0FBQztZQUNELElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7WUFDM0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztRQUM5QixDQUFDO1FBRUQsTUFBTSxDQUFDLE9BQThELEVBQUUsRUFBRSxHQUFHLEtBQUs7WUFDaEYsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVELE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxZQUFZLFdBQVcsRUFBRSxDQUFDO29CQUM5QixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxXQUFXLEdBQWdCLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksU0FBUyxDQUFnQixDQUFDO1lBRTVGLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyRSxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNyQixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFjLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZFLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBYyxLQUFLLENBQUMsQ0FBQztZQUNuRSxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sQ0FBQyxLQUFnQjtZQUN2QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsVUFBVSxDQUFDLFFBQWtDO1lBQzVDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBRXpCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUV0RSxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztnQkFDMUIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2QsQ0FBQyxFQUFFLEdBQUcsRUFBRTtnQkFDUCxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMzQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxhQUFhLENBQUMsRUFBRSxHQUFHLEtBQUs7WUFDdkIsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDUixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUM5QixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDN0I7b0JBQ0MsR0FBRyxJQUFJLENBQUMsY0FBYztvQkFDdEIsSUFBSSxDQUFDLGdCQUFnQjtpQkFDckIsQ0FBQyxDQUFDO2dCQUNIO29CQUNDLEdBQUcsSUFBSSxDQUFDLGNBQWM7aUJBQ3RCLENBQUM7UUFDSixDQUFDO1FBRUQsT0FBTyxDQUFDLEVBQUUsR0FBRyxLQUFLO1lBQ2pCLE1BQU0sT0FBTyxHQUFrQixFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQztZQUN0RCxDQUFDLENBQUMsQ0FBQztZQUVILE9BQXFCLEVBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsT0FBTyxDQUFDLEVBQUUsR0FBRyxLQUFLO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFRCxTQUFTLENBQUMsRUFBRSxHQUFHLEtBQUs7WUFDbkIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRyxDQUFDO1FBRUQsS0FBSyxDQUFDLEVBQUUsR0FBRyxLQUFLO1lBQ2YsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUVELElBQUksY0FBYztZQUNqQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELGdCQUFnQixDQUFDLEtBQWM7WUFDOUIsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNwQyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBQzdCLElBQUksYUFBYSxHQUFpQixJQUFJLENBQUM7WUFDdkMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQW9CLEVBQUUsRUFBRTtnQkFDL0MsU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzdCLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3BCLGFBQWEsR0FBRyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDOUMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUMzQyxNQUFNO2dCQUNOLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxjQUFjLENBQ3JDLGFBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQ2hDLGFBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FDOUIsQ0FBQztZQUNILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsMEJBQTBCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUN4RCxDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUkseUJBQXlCO1lBQzVCLE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDO1FBQ3hDLENBQUM7UUFFTyxjQUFjLENBQUMsUUFBYTtZQUNuQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBaUIsQ0FBQztRQUMzRCxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsUUFBYTtZQUNyQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xFLE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFZLFlBQVksQ0FBQyxPQUFnQjtZQUN4QyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7Z0JBQzVDLFdBQVcsQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLGtCQUFrQixDQUFDLFdBQXlCLEVBQUUsRUFBVztZQUNoRSxNQUFNLFlBQVksR0FBRyxJQUFJLGlCQUFXLEVBQWdCLENBQUM7WUFDckQsTUFBTSxnQkFBZ0IsR0FBaUIsRUFBRSxDQUFDO1lBQzFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVwRyxXQUFXLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUNsQyxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNuSCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2xCLHlFQUF5RTtvQkFDekUsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7Z0JBQ3RDLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2QsWUFBWSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2hELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU87Z0JBQ04sUUFBUSxFQUFFLFlBQVk7Z0JBQ3RCLEtBQUssRUFBRSxnQkFBZ0I7YUFDdkIsQ0FBQztRQUNILENBQUM7UUFFTyxjQUFjO1lBQ3JCLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7WUFFM0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLHFDQUFpQixDQUFDLE9BQU8sQ0FBMEIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDekksSUFBSSxDQUFDLG1CQUFtQixHQUFHLHFDQUFpQixDQUFDLE9BQU8sQ0FBMEIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFM0ksSUFBSSxDQUFDLDBCQUEwQixDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDeEQsQ0FBQztRQUVRLEtBQUssQ0FBQyxPQUFPO1lBQ3JCLElBQUksQ0FBQywwQkFBMEIsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUMzQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsTUFBTSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUNqQyxDQUFDO0tBQ0QsQ0FBQTtJQWhaWSxvQ0FBWTsyQkFBWixZQUFZO1FBd0J0QixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw4Q0FBc0IsQ0FBQTtPQTVCWixZQUFZLENBZ1p4QjtJQUVELElBQVksbUJBR1g7SUFIRCxXQUFZLG1CQUFtQjtRQUM5QiwrREFBSyxDQUFBO1FBQ0wsNkVBQVksQ0FBQTtJQUNiLENBQUMsRUFIVyxtQkFBbUIsbUNBQW5CLG1CQUFtQixRQUc5QjtJQUVNLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSxzQkFBVTtRQTBCMUMsWUFDaUIsYUFBOEMsRUFDM0MsZ0JBQW9ELEVBQ2hELG9CQUE0RCxFQUM1RCxvQkFBNEQsRUFDdEUsVUFBd0MsRUFDN0IscUJBQThELEVBQ3BFLGVBQWtEO1lBRXBFLEtBQUssRUFBRSxDQUFDO1lBUnlCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMxQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQy9CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ1osMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUNuRCxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUE5QjdELGlCQUFZLEdBQXNCLElBQUksQ0FBQztZQUN2QyxtQkFBYyxHQUFZLEtBQUssQ0FBQztZQUNoQyxtQkFBYyxHQUFrQixJQUFJLENBQUM7WUFDckMsb0JBQWUsR0FBMEIsSUFBSSxDQUFDO1lBQzlDLGtCQUFhLEdBQVksS0FBSyxDQUFDO1lBQy9CLHNCQUFpQixHQUFrQixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDNUMsaUJBQVksR0FBaUIsRUFBRSxDQUFDO1lBQ2hDLG1CQUFjLEdBQWlCLEVBQUUsQ0FBQztZQUVsQywwQkFBcUIsR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDbkYseUJBQW9CLEdBQWdCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFFN0QsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFlO2dCQUMzRixLQUFLLEVBQUUsdUJBQXVCO2FBQzlCLENBQUMsQ0FBQyxDQUFDO1lBQ0ssMEJBQXFCLEdBQXdCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFFaEYsNkJBQXdCLEdBQW1DLElBQUksQ0FBQztZQUNoRSwrQkFBMEIsR0FBbUMsSUFBSSxDQUFDO1lBQ2xFLGdDQUEyQixHQUFZLEtBQUssQ0FBQztZQUM3QyxrQ0FBNkIsR0FBWSxLQUFLLENBQUM7WUFDaEQsYUFBUSxHQUF3QixtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFZaEUsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBRUQsZUFBZTtZQUNkLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUM1QixDQUFDO1FBRUQsSUFBSSxhQUFhLENBQUMsYUFBc0I7WUFDdkMsSUFBSSxDQUFDLGNBQWMsR0FBRyxhQUFhLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUksY0FBYztZQUNqQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQUksYUFBYTtZQUNoQixPQUFPLElBQUksQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFFRCxJQUFJLFlBQVksQ0FBQyxLQUFjO1lBQzlCLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFJLFlBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQUksYUFBYSxDQUFDLGFBQXFCO1lBQ3RDLElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO1lBQ3BDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksd0JBQWMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM1RixDQUFDO1lBQ0QsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFRCxJQUFJLFlBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBa0Q7WUFDcEUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxzQkFBc0I7Z0JBQ3RCLE9BQU87WUFDUixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3ZCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FDbEIsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLDBCQUFrQixFQUFFLEVBQzFHLFVBQVUsRUFDVixJQUFJLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUNwQyxDQUFDO2dCQUNILENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxXQUF5QixFQUFFLGdCQUF3QixFQUFFLEtBQXlCLEVBQUUsVUFBa0Q7WUFDbkssTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQzlDLFdBQVcsRUFDWCxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQXNCLEVBQUUsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUFDO1lBQ0osT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBa0I7Z0JBQ3pELFFBQVEsd0NBQStCO2dCQUN2QyxJQUFJLEVBQUUsU0FBUztnQkFDZixLQUFLLEVBQUUsNkJBQTZCO2FBQ3BDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVELFFBQVEsQ0FBQyxLQUFtQixFQUFFLFVBQWtELEVBQUUsV0FBK0I7WUFFaEgsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDL0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksc0NBQXVCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0YsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQ3BELGdCQUFnQixFQUNoQixJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFzQixFQUFFLEVBQUU7Z0JBQ3ZFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN4RCxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixDQUFDLENBQUM7aUJBQ0QsSUFBSSxDQUNKLEtBQUssQ0FBQyxFQUFFO2dCQUNQLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDMUUsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDLEVBQ0QsQ0FBQyxDQUFDLEVBQUU7Z0JBQ0gsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxDQUFDLENBQUM7WUFDVCxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDMUMsT0FBTyxjQUFjLENBQUM7UUFDdkIsQ0FBQztRQUVPLFFBQVEsQ0FBQyxLQUFpQixFQUFFLGVBQThCLEVBQUUsV0FBdUIsRUFBRSxnQkFBd0IsRUFBRSxVQUFrRCxFQUFFLFdBQStCO1lBSXpNLE1BQU0sdUJBQXVCLEdBQUcsS0FBSyxFQUFFLENBQXNCLEVBQUUsRUFBRTtnQkFDaEUsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDekQsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsQ0FBQyxDQUFDO1lBRUYsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLENBQXNCLEVBQUUsRUFBRTtnQkFDekQsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNqRCxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixDQUFDLENBQUM7WUFDRixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxzQ0FBdUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUU3RixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDdEksTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FDN0QsV0FBVyxFQUNYLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLEVBQzVELGNBQWMsQ0FBQyxlQUFlLEVBQzlCLGNBQWMsQ0FBQyxlQUFlLENBQzlCLENBQUM7WUFFRixNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQztZQUNuRCxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVwRSxNQUFNLGVBQWUsR0FBRyxLQUFLLElBQThCLEVBQUU7Z0JBQzVELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFFL0IsZ0NBQWdDO2dCQUNoQyxNQUFNLHNCQUFzQixHQUFHLE1BQU0sVUFBVSxDQUFDLFlBQVksQ0FBQztnQkFDN0QsTUFBTSx1QkFBdUIsR0FBRyxNQUFNLGNBQWMsQ0FBQyxZQUFZLENBQUM7Z0JBQ2xFLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFdBQVcsQ0FBQztnQkFDOUMsTUFBTSxjQUFjLEdBQW9CO29CQUN2QyxPQUFPLEVBQUUsQ0FBQyxHQUFHLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxHQUFHLHVCQUF1QixDQUFDLE9BQU8sQ0FBQztvQkFDaEYsUUFBUSxFQUFFLENBQUMsR0FBRyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyx1QkFBdUIsQ0FBQyxRQUFRLENBQUM7b0JBQ25GLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxRQUFRLElBQUksdUJBQXVCLENBQUMsUUFBUTtvQkFDN0UsSUFBSSxFQUFFLHNCQUFzQixDQUFDLElBQUk7b0JBQ2pDLEtBQUssRUFBRSxzQkFBc0IsQ0FBQyxLQUFLO2lCQUNuQyxDQUFDO2dCQUNGLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHVCQUF1QixZQUFZLElBQUksQ0FBQyxDQUFDO2dCQUMvRCxPQUFPLGNBQWMsQ0FBQztZQUN2QixDQUFDLENBQUM7WUFDRixPQUFPO2dCQUNOLFlBQVksRUFBRSxlQUFlLEVBQUU7Z0JBQy9CLFdBQVc7YUFDWCxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxLQUFpQixFQUFFLFVBQWtELEVBQUUsV0FBK0I7WUFJNUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV4QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMzQixDQUFDO1lBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7WUFFL0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUU3QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUM1RCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksd0JBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFaEcsK0hBQStIO1lBQy9ILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUvRyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEgsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQztZQUN0QyxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDO1lBRXBDLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQ1AsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNmLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksS0FBOEIsQ0FBQztZQUVuQyxNQUFNLHNCQUFzQixHQUFHLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNwRCxLQUFLLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ25ELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsWUFBWSxFQUFFLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUNqRTs7Ozs7a0JBS0U7Z0JBQ0YsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLDBCQUEwQixFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQy9GLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDO2dCQUNKLE9BQU87b0JBQ04sWUFBWSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQzlCLEtBQUssQ0FBQyxFQUFFO3dCQUNQLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDM0UsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQyxFQUNELENBQUMsQ0FBQyxFQUFFO3dCQUNILElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ2pELE1BQU0sQ0FBQyxDQUFDO29CQUNULENBQUMsQ0FBQztvQkFDSCxXQUFXO2lCQUNYLENBQUM7WUFDSCxDQUFDO29CQUFTLENBQUM7Z0JBQ1Y7Ozs7O2tCQUtFO2dCQUNGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDNUYsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxTQUFzQyxFQUFFLFFBQWdCLEVBQUUsZ0JBQXdCLEVBQUUsRUFBVztZQUN4SCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLDREQUE0RCxDQUFDLENBQUM7WUFDL0UsQ0FBQztZQUVELElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQ1IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUVELElBQUksQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXpELE1BQU0sT0FBTyxHQUFpQixNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2xGLE9BQVEsT0FBZSxDQUFDLE9BQU8sQ0FBQztZQUVoQyxNQUFNLEtBQUssR0FBRyxTQUFTLElBQUksU0FBUyxDQUFDLEtBQXlCLENBQUM7WUFFL0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0RyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZHLE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0MsZUFBZSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDMUIsT0FBTyxDQUFDO1lBRVY7Ozs7Ozs7Ozs7O2NBV0U7WUFDRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFO2dCQUNyRCxLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUU7Z0JBQ2pDLFNBQVMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRTtnQkFDekMsT0FBTztnQkFDUCxRQUFRO2dCQUNSLElBQUksRUFBRSxLQUFLLElBQUksS0FBSyxDQUFDLElBQUk7Z0JBQ3pCLE1BQU07Z0JBQ04sbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZO2FBQ25ELENBQUMsQ0FBQztZQUNILE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFTyxhQUFhLENBQUMsQ0FBTSxFQUFFLFFBQWdCLEVBQUUsRUFBVztZQUMxRCxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsaUJBQWlCLENBQ3JCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQztvQkFDM0UsQ0FBQyxDQUFDLEVBQUUsSUFBSSxtREFBMkMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUU7b0JBQ2hGLENBQUMsQ0FBQyxTQUFTLEVBQ1osUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbkIsSUFBSSxFQUFFLEVBQUUsQ0FBQztvQkFDUixJQUFJLENBQUMsNkJBQTZCLEdBQUcsS0FBSyxDQUFDO2dCQUM1QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLDJCQUEyQixHQUFHLEtBQUssQ0FBQztnQkFDMUMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sZ0JBQWdCLENBQUMsQ0FBc0IsRUFBRSxnQkFBd0IsRUFBRSxJQUFJLEdBQUcsSUFBSSxFQUFFLEtBQWMsS0FBSztZQUMxRyxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDakUsSUFBaUIsQ0FBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM5QixXQUFXLENBQUMsSUFBSSxDQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUN4QixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUNuRSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFDeEIsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7d0JBQ2hDLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDOzRCQUN4QixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDOzRCQUNoRSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQzt3QkFDeEIsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBRUYsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFZLFlBQVk7WUFDdkIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFpQyxRQUFRLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBRUQsWUFBWSxDQUFDLHFCQUFxQixHQUFHLEtBQUs7WUFDekMsSUFBSSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLDJCQUEyQixHQUFHLHFCQUFxQixDQUFDO2dCQUN6RCxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNELGNBQWMsQ0FBQyxxQkFBcUIsR0FBRyxLQUFLO1lBQzNDLElBQUksSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyw2QkFBNkIsR0FBRyxxQkFBcUIsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN6QyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDUSxPQUFPO1lBQ2YsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBRUQsQ0FBQTtJQWhYWSxrQ0FBVzswQkFBWCxXQUFXO1FBMkJyQixXQUFBLHVCQUFjLENBQUE7UUFDZCxXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLHVDQUFzQixDQUFBO1FBQ3RCLFdBQUEsMkJBQWdCLENBQUE7T0FqQ04sV0FBVyxDQWdYdkI7SUFNTSxJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUErQjtRQUszQyxZQUFtQyxvQkFBNEQ7WUFBM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUZ2RixpQkFBWSxHQUF1QixJQUFJLENBQUM7UUFHaEQsQ0FBQztRQUVELElBQUksV0FBVztZQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMzRSxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFFRCxJQUFJLFdBQVcsQ0FBQyxXQUF3QjtZQUN2QyxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1FBQ2pDLENBQUM7S0FDRCxDQUFBO0lBbkJZLDBFQUErQjs4Q0FBL0IsK0JBQStCO1FBSzlCLFdBQUEscUNBQXFCLENBQUE7T0FMdEIsK0JBQStCLENBbUIzQztJQUVZLFFBQUEsZ0NBQWdDLEdBQUcsSUFBQSwrQkFBZSxFQUFtQyxpQ0FBaUMsQ0FBQyxDQUFDO0lBUXJJOzs7T0FHRztJQUNJLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQXlCOztRQU1yQyxZQUNnQixhQUE2QztZQUE1QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUxyRCxrQkFBYSxHQUFrQixJQUFJLENBQUM7WUFDcEMsV0FBTSxHQUFzQixJQUFJLENBQUM7WUFDeEIsc0JBQWlCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFLM0QsQ0FBQztRQUVELG9CQUFvQjtZQUNuQixJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7b0JBQzFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDekMsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDM0IsQ0FBQztRQUVELGNBQWMsQ0FBQyxRQUEwQixFQUFFLEtBQVksRUFBRSxVQUFrQixDQUFDO1lBQzNFLElBQUksS0FBd0IsQ0FBQztZQUM3QixJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDekIsS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxLQUFLLEdBQUcsUUFBUSxDQUFDO1lBQ2xCLENBQUM7WUFFRCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxLQUFpQixFQUFFLEtBQVk7WUFDdkQsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDNUIsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBQ3BDLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsMkJBQXlCLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUMzRyxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUVPLFFBQVEsQ0FBQyxLQUFpQjtZQUNqQyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztnQkFDcEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7b0JBQ25FLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUMzQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUU7b0JBQ3pELElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUMzQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQztRQUVPLG1CQUFtQjtZQUMxQixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEMsQ0FBQztpQkFFdUIsZ0NBQTJCLEdBQUcsa0NBQXNCLENBQUMsUUFBUSxDQUFDO1lBQ3JGLFdBQVcsRUFBRSx3QkFBd0I7WUFDckMsVUFBVSw0REFBb0Q7WUFDOUQsU0FBUyxFQUFFLGdCQUFnQjtZQUMzQixXQUFXLEVBQUUsSUFBSTtTQUNqQixDQUFDLEFBTGlELENBS2hEOztJQTVFUyw4REFBeUI7d0NBQXpCLHlCQUF5QjtRQU9uQyxXQUFBLHFCQUFhLENBQUE7T0FQSCx5QkFBeUIsQ0E2RXJDO0lBSUQsU0FBUyx5QkFBeUIsQ0FBQyxRQUEwQixFQUFFLFNBQW9CLEVBQUUsZUFBd0I7UUFDNUcsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNwQyxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNuQyxNQUFNLFlBQVksR0FBa0MsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pGLE9BQU8sSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzdFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLFlBQVksR0FBaUIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDNUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQztZQUNqRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEIsQ0FBQztJQUNGLENBQUM7SUFFRCxrQ0FBa0M7SUFFbEMsU0FBZ0Isa0NBQWtDLENBQUMsaUJBQXFDLEVBQUUsSUFBZTtRQUN4RyxNQUFNLGVBQWUsR0FBc0IsRUFBRSxDQUFDO1FBQzlDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLGVBQWUsRUFBRSxFQUFFO1lBQzdDLE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzNDLGVBQWUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUN2QyxNQUFNLFlBQVksR0FBa0MsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3hGLE1BQU0sS0FBSyxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ3JHLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzdCLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sWUFBWSxHQUFpQixlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDbkUsTUFBTSxLQUFLLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzFILGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxlQUFlLENBQUM7SUFDeEIsQ0FBQztJQUVELFNBQWdCLDRCQUE0QixDQUFDLE9BQXdCLEVBQUUsU0FBNEI7UUFDbEcsR0FBRyxDQUFDO1lBQ0gsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxZQUFZLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFvQixPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtRQUV2RyxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFTLGNBQWMsQ0FBQyxPQUFnRDtRQUV2RSxNQUFNLGFBQWEsR0FBOEIsRUFBRSxDQUFDO1FBQ3BELE1BQU0sV0FBVyxHQUFnQixFQUFFLENBQUM7UUFDcEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxZQUFZLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3hGLENBQUM7SUFJRCxTQUFTLHVCQUF1QixDQUFDLE1BQXNCO1FBQ3RELE1BQU0sUUFBUSxHQUFpQjtZQUM5QixRQUFRLEVBQUUsRUFBRTtZQUNaLEtBQUssRUFBRSxLQUFLO1lBQ1osT0FBTyxFQUFFLEtBQUs7U0FDZCxDQUFDO1FBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNiLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLENBQUM7WUFFRCxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZixRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUN6QixDQUFDO1lBRUQsUUFBUSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLFFBQVEsQ0FBQztJQUNqQixDQUFDIn0=