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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/async", "vs/workbench/contrib/search/common/search", "vs/editor/common/languages", "vs/platform/label/common/label", "vs/base/common/network", "vs/platform/opener/common/opener", "vs/workbench/services/editor/common/editorService", "vs/editor/common/core/range", "vs/platform/configuration/common/configuration", "vs/editor/browser/services/codeEditorService", "vs/editor/contrib/find/browser/findController", "vs/base/common/fuzzyScorer", "vs/base/common/codicons", "vs/base/common/themables"], function (require, exports, nls_1, pickerQuickAccess_1, async_1, search_1, languages_1, label_1, network_1, opener_1, editorService_1, range_1, configuration_1, codeEditorService_1, findController_1, fuzzyScorer_1, codicons_1, themables_1) {
    "use strict";
    var SymbolsQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SymbolsQuickAccessProvider = void 0;
    let SymbolsQuickAccessProvider = class SymbolsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { SymbolsQuickAccessProvider_1 = this; }
        static { this.PREFIX = '#'; }
        static { this.TYPING_SEARCH_DELAY = 200; } // this delay accommodates for the user typing a word and then stops typing to start searching
        static { this.TREAT_AS_GLOBAL_SYMBOL_TYPES = new Set([
            4 /* SymbolKind.Class */,
            9 /* SymbolKind.Enum */,
            0 /* SymbolKind.File */,
            10 /* SymbolKind.Interface */,
            2 /* SymbolKind.Namespace */,
            3 /* SymbolKind.Package */,
            1 /* SymbolKind.Module */
        ]); }
        get defaultFilterValue() {
            // Prefer the word under the cursor in the active editor as default filter
            const editor = this.codeEditorService.getFocusedCodeEditor();
            if (editor) {
                return (0, findController_1.getSelectionSearchString)(editor) ?? undefined;
            }
            return undefined;
        }
        constructor(labelService, openerService, editorService, configurationService, codeEditorService) {
            super(SymbolsQuickAccessProvider_1.PREFIX, {
                canAcceptInBackground: true,
                noResultsPick: {
                    label: (0, nls_1.localize)('noSymbolResults', "No matching workspace symbols")
                }
            });
            this.labelService = labelService;
            this.openerService = openerService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            this.delayer = this._register(new async_1.ThrottledDelayer(SymbolsQuickAccessProvider_1.TYPING_SEARCH_DELAY));
        }
        get configuration() {
            const editorConfig = this.configurationService.getValue().workbench?.editor;
            return {
                openEditorPinned: !editorConfig?.enablePreviewFromQuickOpen || !editorConfig?.enablePreview,
                openSideBySideDirection: editorConfig?.openSideBySideDirection
            };
        }
        _getPicks(filter, disposables, token) {
            return this.getSymbolPicks(filter, undefined, token);
        }
        async getSymbolPicks(filter, options, token) {
            return this.delayer.trigger(async () => {
                if (token.isCancellationRequested) {
                    return [];
                }
                return this.doGetSymbolPicks((0, fuzzyScorer_1.prepareQuery)(filter), options, token);
            }, options?.delay);
        }
        async doGetSymbolPicks(query, options, token) {
            // Split between symbol and container query
            let symbolQuery;
            let containerQuery;
            if (query.values && query.values.length > 1) {
                symbolQuery = (0, fuzzyScorer_1.pieceToQuery)(query.values[0]); // symbol: only match on first part
                containerQuery = (0, fuzzyScorer_1.pieceToQuery)(query.values.slice(1)); // container: match on all but first parts
            }
            else {
                symbolQuery = query;
            }
            // Run the workspace symbol query
            const workspaceSymbols = await (0, search_1.getWorkspaceSymbols)(symbolQuery.original, token);
            if (token.isCancellationRequested) {
                return [];
            }
            const symbolPicks = [];
            // Convert to symbol picks and apply filtering
            const openSideBySideDirection = this.configuration.openSideBySideDirection;
            for (const { symbol, provider } of workspaceSymbols) {
                // Depending on the workspace symbols filter setting, skip over symbols that:
                // - do not have a container
                // - and are not treated explicitly as global symbols (e.g. classes)
                if (options?.skipLocal && !SymbolsQuickAccessProvider_1.TREAT_AS_GLOBAL_SYMBOL_TYPES.has(symbol.kind) && !!symbol.containerName) {
                    continue;
                }
                const symbolLabel = symbol.name;
                const symbolLabelWithIcon = `$(${languages_1.SymbolKinds.toIcon(symbol.kind).id}) ${symbolLabel}`;
                const symbolLabelIconOffset = symbolLabelWithIcon.length - symbolLabel.length;
                // Score by symbol label if searching
                let symbolScore = undefined;
                let symbolMatches = undefined;
                let skipContainerQuery = false;
                if (symbolQuery.original.length > 0) {
                    // First: try to score on the entire query, it is possible that
                    // the symbol matches perfectly (e.g. searching for "change log"
                    // can be a match on a markdown symbol "change log"). In that
                    // case we want to skip the container query altogether.
                    if (symbolQuery !== query) {
                        [symbolScore, symbolMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(symbolLabelWithIcon, { ...query, values: undefined /* disable multi-query support */ }, 0, symbolLabelIconOffset);
                        if (typeof symbolScore === 'number') {
                            skipContainerQuery = true; // since we consumed the query, skip any container matching
                        }
                    }
                    // Otherwise: score on the symbol query and match on the container later
                    if (typeof symbolScore !== 'number') {
                        [symbolScore, symbolMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(symbolLabelWithIcon, symbolQuery, 0, symbolLabelIconOffset);
                        if (typeof symbolScore !== 'number') {
                            continue;
                        }
                    }
                }
                const symbolUri = symbol.location.uri;
                let containerLabel = undefined;
                if (symbolUri) {
                    const containerPath = this.labelService.getUriLabel(symbolUri, { relative: true });
                    if (symbol.containerName) {
                        containerLabel = `${symbol.containerName} • ${containerPath}`;
                    }
                    else {
                        containerLabel = containerPath;
                    }
                }
                // Score by container if specified and searching
                let containerScore = undefined;
                let containerMatches = undefined;
                if (!skipContainerQuery && containerQuery && containerQuery.original.length > 0) {
                    if (containerLabel) {
                        [containerScore, containerMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(containerLabel, containerQuery);
                    }
                    if (typeof containerScore !== 'number') {
                        continue;
                    }
                    if (typeof symbolScore === 'number') {
                        symbolScore += containerScore; // boost symbolScore by containerScore
                    }
                }
                const deprecated = symbol.tags ? symbol.tags.indexOf(1 /* SymbolTag.Deprecated */) >= 0 : false;
                symbolPicks.push({
                    symbol,
                    resource: symbolUri,
                    score: symbolScore,
                    label: symbolLabelWithIcon,
                    ariaLabel: symbolLabel,
                    highlights: deprecated ? undefined : {
                        label: symbolMatches,
                        description: containerMatches
                    },
                    description: containerLabel,
                    strikethrough: deprecated,
                    buttons: [
                        {
                            iconClass: openSideBySideDirection === 'right' ? themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitHorizontal) : themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitVertical),
                            tooltip: openSideBySideDirection === 'right' ? (0, nls_1.localize)('openToSide', "Open to the Side") : (0, nls_1.localize)('openToBottom', "Open to the Bottom")
                        }
                    ],
                    trigger: (buttonIndex, keyMods) => {
                        this.openSymbol(provider, symbol, token, { keyMods, forceOpenSideBySide: true });
                        return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                    },
                    accept: async (keyMods, event) => this.openSymbol(provider, symbol, token, { keyMods, preserveFocus: event.inBackground, forcePinned: event.inBackground }),
                });
            }
            // Sort picks (unless disabled)
            if (!options?.skipSorting) {
                symbolPicks.sort((symbolA, symbolB) => this.compareSymbols(symbolA, symbolB));
            }
            return symbolPicks;
        }
        async openSymbol(provider, symbol, token, options) {
            // Resolve actual symbol to open for providers that can resolve
            let symbolToOpen = symbol;
            if (typeof provider.resolveWorkspaceSymbol === 'function') {
                symbolToOpen = await provider.resolveWorkspaceSymbol(symbol, token) || symbol;
                if (token.isCancellationRequested) {
                    return;
                }
            }
            // Open HTTP(s) links with opener service
            if (symbolToOpen.location.uri.scheme === network_1.Schemas.http || symbolToOpen.location.uri.scheme === network_1.Schemas.https) {
                await this.openerService.open(symbolToOpen.location.uri, { fromUserGesture: true, allowContributedOpeners: true });
            }
            // Otherwise open as editor
            else {
                await this.editorService.openEditor({
                    resource: symbolToOpen.location.uri,
                    options: {
                        preserveFocus: options?.preserveFocus,
                        pinned: options.keyMods.ctrlCmd || options.forcePinned || this.configuration.openEditorPinned,
                        selection: symbolToOpen.location.range ? range_1.Range.collapseToStart(symbolToOpen.location.range) : undefined
                    }
                }, options.keyMods.alt || (this.configuration.openEditorPinned && options.keyMods.ctrlCmd) || options?.forceOpenSideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
            }
        }
        compareSymbols(symbolA, symbolB) {
            // By score
            if (typeof symbolA.score === 'number' && typeof symbolB.score === 'number') {
                if (symbolA.score > symbolB.score) {
                    return -1;
                }
                if (symbolA.score < symbolB.score) {
                    return 1;
                }
            }
            // By name
            if (symbolA.symbol && symbolB.symbol) {
                const symbolAName = symbolA.symbol.name.toLowerCase();
                const symbolBName = symbolB.symbol.name.toLowerCase();
                const res = symbolAName.localeCompare(symbolBName);
                if (res !== 0) {
                    return res;
                }
            }
            // By kind
            if (symbolA.symbol && symbolB.symbol) {
                const symbolAKind = languages_1.SymbolKinds.toIcon(symbolA.symbol.kind).id;
                const symbolBKind = languages_1.SymbolKinds.toIcon(symbolB.symbol.kind).id;
                return symbolAKind.localeCompare(symbolBKind);
            }
            return 0;
        }
    };
    exports.SymbolsQuickAccessProvider = SymbolsQuickAccessProvider;
    exports.SymbolsQuickAccessProvider = SymbolsQuickAccessProvider = SymbolsQuickAccessProvider_1 = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, opener_1.IOpenerService),
        __param(2, editorService_1.IEditorService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, codeEditorService_1.ICodeEditorService)
    ], SymbolsQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ltYm9sc1F1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvc3ltYm9sc1F1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE2QnpGLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTJCLFNBQVEsNkNBQStDOztpQkFFdkYsV0FBTSxHQUFHLEdBQUcsQUFBTixDQUFPO2lCQUVJLHdCQUFtQixHQUFHLEdBQUcsQUFBTixDQUFPLEdBQUMsOEZBQThGO2lCQUVsSSxpQ0FBNEIsR0FBRyxJQUFJLEdBQUcsQ0FBYTs7Ozs7Ozs7U0FRakUsQ0FBQyxBQVJ5QyxDQVF4QztRQUlILElBQUksa0JBQWtCO1lBRXJCLDBFQUEwRTtZQUMxRSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUM3RCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sSUFBQSx5Q0FBd0IsRUFBQyxNQUFNLENBQUMsSUFBSSxTQUFTLENBQUM7WUFDdEQsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxZQUNnQixZQUE0QyxFQUMzQyxhQUE4QyxFQUM5QyxhQUE4QyxFQUN2QyxvQkFBNEQsRUFDL0QsaUJBQXNEO1lBRTFFLEtBQUssQ0FBQyw0QkFBMEIsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3hDLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLGFBQWEsRUFBRTtvQkFDZCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsK0JBQStCLENBQUM7aUJBQ25FO2FBQ0QsQ0FBQyxDQUFDO1lBWDZCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQzFC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