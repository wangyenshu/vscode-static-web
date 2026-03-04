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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/fuzzyScorer", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/editor/contrib/quickAccess/browser/editorNavigationQuickAccess", "vs/nls", "vs/editor/common/services/languageFeatures", "vs/base/common/arraysFind"], function (require, exports, async_1, cancellation_1, codicons_1, themables_1, fuzzyScorer_1, lifecycle_1, strings_1, range_1, languages_1, outlineModel_1, editorNavigationQuickAccess_1, nls_1, languageFeatures_1, arraysFind_1) {
    "use strict";
    var AbstractGotoSymbolQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractGotoSymbolQuickAccessProvider = void 0;
    let AbstractGotoSymbolQuickAccessProvider = class AbstractGotoSymbolQuickAccessProvider extends editorNavigationQuickAccess_1.AbstractEditorNavigationQuickAccessProvider {
        static { AbstractGotoSymbolQuickAccessProvider_1 = this; }
        static { this.PREFIX = '@'; }
        static { this.SCOPE_PREFIX = ':'; }
        static { this.PREFIX_BY_CATEGORY = `${AbstractGotoSymbolQuickAccessProvider_1.PREFIX}${AbstractGotoSymbolQuickAccessProvider_1.SCOPE_PREFIX}`; }
        constructor(_languageFeaturesService, _outlineModelService, options = Object.create(null)) {
            super(options);
            this._languageFeaturesService = _languageFeaturesService;
            this._outlineModelService = _outlineModelService;
            this.options = options;
            this.options.canAcceptInBackground = true;
        }
        provideWithoutTextEditor(picker) {
            this.provideLabelPick(picker, (0, nls_1.localize)('cannotRunGotoSymbolWithoutEditor', "To go to a symbol, first open a text editor with symbol information."));
            return lifecycle_1.Disposable.None;
        }
        provideWithTextEditor(context, picker, token) {
            const editor = context.editor;
            const model = this.getModel(editor);
            if (!model) {
                return lifecycle_1.Disposable.None;
            }
            // Provide symbols from model if available in registry
            if (this._languageFeaturesService.documentSymbolProvider.has(model)) {
                return this.doProvideWithEditorSymbols(context, model, picker, token);
            }
            // Otherwise show an entry for a model without registry
            // But give a chance to resolve the symbols at a later
            // point if possible
            return this.doProvideWithoutEditorSymbols(context, model, picker, token);
        }
        doProvideWithoutEditorSymbols(context, model, picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // Generic pick for not having any symbol information
            this.provideLabelPick(picker, (0, nls_1.localize)('cannotRunGotoSymbolWithoutSymbolProvider', "The active text editor does not provide symbol information."));
            // Wait for changes to the registry and see if eventually
            // we do get symbols. This can happen if the picker is opened
            // very early after the model has loaded but before the
            // language registry is ready.
            // https://github.com/microsoft/vscode/issues/70607
            (async () => {
                const result = await this.waitForLanguageSymbolRegistry(model, disposables);
                if (!result || token.isCancellationRequested) {
                    return;
                }
                disposables.add(this.doProvideWithEditorSymbols(context, model, picker, token));
            })();
            return disposables;
        }
        provideLabelPick(picker, label) {
            picker.items = [{ label, index: 0, kind: 14 /* SymbolKind.String */ }];
            picker.ariaLabel = label;
        }
        async waitForLanguageSymbolRegistry(model, disposables) {
            if (this._languageFeaturesService.documentSymbolProvider.has(model)) {
                return true;
            }
            const symbolProviderRegistryPromise = new async_1.DeferredPromise();
            // Resolve promise when registry knows model
            const symbolProviderListener = disposables.add(this._languageFeaturesService.documentSymbolProvider.onDidChange(() => {
                if (this._languageFeaturesService.documentSymbolProvider.has(model)) {
                    symbolProviderListener.dispose();
                    symbolProviderRegistryPromise.complete(true);
                }
            }));
            // Resolve promise when we get disposed too
            disposables.add((0, lifecycle_1.toDisposable)(() => symbolProviderRegistryPromise.complete(false)));
            return symbolProviderRegistryPromise.p;
        }
        doProvideWithEditorSymbols(context, model, picker, token) {
            const editor = context.editor;
            const disposables = new lifecycle_1.DisposableStore();
            // Goto symbol once picked
            disposables.add(picker.onDidAccept(event => {
                const [item] = picker.selectedItems;
                if (item && item.range) {
                    this.gotoLocation(context, { range: item.range.selection, keyMods: picker.keyMods, preserveFocus: event.inBackground });
                    if (!event.inBackground) {
                        picker.hide();
                    }
                }
            }));
            // Goto symbol side by side if enabled
            disposables.add(picker.onDidTriggerItemButton(({ item }) => {
                if (item && item.range) {
                    this.gotoLocation(context, { range: item.range.selection, keyMods: picker.keyMods, forceSideBySide: true });
                    picker.hide();
                }
            }));
            // Resolve symbols from document once and reuse this
            // request for all filtering and typing then on
            const symbolsPromise = this.getDocumentSymbols(model, token);
            // Set initial picks and update on type
            let picksCts = undefined;
            const updatePickerItems = async (positionToEnclose) => {
                // Cancel any previous ask for picks and busy
                picksCts?.dispose(true);
                picker.busy = false;
                // Create new cancellation source for this run
                picksCts = new cancellation_1.CancellationTokenSource(token);
                // Collect symbol picks
                picker.busy = true;
                try {
                    const query = (0, fuzzyScorer_1.prepareQuery)(picker.value.substr(AbstractGotoSymbolQuickAccessProvider_1.PREFIX.length).trim());
                    const items = await this.doGetSymbolPicks(symbolsPromise, query, undefined, picksCts.token);
                    if (token.isCancellationRequested) {
                        return;
                    }
                    if (items.length > 0) {
                        picker.items = items;
                        if (positionToEnclose && query.original.length === 0) {
                            const candidate = (0, arraysFind_1.findLast)(items, item => Boolean(item.type !== 'separator' && item.range && range_1.Range.containsPosition(item.range.decoration, positionToEnclose)));
                            if (candidate) {
                                picker.activeItems = [candidate];
                            }
                        }
                    }
                    else {
                        if (query.original.length > 0) {
                            this.provideLabelPick(picker, (0, nls_1.localize)('noMatchingSymbolResults', "No matching editor symbols"));
                        }
                        else {
                            this.provideLabelPick(picker, (0, nls_1.localize)('noSymbolResults', "No editor symbols"));
                        }
                    }
                }
                finally {
                    if (!token.isCancellationRequested) {
                        picker.busy = false;
                    }
                }
            };
            disposables.add(picker.onDidChangeValue(() => updatePickerItems(undefined)));
            updatePickerItems(editor.getSelection()?.getPosition());
            // Reveal and decorate when active item changes
            disposables.add(picker.onDidChangeActive(() => {
                const [item] = picker.activeItems;
                if (item && item.range) {
                    // Reveal
                    editor.revealRangeInCenter(item.range.selection, 0 /* ScrollType.Smooth */);
                    // Decorate
                    this.addDecorations(editor, item.range.decoration);
                }
            }));
            return disposables;
        }
        async doGetSymbolPicks(symbolsPromise, query, options, token) {
            const symbols = await symbolsPromise;
            if (token.isCancellationRequested) {
                return [];
            }
            const filterBySymbolKind = query.original.indexOf(AbstractGotoSymbolQuickAccessProvider_1.SCOPE_PREFIX) === 0;
            const filterPos = filterBySymbolKind ? 1 : 0;
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
            // Convert to symbol picks and apply filtering
            let buttons;
            const openSideBySideDirection = this.options?.openSideBySideDirection?.();
            if (openSideBySideDirection) {
                buttons = [{
                        iconClass: openSideBySideDirection === 'right' ? themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitHorizontal) : themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitVertical),
                        tooltip: openSideBySideDirection === 'right' ? (0, nls_1.localize)('openToSide', "Open to the Side") : (0, nls_1.localize)('openToBottom', "Open to the Bottom")
                    }];
            }
            const filteredSymbolPicks = [];
            for (let index = 0; index < symbols.length; index++) {
                const symbol = symbols[index];
                const symbolLabel = (0, strings_1.trim)(symbol.name);
                const symbolLabelWithIcon = `$(${languages_1.SymbolKinds.toIcon(symbol.kind).id}) ${symbolLabel}`;
                const symbolLabelIconOffset = symbolLabelWithIcon.length - symbolLabel.length;
                let containerLabel = symbol.containerName;
                if (options?.extraContainerLabel) {
                    if (containerLabel) {
                        containerLabel = `${options.extraContainerLabel} • ${containerLabel}`;
                    }
                    else {
                        containerLabel = options.extraContainerLabel;
                    }
                }
                let symbolScore = undefined;
                let symbolMatches = undefined;
                let containerScore = undefined;
                let containerMatches = undefined;
                if (query.original.length > filterPos) {
                    // First: try to score on the entire query, it is possible that
                    // the symbol matches perfectly (e.g. searching for "change log"
                    // can be a match on a markdown symbol "change log"). In that
                    // case we want to skip the container query altogether.
                    let skipContainerQuery = false;
                    if (symbolQuery !== query) {
                        [symbolScore, symbolMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(symbolLabelWithIcon, { ...query, values: undefined /* disable multi-query support */ }, filterPos, symbolLabelIconOffset);
                        if (typeof symbolScore === 'number') {
                            skipContainerQuery = true; // since we consumed the query, skip any container matching
                        }
                    }
                    // Otherwise: score on the symbol query and match on the container later
                    if (typeof symbolScore !== 'number') {
                        [symbolScore, symbolMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(symbolLabelWithIcon, symbolQuery, filterPos, symbolLabelIconOffset);
                        if (typeof symbolScore !== 'number') {
                            continue;
                        }
                    }
                    // Score by container if specified
                    if (!skipContainerQuery && containerQuery) {
                        if (containerLabel && containerQuery.original.length > 0) {
                            [containerScore, containerMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(containerLabel, containerQuery);
                        }
                        if (typeof containerScore !== 'number') {
                            continue;
                        }
                        if (typeof symbolScore === 'number') {
                            symbolScore += containerScore; // boost symbolScore by containerScore
                        }
                    }
                }
                const deprecated = symbol.tags && symbol.tags.indexOf(1 /* SymbolTag.Deprecated */) >= 0;
                filteredSymbolPicks.push({
                    index,
                    kind: symbol.kind,
                    score: symbolScore,
                    label: symbolLabelWithIcon,
                    ariaLabel: (0, languages_1.getAriaLabelForSymbol)(symbol.name, symbol.kind),
                    description: containerLabel,
                    highlights: deprecated ? undefined : {
                        label: symbolMatches,
                        description: containerMatches
                    },
                    range: {
                        selection: range_1.Range.collapseToStart(symbol.selectionRange),
                        decoration: symbol.range
                    },
                    strikethrough: deprecated,
                    buttons
                });
            }
            // Sort by score
            const sortedFilteredSymbolPicks = filteredSymbolPicks.sort((symbolA, symbolB) => filterBySymbolKind ?
                this.compareByKindAndScore(symbolA, symbolB) :
                this.compareByScore(symbolA, symbolB));
            // Add separator for types
            // - @  only total number of symbols
            // - @: grouped by symbol kind
            let symbolPicks = [];
            if (filterBySymbolKind) {
                let lastSymbolKind = undefined;
                let lastSeparator = undefined;
                let lastSymbolKindCounter = 0;
                function updateLastSeparatorLabel() {
                    if (lastSeparator && typeof lastSymbolKind === 'number' && lastSymbolKindCounter > 0) {
                        lastSeparator.label = (0, strings_1.format)(NLS_SYMBOL_KIND_CACHE[lastSymbolKind] || FALLBACK_NLS_SYMBOL_KIND, lastSymbolKindCounter);
                    }
                }
                for (const symbolPick of sortedFilteredSymbolPicks) {
                    // Found new kind
                    if (lastSymbolKind !== symbolPick.kind) {
                        // Update last separator with number of symbols we found for kind
                        updateLastSeparatorLabel();
                        lastSymbolKind = symbolPick.kind;
                        lastSymbolKindCounter = 1;
                        // Add new separator for new kind
                        lastSeparator = { type: 'separator' };
                        symbolPicks.push(lastSeparator);
                    }
                    // Existing kind, keep counting
                    else {
                        lastSymbolKindCounter++;
                    }
                    // Add to final result
                    symbolPicks.push(symbolPick);
                }
                // Update last separator with number of symbols we found for kind
                updateLastSeparatorLabel();
            }
            else if (sortedFilteredSymbolPicks.length > 0) {
                symbolPicks = [
                    { label: (0, nls_1.localize)('symbols', "symbols ({0})", filteredSymbolPicks.length), type: 'separator' },
                    ...sortedFilteredSymbolPicks
                ];
            }
            return symbolPicks;
        }
        compareByScore(symbolA, symbolB) {
            if (typeof symbolA.score !== 'number' && typeof symbolB.score === 'number') {
                return 1;
            }
            else if (typeof symbolA.score === 'number' && typeof symbolB.score !== 'number') {
                return -1;
            }
            if (typeof symbolA.score === 'number' && typeof symbolB.score === 'number') {
                if (symbolA.score > symbolB.score) {
                    return -1;
                }
                else if (symbolA.score < symbolB.score) {
                    return 1;
                }
            }
            if (symbolA.index < symbolB.index) {
                return -1;
            }
            else if (symbolA.index > symbolB.index) {
                return 1;
            }
            return 0;
        }
        compareByKindAndScore(symbolA, symbolB) {
            const kindA = NLS_SYMBOL_KIND_CACHE[symbolA.kind] || FALLBACK_NLS_SYMBOL_KIND;
            const kindB = NLS_SYMBOL_KIND_CACHE[symbolB.kind] || FALLBACK_NLS_SYMBOL_KIND;
            // Sort by type first if scoped search
            const result = kindA.localeCompare(kindB);
            if (result === 0) {
                return this.compareByScore(symbolA, symbolB);
            }
            return result;
        }
        async getDocumentSymbols(document, token) {
            const model = await this._outlineModelService.getOrCreate(document, token);
            return token.isCancellationRequested ? [] : model.asListOfDocumentSymbols();
        }
    };
    exports.AbstractGotoSymbolQuickAccessProvider = AbstractGotoSymbolQuickAccessProvider;
    exports.AbstractGotoSymbolQuickAccessProvider = AbstractGotoSymbolQuickAccessProvider = AbstractGotoSymbolQuickAccessProvider_1 = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, outlineModel_1.IOutlineModelService)
    ], AbstractGotoSymbolQuickAccessProvider);
    // #region NLS Helpers
    const FALLBACK_NLS_SYMBOL_KIND = (0, nls_1.localize)('property', "properties ({0})");
    const NLS_SYMBOL_KIND_CACHE = {
        [5 /* SymbolKind.Method */]: (0, nls_1.localize)('method', "methods ({0})"),
        [11 /* SymbolKind.Function */]: (0, nls_1.localize)('function', "functions ({0})"),
        [8 /* SymbolKind.Constructor */]: (0, nls_1.localize)('_constructor', "constructors ({0})"),
        [12 /* SymbolKind.Variable */]: (0, nls_1.localize)('variable', "variables ({0})"),
        [4 /* SymbolKind.Class */]: (0, nls_1.localize)('class', "classes ({0})"),
        [22 /* SymbolKind.Struct */]: (0, nls_1.localize)('struct', "structs ({0})"),
        [23 /* SymbolKind.Event */]: (0, nls_1.localize)('event', "events ({0})"),
        [24 /* SymbolKind.Operator */]: (0, nls_1.localize)('operator', "operators ({0})"),
        [10 /* SymbolKind.Interface */]: (0, nls_1.localize)('interface', "interfaces ({0})"),
        [2 /* SymbolKind.Namespace */]: (0, nls_1.localize)('namespace', "namespaces ({0})"),
        [3 /* SymbolKind.Package */]: (0, nls_1.localize)('package', "packages ({0})"),
        [25 /* SymbolKind.TypeParameter */]: (0, nls_1.localize)('typeParameter', "type parameters ({0})"),
        [1 /* SymbolKind.Module */]: (0, nls_1.localize)('modules', "modules ({0})"),
        [6 /* SymbolKind.Property */]: (0, nls_1.localize)('property', "properties ({0})"),
        [9 /* SymbolKind.Enum */]: (0, nls_1.localize)('enum', "enumerations ({0})"),
        [21 /* SymbolKind.EnumMember */]: (0, nls_1.localize)('enumMember', "enumeration members ({0})"),
        [14 /* SymbolKind.String */]: (0, nls_1.localize)('string', "strings ({0})"),
        [0 /* SymbolKind.File */]: (0, nls_1.localize)('file', "files ({0})"),
        [17 /* SymbolKind.Array */]: (0, nls_1.localize)('array', "arrays ({0})"),
        [15 /* SymbolKind.Number */]: (0, nls_1.localize)('number', "numbers ({0})"),
        [16 /* SymbolKind.Boolean */]: (0, nls_1.localize)('boolean', "booleans ({0})"),
        [18 /* SymbolKind.Object */]: (0, nls_1.localize)('object', "objects ({0})"),
        [19 /* SymbolKind.Key */]: (0, nls_1.localize)('key', "keys ({0})"),
        [7 /* SymbolKind.Field */]: (0, nls_1.localize)('field', "fields ({0})"),
        [13 /* SymbolKind.Constant */]: (0, nls_1.localize)('constant', "constants ({0})")
    };
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290b1N5bWJvbFF1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvcXVpY2tBY2Nlc3MvYnJvd3Nlci9nb3RvU3ltYm9sUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlDekYsSUFBZSxxQ0FBcUMsR0FBcEQsTUFBZSxxQ0FBc0MsU0FBUSx5RUFBMkM7O2lCQUV2RyxXQUFNLEdBQUcsR0FBRyxBQUFOLENBQU87aUJBQ2IsaUJBQVksR0FBRyxHQUFHLEFBQU4sQ0FBTztpQkFDbkIsdUJBQWtCLEdBQUcsR0FBRyx1Q0FBcUMsQ0FBQyxNQUFNLEdBQUcsdUNBQXFDLENBQUMsWUFBWSxFQUFFLEFBQXpHLENBQTBHO1FBSW5JLFlBQzRDLHdCQUFrRCxFQUN0RCxvQkFBMEMsRUFDakYsVUFBaUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFFcEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBSjRCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDdEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUtqRixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztRQUMzQyxDQUFDO1FBRVMsd0JBQXdCLENBQUMsTUFBNEM7WUFDOUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxrQ0FBa0MsRUFBRSxzRUFBc0UsQ0FBQyxDQUFDLENBQUM7WUFFcEosT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQztRQUN4QixDQUFDO1FBRVMscUJBQXFCLENBQUMsT0FBc0MsRUFBRSxNQUE0QyxFQUFF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