var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/resources", "vs/base/common/themables", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/platform/quickinput/common/quickAccess", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/contrib/search/browser/searchView", "vs/workbench/contrib/search/common/search", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/search/common/search", "vs/base/common/event", "vs/workbench/browser/quickaccess", "vs/workbench/services/views/common/viewsService", "vs/base/common/async"], function (require, exports, cancellation_1, lifecycle_1, map_1, resources_1, themables_1, nls_1, configuration_1, instantiation_1, label_1, listService_1, pickerQuickAccess_1, quickAccess_1, quickInput_1, workspace_1, searchIcons_1, searchModel_1, searchView_1, search_1, editorService_1, queryBuilder_1, search_2, event_1, quickaccess_1, viewsService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextSearchQuickAccess = exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX = void 0;
    exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX = '%';
    const DEFAULT_TEXT_QUERY_BUILDER_OPTIONS = {
        _reason: 'quickAccessSearch',
        disregardIgnoreFiles: false,
        disregardExcludeSettings: false,
        onlyOpenEditors: false,
        expandPatterns: true
    };
    const MAX_FILES_SHOWN = 30;
    const MAX_RESULTS_PER_FILE = 10;
    const DEBOUNCE_DELAY = 75;
    let TextSearchQuickAccess = class TextSearchQuickAccess extends pickerQuickAccess_1.PickerQuickAccessProvider {
        _getTextQueryBuilderOptions(charsPerLine) {
            return {
                ...DEFAULT_TEXT_QUERY_BUILDER_OPTIONS,
                ...{
                    extraFileResources: this._instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                    maxResults: this.configuration.maxResults ?? undefined,
                    isSmartCase: this.configuration.smartCase,
                },
                previewOptions: {
                    matchLines: 1,
                    charsPerLine
                }
            };
        }
        constructor(_instantiationService, _contextService, _editorService, _labelService, _viewsService, _configurationService) {
            super(exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX, { canAcceptInBackground: true, shouldSkipTrimPickFilter: true });
            this._instantiationService = _instantiationService;
            this._contextService = _contextService;
            this._editorService = _editorService;
            this._labelService = _labelService;
            this._viewsService = _viewsService;
            this._configurationService = _configurationService;
            this.currentAsyncSearch = Promise.resolve({
                results: [],
                messages: []
            });
            this.queryBuilder = this._instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            this.searchModel = this._register(this._instantiationService.createInstance(searchModel_1.SearchModel));
            this.editorViewState = this._register(this._instantiationService.createInstance(quickaccess_1.PickerEditorState));
            this.searchModel.location = searchModel_1.SearchModelLocation.QUICK_ACCESS;
            this.editorSequencer = new async_1.Sequencer();
        }
        dispose() {
            this.searchModel.dispose();
            super.dispose();
        }
        provide(picker, token, runOptions) {
            const disposables = new lifecycle_1.DisposableStore();
            if (exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX.length < picker.value.length) {
                picker.valueSelection = [exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX.length, picker.value.length];
            }
            picker.customButton = true;
            picker.customLabel = '$(go-to-search)';
            this.editorViewState.reset();
            disposables.add(picker.onDidCustom(() => {
                if (this.searchModel.searchResult.count() > 0) {
                    this.moveToSearchViewlet(undefined);
                }
                else {
                    this._viewsService.openView(search_2.VIEW_ID, true);
                }
                picker.hide();
            }));
            const onDidChangeActive = () => {
                const [item] = picker.activeItems;
                if (item?.match) {
                    // we must remember our curret view state to be able to restore (will automatically track if there is already stored state)
                    this.editorViewState.set();
                    const itemMatch = item.match;
                    this.editorSequencer.queue(async () => {
                        await this.editorViewState.openTransientEditor({
                            resource: itemMatch.parent().resource,
                            options: { preserveFocus: true, revealIfOpened: true, ignoreError: true, selection: itemMatch.range() }
                        });
                    });
                }
            };
            disposables.add(event_1.Event.debounce(picker.onDidChangeActive, (last, event) => event, DEBOUNCE_DELAY, true)(onDidChangeActive));
            disposables.add(event_1.Event.once(picker.onWillHide)(({ reason }) => {
                // Restore view state upon cancellation if we changed it
                // but only when the picker was closed via explicit user
                // gesture and not e.g. when focus was lost because that
                // could mean the user clicked into the editor directly.
                if (reason === quickInput_1.QuickInputHideReason.Gesture) {
                    this.editorViewState.restore();
                }
            }));
            disposables.add(event_1.Event.once(picker.onDidHide)(({ reason }) => {
                this.searchModel.searchResult.toggleHighlights(false);
            }));
            disposables.add(super.provide(picker, token, runOptions));
            disposables.add(picker.onDidAccept(() => this.searchModel.searchResult.toggleHighlights(false)));
            return disposables;
        }
        get configuration() {
            const editorConfig = this._configurationService.getValue().workbench?.editor;
            const searchConfig = this._configurationService.getValue().search;
            return {
                openEditorPinned: !editorConfig?.enablePreviewFromQuickOpen || !editorConfig?.enablePreview,
                preserveInput: searchConfig.quickAccess.preserveInput,
                maxResults: searchConfig.maxResults,
                smartCase: searchConfig.smartCase,
                sortOrder: searchConfig.sortOrder,
            };
        }
        get defaultFilterValue() {
            if (this.configuration.preserveInput) {
                return quickAccess_1.DefaultQuickAccessFilterValue.LAST;
            }
            return undefined;
        }
        doSearch(contentPattern, token) {
            if (contentPattern === '') {
                return undefined;
            }
            const folderResources = this._contextService.getWorkspace().folders;
            const content = {
                pattern: contentPattern,
            };
            this.searchModel.searchResult.toggleHighlights(false);
            const charsPerLine = content.isRegExp ? 10000 : 1000; // from https://github.com/microsoft/vscode/blob/e7ad5651ac26fa00a40aa1e4010e81b92f655569/src/vs/workbench/contrib/search/browser/searchView.ts#L1508
            const query = this.queryBuilder.text(content, folderResources.map(folder => folder.uri), this._getTextQueryBuilderOptions(charsPerLine));
            const result = this.searchModel.search(query, undefined, token);
            const getAsyncResults = async () => {
                this.currentAsyncSearch = result.asyncResults;
                await result.asyncResults;
                const syncResultURIs = new map_1.ResourceSet(result.syncResults.map(e => e.resource));
                return this.searchModel.searchResult.matches().filter(e => !syncResultURIs.has(e.resource));
            };
            return {
                syncResults: this.searchModel.searchResult.matches(),
                asyncResults: getAsyncResults()
            };
        }
        moveToSearchViewlet(currentElem) {
            // this function takes this._searchModel and moves it to the search viewlet's search model.
            // then, this._searchModel will construct a new (empty) SearchModel.
            this._viewsService.openView(search_2.VIEW_ID, false);
            const viewlet = this._viewsService.getActiveViewWithId(search_2.VIEW_ID);
            viewlet.replaceSearchModel(this.searchModel, this.currentAsyncSearch);
            this.searchModel = this._instantiationService.createInstance(searchModel_1.SearchModel);
            this.searchModel.location = searchModel_1.SearchModelLocation.QUICK_ACCESS;
            const viewer = viewlet?.getControl();
            if (currentElem) {
                viewer.setFocus([currentElem], (0, listService_1.getSelectionKeyboardEvent)());
                viewer.setSelection([currentElem], (0, listService_1.getSelectionKeyboardEvent)());
                viewer.reveal(currentElem);
            }
            else {
                viewlet.searchAndReplaceWidget.focus();
            }
        }
        _getPicksFromMatches(matches, limit, firstFile) {
            matches = matches.sort((a, b) => {
                if (firstFile) {
                    if (firstFile === a.resource) {
                        return -1;
                    }
                    else if (firstFile === b.resource) {
                        return 1;
                    }
                }
                return (0, searchModel_1.searchComparer)(a, b, this.configuration.sortOrder);
            });
            const files = matches.length > limit ? matches.slice(0, limit) : matches;
            const picks = [];
            for (let fileIndex = 0; fileIndex < matches.length; fileIndex++) {
                if (fileIndex === limit) {
                    picks.push({
                        type: 'separator',
                    });
                    picks.push({
                        label: (0, nls_1.localize)('QuickSearchSeeMoreFiles', "See More Files"),
                        iconClass: themables_1.ThemeIcon.asClassName(searchIcons_1.searchDetailsIcon),
                        accept: async () => {
                            this.moveToSearchViewlet(matches[limit]);
                        }
                    });
                    break;
                }
                const fileMatch = files[fileIndex];
                const label = (0, resources_1.basenameOrAuthority)(fileMatch.resource);
                const description = this._labelService.getUriLabel((0, resources_1.dirname)(fileMatch.resource), { relative: true });
                picks.push({
                    label,
                    type: 'separator',
                    description,
                    buttons: [{
                            iconClass: themables_1.ThemeIcon.asClassName(searchIcons_1.searchOpenInFileIcon),
                            tooltip: (0, nls_1.localize)('QuickSearchOpenInFile', "Open File")
                        }],
                    trigger: async () => {
                        await this.handleAccept(fileMatch, {});
                        return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                    },
                });
                const results = fileMatch.matches() ?? [];
                for (let matchIndex = 0; matchIndex < results.length; matchIndex++) {
                    const element = results[matchIndex];
                    if (matchIndex === MAX_RESULTS_PER_FILE) {
                        picks.push({
                            label: (0, nls_1.localize)('QuickSearchMore', "More"),
                            iconClass: themables_1.ThemeIcon.asClassName(searchIcons_1.searchDetailsIcon),
                            accept: async () => {
                                this.moveToSearchViewlet(element);
                            }
                        });
                        break;
                    }
                    const preview = element.preview();
                    const previewText = (preview.before + preview.inside + preview.after).trim().substring(0, 999);
                    const match = [{
                            start: preview.before.length,
                            end: preview.before.length + preview.inside.length
                        }];
                    picks.push({
                        label: `${previewText}`,
                        highlights: {
                            label: match
                        },
                        buttons: [{
                                iconClass: themables_1.ThemeIcon.asClassName(searchIcons_1.searchActivityBarIcon),
                                tooltip: (0, nls_1.localize)('showMore', "See in Search Panel"),
                            }],
                        ariaLabel: `Match at location ${element.range().startLineNumber}:${element.range().startColumn} - ${previewText}`,
                        accept: async (keyMods, event) => {
                            await this.handleAccept(fileMatch, {
                                keyMods,
                                selection: (0, searchView_1.getEditorSelectionFromMatch)(element, this.searchModel),
                                preserveFocus: event.inBackground,
                                forcePinned: event.inBackground
                            });
                        },
                        trigger: () => {
                            this.moveToSearchViewlet(element);
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        },
                        match: element
                    });
                }
            }
            return picks;
        }
        async handleAccept(fileMatch, options) {
            const editorOptions = {
                preserveFocus: options.preserveFocus,
                pinned: options.keyMods?.ctrlCmd || options.forcePinned || this.configuration.openEditorPinned,
                selection: options.selection
            };
            // from https://github.com/microsoft/vscode/blob/f40dabca07a1622b2a0ae3ee741cfc94ab964bef/src/vs/workbench/contrib/search/browser/anythingQuickAccess.ts#L1037
            const targetGroup = options.keyMods?.alt || (this.configuration.openEditorPinned && options.keyMods?.ctrlCmd) || options.forceOpenSideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP;
            await this._editorService.openEditor({
                resource: fileMatch.resource,
                options: editorOptions
            }, targetGroup);
        }
        _getPicks(contentPattern, disposables, token) {
            const searchModelAtTimeOfSearch = this.searchModel;
            if (contentPattern === '') {
                this.searchModel.searchResult.clear();
                return [{
                        label: (0, nls_1.localize)('enterSearchTerm', "Enter a term to search for across your files.")
                    }];
            }
            const conditionalTokenCts = disposables.add(new cancellation_1.CancellationTokenSource());
            disposables.add(token.onCancellationRequested(() => {
                if (searchModelAtTimeOfSearch.location === searchModel_1.SearchModelLocation.QUICK_ACCESS) {
                    // if the search model has not been imported to the panel, you can cancel
                    conditionalTokenCts.cancel();
                }
            }));
            const allMatches = this.doSearch(contentPattern, conditionalTokenCts.token);
            if (!allMatches) {
                return null;
            }
            const matches = allMatches.syncResults;
            const syncResult = this._getPicksFromMatches(matches, MAX_FILES_SHOWN, this._editorService.activeEditor?.resource);
            if (syncResult.length > 0) {
                this.searchModel.searchResult.toggleHighlights(true);
            }
            if (matches.length >= MAX_FILES_SHOWN) {
                return syncResult;
            }
            return {
                picks: syncResult,
                additionalPicks: allMatches.asyncResults
                    .then(asyncResults => (asyncResults.length + syncResult.length === 0) ? [{
                        label: (0, nls_1.localize)('noAnythingResults', "No matching results")
                    }] : this._getPicksFromMatches(asyncResults, MAX_FILES_SHOWN - matches.length))
                    .then(picks => {
                    if (picks.length > 0) {
                        this.searchModel.searchResult.toggleHighlights(true);
                    }
                    return picks;
                })
            };
        }
    };
    exports.TextSearchQuickAccess = TextSearchQuickAccess;
    exports.TextSearchQuickAccess = TextSearchQuickAccess = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, editorService_1.IEditorService),
        __param(3, label_1.ILabelService),
        __param(4, viewsService_1.IViewsService),
        __param(5, configuration_1.IConfigurationService)
    ], TextSearchQuickAccess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaFF1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvcXVpY2tUZXh0U2VhcmNoL3RleHRTZWFyY2hRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBbUNhLFFBQUEsK0JBQStCLEdBQUcsR0FBRyxDQUFDO0lBRW5ELE1BQU0sa0NBQWtDLEdBQTZCO1FBQ3BFLE9BQU8sRUFBRSxtQkFBbUI7UUFDNUIsb0JBQW9CLEVBQUUsS0FBSztRQUMzQix3QkFBd0IsRUFBRSxLQUFLO1FBQy9CLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLGNBQWMsRUFBRSxJQUFJO0tBQ3BCLENBQUM7SUFFRixNQUFNLGVBQWUsR0FBRyxFQUFFLENBQUM7SUFDM0IsTUFBTSxvQkFBb0IsR0FBRyxFQUFFLENBQUM7SUFDaEMsTUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDO0lBS25CLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsNkNBQXFEO1FBV3ZGLDJCQUEyQixDQUFDLFlBQW9CO1lBQ3ZELE9BQU87Z0JBQ04sR0FBRyxrQ0FBa0M7Z0JBQ3JDLEdBQUk7b0JBQ0gsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyx5Q0FBZ0MsQ0FBQztvQkFDL0YsVUFBVSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxJQUFJLFNBQVM7b0JBQ3RELFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7aUJBQ3pDO2dCQUVELGNBQWMsRUFBRTtvQkFDZixVQUFVLEVBQUUsQ0FBQztvQkFDYixZQUFZO2lCQUNaO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFRCxZQUN3QixxQkFBNkQsRUFDMUQsZUFB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