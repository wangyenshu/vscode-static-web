/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/editor/browser/editorBrowser", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/history/common/history", "vs/css!./media/searchEditor"], function (require, exports, network_1, editorBrowser_1, configuration_1, instantiation_1, label_1, telemetry_1, workspace_1, viewsService_1, searchActionsBase_1, searchEditorInput_1, searchEditorSerialization_1, configurationResolver_1, editorGroupsService_1, editorService_1, history_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createEditorFromSearchResult = exports.openNewSearchEditor = exports.selectAllSearchEditorMatchesCommand = exports.modifySearchEditorContextLinesCommand = exports.toggleSearchEditorContextLinesCommand = exports.toggleSearchEditorRegexCommand = exports.toggleSearchEditorWholeWordCommand = exports.toggleSearchEditorCaseSensitiveCommand = void 0;
    exports.openSearchEditor = openSearchEditor;
    const toggleSearchEditorCaseSensitiveCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleCaseSensitive();
        }
    };
    exports.toggleSearchEditorCaseSensitiveCommand = toggleSearchEditorCaseSensitiveCommand;
    const toggleSearchEditorWholeWordCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleWholeWords();
        }
    };
    exports.toggleSearchEditorWholeWordCommand = toggleSearchEditorWholeWordCommand;
    const toggleSearchEditorRegexCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleRegex();
        }
    };
    exports.toggleSearchEditorRegexCommand = toggleSearchEditorRegexCommand;
    const toggleSearchEditorContextLinesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleContextLines();
        }
    };
    exports.toggleSearchEditorContextLinesCommand = toggleSearchEditorContextLinesCommand;
    const modifySearchEditorContextLinesCommand = (accessor, increase) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.modifyContextLines(increase);
        }
    };
    exports.modifySearchEditorContextLinesCommand = modifySearchEditorContextLinesCommand;
    const selectAllSearchEditorMatchesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.focusAllResults();
        }
    };
    exports.selectAllSearchEditorMatchesCommand = selectAllSearchEditorMatchesCommand;
    async function openSearchEditor(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        if (searchView) {
            await instantiationService.invokeFunction(exports.openNewSearchEditor, {
                filesToInclude: searchView.searchIncludePattern.getValue(),
                onlyOpenEditors: searchView.searchIncludePattern.onlySearchInOpenEditors(),
                filesToExclude: searchView.searchExcludePattern.getValue(),
                isRegexp: searchView.searchAndReplaceWidget.searchInput?.getRegex(),
                isCaseSensitive: searchView.searchAndReplaceWidget.searchInput?.getCaseSensitive(),
                matchWholeWord: searchView.searchAndReplaceWidget.searchInput?.getWholeWords(),
                useExcludeSettingsAndIgnoreFiles: searchView.searchExcludePattern.useExcludesAndIgnoreFiles(),
                showIncludesExcludes: !!(searchView.searchIncludePattern.getValue() || searchView.searchExcludePattern.getValue() || !searchView.searchExcludePattern.useExcludesAndIgnoreFiles())
            });
        }
        else {
            await instantiationService.invokeFunction(exports.openNewSearchEditor);
        }
    }
    const openNewSearchEditor = async (accessor, _args = {}, toSide = false) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
        const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
        const historyService = accessor.get(history_1.IHistoryService);
        const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
        const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
        const activeEditorControl = editorService.activeTextEditorControl;
        let activeModel;
        let selected = '';
        if (activeEditorControl) {
            if ((0, editorBrowser_1.isDiffEditor)(activeEditorControl)) {
                if (activeEditorControl.getOriginalEditor().hasTextFocus()) {
                    activeModel = activeEditorControl.getOriginalEditor();
                }
                else {
                    activeModel = activeEditorControl.getModifiedEditor();
                }
            }
            else {
                activeModel = activeEditorControl;
            }
            const selection = activeModel?.getSelection();
            selected = (selection && activeModel?.getModel()?.getValueInRange(selection)) ?? '';
            if (selection?.isEmpty() && configurationService.getValue('search').seedWithNearestWord) {
                const wordAtPosition = activeModel.getModel()?.getWordAtPosition(selection.getStartPosition());
                if (wordAtPosition) {
                    selected = wordAtPosition.word;
                }
            }
        }
        else {
            if (editorService.activeEditor instanceof searchEditorInput_1.SearchEditorInput) {
                const active = editorService.activeEditorPane;
                selected = active.getSelected();
            }
        }
        telemetryService.publicLog2('searchEditor/openNewSearchEditor');
        const seedSearchStringFromSelection = _args.location === 'new' || configurationService.getValue('editor').find.seedSearchStringFromSelection;
        const args = { query: seedSearchStringFromSelection ? selected : undefined };
        for (const entry of Object.entries(_args)) {
            const name = entry[0];
            const value = entry[1];
            if (value !== undefined) {
                args[name] = (typeof value === 'string') ? await configurationResolverService.resolveAsync(lastActiveWorkspaceRoot, value) : value;
            }
        }
        const existing = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).find(id => id.editor.typeId === searchEditorInput_1.SearchEditorInput.ID);
        let editor;
        if (existing && args.location === 'reuse') {
            const group = editorGroupsService.getGroup(existing.groupId);
            if (!group) {
                throw new Error('Invalid group id for search editor');
            }
            const input = existing.editor;
            editor = (await group.openEditor(input));
            if (selected) {
                editor.setQuery(selected);
            }
            else {
                editor.selectQuery();
            }
            editor.setSearchConfig(args);
        }
        else {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { config: args, resultsContents: '', from: 'rawData' });
            // TODO @roblourens make this use the editor resolver service if possible
            editor = await editorService.openEditor(input, { pinned: true }, toSide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        }
        const searchOnType = configurationService.getValue('search').searchOnType;
        if (args.triggerSearch === true ||
            args.triggerSearch !== false && searchOnType && args.query) {
            editor.triggerSearch({ focusResults: args.focusResults });
        }
        if (!args.focusResults) {
            editor.focusSearchInput();
        }
    };
    exports.openNewSearchEditor = openNewSearchEditor;
    const createEditorFromSearchResult = async (accessor, searchResult, rawIncludePattern, rawExcludePattern, onlySearchInOpenEditors) => {
        if (!searchResult.query) {
            console.error('Expected searchResult.query to be defined. Got', searchResult);
            return;
        }
        const editorService = accessor.get(editorService_1.IEditorService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const labelService = accessor.get(label_1.ILabelService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const sortOrder = configurationService.getValue('search').sortOrder;
        telemetryService.publicLog2('searchEditor/createEditorFromSearchResult');
        const labelFormatter = (uri) => labelService.getUriLabel(uri, { relative: true });
        const { text, matchRanges, config } = (0, searchEditorSerialization_1.serializeSearchResultForEditor)(searchResult, rawIncludePattern, rawExcludePattern, 0, labelFormatter, sortOrder);
        config.onlyOpenEditors = onlySearchInOpenEditors;
        const contextLines = configurationService.getValue('search').searchEditor.defaultNumberOfContextLines;
        if (searchResult.isDirty || contextLines === 0 || contextLines === null) {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { resultsContents: text, config, from: 'rawData' });
            await editorService.openEditor(input, { pinned: true });
            input.setMatchRanges(matchRanges);
        }
        else {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'rawData', resultsContents: '', config: { ...config, contextLines } });
            const editor = await editorService.openEditor(input, { pinned: true });
            editor.triggerSearch({ focusResults: true });
        }
    };
    exports.createEditorFromSearchResult = createEditorFromSearchResult;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRWRpdG9yQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaEVkaXRvci9icm93c2VyL3NlYXJjaEVkaXRvckFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMEVoRyw0Q0FrQkM7SUFsRU0sTUFBTSxzQ0FBc0MsR0FBRyxDQUFDLFFBQTBCLEVBQUUsRUFBRTtRQUNwRixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztRQUNuRCxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDO1FBQ3pDLElBQUksS0FBSyxZQUFZLHFDQUFpQixFQUFFLENBQUM7WUFDdkMsYUFBYSxDQUFDLGdCQUFpQyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDeEUsQ0FBQztJQUNGLENBQUMsQ0FBQztJQU5XLFFBQUEsc0NBQXNDLDBDQU1qRDtJQUVLLE1BQU0sa0NBQWtDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLEVBQUU7UUFDaEYsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7UUFDbkQsTUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQztRQUN6QyxJQUFJLEtBQUssWUFBWSxxQ0FBaUIsRUFBRSxDQUFDO1lBQ3ZDLGFBQWEsQ0FBQyxnQkFBaUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3JFLENBQUM7SUFDRixDQUFDLENBQUM7SUFOVyxRQUFBLGtDQUFrQyxzQ0FNN0M7SUFFSyxNQUFNLDhCQUE4QixHQUFHLENBQUMsUUFBMEIsRUFBRSxFQUFFO1FBQzVFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxD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