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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/toolbar/toolbar", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/editor/common/services/getIconClasses", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/outline/browser/outline", "vs/editor/common/core/range", "vs/base/browser/window", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/async", "vs/workbench/contrib/outline/browser/outline", "vs/base/common/codicons", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineProviderFactory"], function (require, exports, nls_1, DOM, toolbar_1, iconLabel_1, event_1, filters_1, lifecycle_1, themables_1, getIconClasses_1, configuration_1, configurationRegistry_1, instantiation_1, markers_1, platform_1, colorRegistry_1, themeService_1, contributions_1, notebookEditor_1, notebookCommon_1, editorService_1, outline_1, range_1, window_1, contextView_1, actions_1, contextkey_1, menuEntryActionViewItem_1, async_1, outline_2, codicons_1, notebookContextKeys_1, notebookOutlineProviderFactory_1) {
    "use strict";
    var NotebookCellOutline_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOutlineContext = exports.NotebookOutlineCreator = exports.NotebookCellOutline = void 0;
    class NotebookOutlineTemplate {
        static { this.templateId = 'NotebookOutlineRenderer'; }
        constructor(container, iconClass, iconLabel, decoration, actionMenu, elementDisposables) {
            this.container = container;
            this.iconClass = iconClass;
            this.iconLabel = iconLabel;
            this.decoration = decoration;
            this.actionMenu = actionMenu;
            this.elementDisposables = elementDisposables;
        }
    }
    let NotebookOutlineRenderer = class NotebookOutlineRenderer {
        constructor(_editor, _target, _themeService, _configurationService, _contextMenuService, _contextKeyService, _menuService, _instantiationService) {
            this._editor = _editor;
            this._target = _target;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._contextMenuService = _contextMenuService;
            this._contextKeyService = _contextKeyService;
            this._menuService = _menuService;
            this._instantiationService = _instantiationService;
            this.templateId = NotebookOutlineTemplate.templateId;
        }
        renderTemplate(container) {
            const elementDisposables = new lifecycle_1.DisposableStore();
            container.classList.add('notebook-outline-element', 'show-file-icons');
            const iconClass = document.createElement('div');
            container.append(iconClass);
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            const decoration = document.createElement('div');
            decoration.className = 'element-decoration';
            container.append(decoration);
            const actionMenu = document.createElement('div');
            actionMenu.className = 'action-menu';
            container.append(actionMenu);
            return new NotebookOutlineTemplate(container, iconClass, iconLabel, decoration, actionMenu, elementDisposables);
        }
        renderElement(node, _index, template, _height) {
            const extraClasses = [];
            const options = {
                matches: (0, filters_1.createMatches)(node.filterData),
                labelEscapeNewLines: true,
                extraClasses,
            };
            const isCodeCell = node.element.cell.cellKind === notebookCommon_1.CellKind.Code;
            if (node.element.level >= 8) { // symbol
                template.iconClass.className = 'element-icon ' + themables_1.ThemeIcon.asClassNameArray(node.element.icon).join(' ');
            }
            else if (isCodeCell && this._themeService.getFileIconTheme().hasFileIcons && !node.element.isExecuting) {
                template.iconClass.className = '';
                extraClasses.push(...(0, getIconClasses_1.getIconClassesForLanguageId)(node.element.cell.language ?? ''));
            }
            else {
                template.iconClass.className = 'element-icon ' + themables_1.ThemeIcon.asClassNameArray(node.element.icon).join(' ');
            }
            template.iconLabel.setLabel(' ' + node.element.label, undefined, options);
            const { markerInfo } = node.element;
            template.container.style.removeProperty('--outline-element-color');
            template.decoration.innerText = '';
            if (markerInfo) {
                const problem = this._configurationService.getValue('problems.visibility');
                const useBadges = this._configurationService.getValue("outline.problems.badges" /* OutlineConfigKeys.problemsBadges */);
                if (!useBadges || !problem) {
                    template.decoration.classList.remove('bubble');
                    template.decoration.innerText = '';
                }
                else if (markerInfo.count === 0) {
                    template.decoration.classList.add('bubble');
                    template.decoration.innerText = '\uea71';
                }
                else {
                    template.decoration.classList.remove('bubble');
                    template.decoration.innerText = markerInfo.count > 9 ? '9+' : String(markerInfo.count);
                }
                const color = this._themeService.getColorTheme().getColor(markerInfo.topSev === markers_1.MarkerSeverity.Error ? colorRegistry_1.listErrorForeground : colorRegistry_1.listWarningForeground);
                if (problem === undefined) {
                    return;
                }
                const useColors = this._configurationService.getValue("outline.problems.colors" /* OutlineConfigKeys.problemsColors */);
                if (!useColors || !problem) {
                    template.container.style.removeProperty('--outline-element-color');
                    template.decoration.style.setProperty('--outline-element-color', color?.toString() ?? 'inherit');
                }
                else {
                    template.container.style.setProperty('--outline-element-color', color?.toString() ?? 'inherit');
                }
            }
            if (this._target === 1 /* OutlineTarget.OutlinePane */) {
                const nbCell = node.element.cell;
                const nbViewModel = this._editor?.getViewModel();
                if (!nbViewModel) {
                    return;
                }
                const idx = nbViewModel.getCellIndex(nbCell);
                const length = isCodeCell ? 0 : nbViewModel.getFoldedLength(idx);
                const scopedContextKeyService = template.elementDisposables.add(this._contextKeyService.createScoped(template.container));
                exports.NotebookOutlineContext.CellKind.bindTo(scopedContextKeyService).set(isCodeCell ? notebookCommon_1.CellKind.Code : notebookCommon_1.CellKind.Markup);
                exports.NotebookOutlineContext.CellHasChildren.bindTo(scopedContextKeyService).set(length > 0);
                exports.NotebookOutlineContext.CellHasHeader.bindTo(scopedContextKeyService).set(node.element.level !== 7 /* NotebookOutlineConstants.NonHeaderOutlineLevel */);
                exports.NotebookOutlineContext.OutlineElementTarget.bindTo(scopedContextKeyService).set(this._target);
                this.setupFolding(isCodeCell, nbViewModel, scopedContextKeyService, template, nbCell);
                const outlineEntryToolbar = template.elementDisposables.add(new toolbar_1.ToolBar(template.actionMenu, this._contextMenuService, {
                    actionViewItemProvider: action => {
                        if (action instanceof actions_1.MenuItemAction) {
                            return this._instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, undefined);
                        }
                        return undefined;
                    },
                }));
                const menu = template.elementDisposables.add(this._menuService.createMenu(actions_1.MenuId.NotebookOutlineActionMenu, scopedContextKeyService));
                const actions = getOutlineToolbarActions(menu, { notebookEditor: this._editor, outlineEntry: node.element });
                outlineEntryToolbar.setActions(actions.primary, actions.secondary);
                this.setupToolbarListeners(outlineEntryToolbar, menu, actions, node.element, template);
                template.actionMenu.style.padding = '0 0.8em 0 0.4em';
            }
        }
        disposeTemplate(templateData) {
            templateData.iconLabel.dispose();
            templateData.elementDisposables.clear();
        }
        disposeElement(element, index, templateData, height) {
            templateData.elementDisposables.clear();
            DOM.clearNode(templateData.actionMenu);
        }
        setupFolding(isCodeCell, nbViewModel, scopedContextKeyService, template, nbCell) {
            const foldingState = isCodeCell ? 0 /* CellFoldingState.None */ : (nbCell.foldingState);
            const foldingStateCtx = exports.NotebookOutlineContext.CellFoldingState.bindTo(scopedContextKeyService);
            foldingStateCtx.set(foldingState);
            if (!isCodeCell) {
                template.elementDisposables.add(nbViewModel.onDidFoldingStateChanged(() => {
                    const foldingState = nbCell.foldingState;
                    exports.NotebookOutlineContext.CellFoldingState.bindTo(scopedContextKeyService).set(foldingState);
                    foldingStateCtx.set(foldingState);
                }));
            }
        }
        setupToolbarListeners(toolbar, menu, initActions, entry, templateData) {
            // same fix as in cellToolbars setupListeners re #103926
            let dropdownIsVisible = false;
            let deferredUpdate;
            toolbar.setActions(initActions.primary, initActions.secondary);
            templateData.elementDisposables.add(menu.onDidChange(() => {
                if (dropdownIsVisible) {
                    const actions = getOutlineToolbarActions(menu, { notebookEditor: this._editor, outlineEntry: entry });
                    deferredUpdate = () => toolbar.setActions(actions.primary, actions.secondary);
                    return;
                }
                const actions = getOutlineToolbarActions(menu, { notebookEditor: this._editor, outlineEntry: entry });
                toolbar.setActions(actions.primary, actions.secondary);
            }));
            templateData.container.classList.remove('notebook-outline-toolbar-dropdown-active');
            templateData.elementDisposables.add(toolbar.onDidChangeDropdownVisibility(visible => {
                dropdownIsVisible = visible;
                if (visible) {
                    templateData.container.classList.add('notebook-outline-toolbar-dropdown-active');
                }
                else {
                    templateData.container.classList.remove('notebook-outline-toolbar-dropdown-active');
                }
                if (deferredUpdate && !visible) {
                    (0, async_1.disposableTimeout)(() => {
                        deferredUpdate?.();
                    }, 0, templateData.elementDisposables);
                    deferredUpdate = undefined;
                }
            }));
        }
    };
    NotebookOutlineRenderer = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, actions_1.IMenuService),
        __param(7, instantiation_1.IInstantiationService)
    ], NotebookOutlineRenderer);
    function getOutlineToolbarActions(menu, args) {
        const primary = [];
        const secondary = [];
        const result = { primary, secondary };
        // TODO: @Yoyokrazy bring the "inline" back when there's an appropriate run in section icon
        (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true, arg: args }, result); //, g => /^inline/.test(g));
        return result;
    }
    class NotebookOutlineAccessibility {
        getAriaLabel(element) {
            return element.label;
        }
        getWidgetAriaLabel() {
            return '';
        }
    }
    class NotebookNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element.label;
        }
    }
    class NotebookOutlineVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return NotebookOutlineTemplate.templateId;
        }
    }
    let NotebookQuickPickProvider = class NotebookQuickPickProvider {
        constructor(_getEntries, _configurationService, _themeService) {
            this._getEntries = _getEntries;
            this._configurationService = _configurationService;
            this._themeService = _themeService;
        }
        getQuickPickElements() {
            const bucket = [];
            for (const entry of this._getEntries()) {
                entry.asFlatList(bucket);
            }
            const result = [];
            const { hasFileIcons } = this._themeService.getFileIconTheme();
            const showSymbols = this._configurationService.getValue(notebookCommon_1.NotebookSetting.gotoSymbolsAllSymbols);
            const isSymbol = (element) => !!element.symbolKind;
            const isCodeCell = (element) => (element.cell.cellKind === notebookCommon_1.CellKind.Code && element.level === 7 /* NotebookOutlineConstants.NonHeaderOutlineLevel */); // code cell entries are exactly level 7 by this constant
            for (let i = 0; i < bucket.length; i++) {
                const element = bucket[i];
                const nextElement = bucket[i + 1]; // can be undefined
                if (!showSymbols
                    && isSymbol(element)) {
                    continue;
                }
                if (showSymbols
                    && isCodeCell(element)
                    && nextElement && isSymbol(nextElement)) {
                    continue;
                }
                const useFileIcon = hasFileIcons && !element.symbolKind;
                // todo@jrieken it is fishy that codicons cannot be used with iconClasses
                // but file icons can...
                result.push({
                    element,
                    label: useFileIcon ? element.label : `$(${element.icon.id}) ${element.label}`,
                    ariaLabel: element.label,
                    iconClasses: useFileIcon ? (0, getIconClasses_1.getIconClassesForLanguageId)(element.cell.language ?? '') : undefined,
                });
            }
            return result;
        }
    };
    NotebookQuickPickProvider = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, themeService_1.IThemeService)
    ], NotebookQuickPickProvider);
    class NotebookComparator {
        constructor() {
            this._collator = new DOM.WindowIdleValue(window_1.mainWindow, () => new Intl.Collator(undefined, { numeric: true }));
        }
        compareByPosition(a, b) {
            return a.index - b.index;
        }
        compareByType(a, b) {
            return a.cell.cellKind - b.cell.cellKind || this._collator.value.compare(a.label, b.label);
        }
        compareByName(a, b) {
            return this._collator.value.compare(a.label, b.label);
        }
    }
    let NotebookCellOutline = NotebookCellOutline_1 = class NotebookCellOutline {
        get entries() {
            return this._outlineProviderReference?.object?.entries ?? [];
        }
        get activeElement() {
            return this._outlineProviderReference?.object?.activeElement;
        }
        constructor(_editor, _target, instantiationService, _editorService, _configurationService) {
            this._editor = _editor;
            this._editorService = _editorService;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._entriesDisposables = new lifecycle_1.DisposableStore();
            this.outlineKind = 'notebookCells';
            this._localDisposables = new lifecycle_1.DisposableStore();
            const installSelectionListener = () => {
                const notebookEditor = _editor.getControl();
                if (!notebookEditor?.hasModel()) {
                    this._outlineProviderReference?.dispose();
                    this._outlineProviderReference = undefined;
                    this._localDisposables.clear();
                }
                else {
                    this._outlineProviderReference?.dispose();
                    this._localDisposables.clear();
                    this._outlineProviderReference = instantiationService.invokeFunction((accessor) => accessor.get(notebookOutlineProviderFactory_1.INotebookCellOutlineProviderFactory).getOrCreate(notebookEditor, _target));
                    this._localDisposables.add(this._outlineProviderReference.object.onDidChange(e => {
                        this._onDidChange.fire(e);
                    }));
                }
            };
            this._dispoables.add(_editor.onDidChangeModel(() => {
                installSelectionListener();
            }));
            installSelectionListener();
            const treeDataSource = {
                getChildren: parent => {
                    return this.getChildren(parent, _configurationService);
                }
            };
            const delegate = new NotebookOutlineVirtualDelegate();
            const renderers = [instantiationService.createInstance(NotebookOutlineRenderer, this._editor.getControl(), _target)];
            const comparator = new NotebookComparator();
            const options = {
                collapseByDefault: _target === 2 /* OutlineTarget.Breadcrumbs */ || (_target === 1 /* OutlineTarget.OutlinePane */ && _configurationService.getValue("outline.collapseItems" /* OutlineConfigKeys.collapseItems */) === "alwaysCollapse" /* OutlineConfigCollapseItemsValues.Collapsed */),
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                accessibilityProvider: new NotebookOutlineAccessibility(),
                identityProvider: { getId: element => element.cell.uri.toString() },
                keyboardNavigationLabelProvider: new NotebookNavigationLabelProvider()
            };
            this.config = {
                breadcrumbsDataSource: {
                    getBreadcrumbElements: () => {
                        const result = [];
                        let candidate = this.activeElement;
                        while (candidate) {
                            result.unshift(candidate);
                            candidate = candidate.parent;
                        }
                        return result;
                    }
                },
                quickPickDataSource: instantiationService.createInstance(NotebookQuickPickProvider, () => (this._outlineProviderReference?.object?.entries ?? [])),
                treeDataSource,
                delegate,
                renderers,
                comparator,
                options
            };
        }
        *getChildren(parent, configurationService) {
            const showCodeCells = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCells);
            const showCodeCellSymbols = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols);
            const showMarkdownHeadersOnly = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly);
            for (const entry of parent instanceof NotebookCellOutline_1 ? (this._outlineProviderReference?.object?.entries ?? []) : parent.children) {
                if (entry.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                    if (!showMarkdownHeadersOnly) {
                        yield entry;
                    }
                    else if (entry.level < 7 /* NotebookOutlineConstants.NonHeaderOutlineLevel */) {
                        yield entry;
                    }
                }
                else if (showCodeCells && entry.cell.cellKind === notebookCommon_1.CellKind.Code) {
                    if (showCodeCellSymbols) {
                        yield entry;
                    }
                    else if (entry.level === 7 /* NotebookOutlineConstants.NonHeaderOutlineLevel */) {
                        yield entry;
                    }
                }
            }
        }
        async setFullSymbols(cancelToken) {
            await this._outlineProviderReference?.object?.setFullSymbols(cancelToken);
        }
        get uri() {
            return this._outlineProviderReference?.object?.uri;
        }
        get isEmpty() {
            return this._outlineProviderReference?.object?.isEmpty ?? true;
        }
        async reveal(entry, options, sideBySide) {
            await this._editorService.openEditor({
                resource: entry.cell.uri,
                options: {
                    ...options,
                    override: this._editor.input?.editorId,
                    cellRevealType: 5 /* CellRevealType.NearTopIfOutsideViewport */,
                    selection: entry.position
                },
            }, sideBySide ? editorService_1.SIDE_GROUP : undefined);
        }
        preview(entry) {
            const widget = this._editor.getControl();
            if (!widget) {
                return lifecycle_1.Disposable.None;
            }
            if (entry.range) {
                const range = range_1.Range.lift(entry.range);
                widget.revealRangeInCenterIfOutsideViewportAsync(entry.cell, range);
            }
            else {
                widget.revealInCenterIfOutsideViewport(entry.cell);
            }
            const ids = widget.deltaCellDecorations([], [{
                    handle: entry.cell.handle,
                    options: { className: 'nb-symbolHighlight', outputClassName: 'nb-symbolHighlight' }
                }]);
            let editorDecorations;
            widget.changeModelDecorations(accessor => {
                if (entry.range) {
                    const decorations = [
                        {
                            range: entry.range, options: {
                                description: 'document-symbols-outline-range-highlight',
                                className: 'rangeHighlight',
                                isWholeLine: true
                            }
                        }
                    ];
                    const deltaDecoration = {
                        ownerId: entry.cell.handle,
                        decorations: decorations
                    };
                    editorDecorations = accessor.deltaDecorations([], [deltaDecoration]);
                }
            });
            return (0, lifecycle_1.toDisposable)(() => {
                widget.deltaCellDecorations(ids, []);
                if (editorDecorations?.length) {
                    widget.changeModelDecorations(accessor => {
                        accessor.deltaDecorations(editorDecorations, []);
                    });
                }
            });
        }
        captureViewState() {
            const widget = this._editor.getControl();
            const viewState = widget?.getEditorViewState();
            return (0, lifecycle_1.toDisposable)(() => {
                if (viewState) {
                    widget?.restoreListViewState(viewState);
                }
            });
        }
        dispose() {
            this._onDidChange.dispose();
            this._dispoables.dispose();
            this._entriesDisposables.dispose();
            this._outlineProviderReference?.dispose();
            this._localDisposables.dispose();
        }
    };
    exports.NotebookCellOutline = NotebookCellOutline;
    exports.NotebookCellOutline = NotebookCellOutline = NotebookCellOutline_1 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService)
    ], NotebookCellOutline);
    let NotebookOutlineCreator = class NotebookOutlineCreator {
        constructor(outlineService, _instantiationService, _configurationService) {
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            const reg = outlineService.registerOutlineCreator(this);
            this.dispose = () => reg.dispose();
        }
        matches(candidate) {
            return candidate.getId() === notebookEditor_1.NotebookEditor.ID;
        }
        async createOutline(editor, target, cancelToken) {
            const outline = this._instantiationService.createInstance(NotebookCellOutline, editor, target);
            const showAllGotoSymbols = this._configurationService.getValue(notebookCommon_1.NotebookSetting.gotoSymbolsAllSymbols);
            const showAllOutlineSymbols = this._configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols);
            if (target === 4 /* OutlineTarget.QuickPick */ && showAllGotoSymbols) {
                await outline.setFullSymbols(cancelToken);
            }
            else if (target === 1 /* OutlineTarget.OutlinePane */ && showAllOutlineSymbols) {
                // No need to wait for this, we want the outline to show up quickly.
                void outline.setFullSymbols(cancelToken);
            }
            return outline;
        }
    };
    exports.NotebookOutlineCreator = NotebookOutlineCreator;
    exports.NotebookOutlineCreator = NotebookOutlineCreator = __decorate([
        __param(0, outline_1.IOutlineService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService)
    ], NotebookOutlineCreator);
    exports.NotebookOutlineContext = {
        CellKind: new contextkey_1.RawContextKey('notebookCellKind', undefined),
        CellHasChildren: new contextkey_1.RawContextKey('notebookCellHasChildren', false),
        CellHasHeader: new contextkey_1.RawContextKey('notebookCellHasHeader', false),
        CellFoldingState: new contextkey_1.RawContextKey('notebookCellFoldingState', 0 /* CellFoldingState.None */),
        OutlineElementTarget: new contextkey_1.RawContextKey('notebookOutlineElementTarget', undefined),
    };
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NotebookOutlineCreator, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'notebook',
        order: 100,
        type: 'object',
        'properties': {
            [notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('outline.showMarkdownHeadersOnly', "When enabled, notebook outline will show only markdown cells containing a header.")
            },
            [notebookCommon_1.NotebookSetting.outlineShowCodeCells]: {
                type: 'boolean',
                default: false,
                markdownDescription: (0, nls_1.localize)('outline.showCodeCells', "When enabled, notebook outline shows code cells.")
            },
            [notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('outline.showCodeCellSymbols', "When enabled, notebook outline shows code cell symbols. Relies on `notebook.outline.showCodeCells` being enabled.")
            },
            [notebookCommon_1.NotebookSetting.breadcrumbsShowCodeCells]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('breadcrumbs.showCodeCells', "When enabled, notebook breadcrumbs contain code cells.")
            },
            [notebookCommon_1.NotebookSetting.gotoSymbolsAllSymbols]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('notebook.gotoSymbols.showAllSymbols', "When enabled, the Go to Symbol Quick Pick will display full code symbols from the notebook, as well as Markdown headers.")
            },
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewTitle, {
        submenu: actions_1.MenuId.NotebookOutlineFilter,
        title: (0, nls_1.localize)('filter', "Filter Entries"),
        icon: codicons_1.Codicon.filter,
        group: 'navigation',
        order: -1,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', outline_2.IOutlinePane.Id), notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR),
    });
    (0, actions_1.registerAction2)(class ToggleShowMarkdownHeadersOnly extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.outline.toggleShowMarkdownHeadersOnly',
                title: (0, nls_1.localize)('toggleShowMarkdownHeadersOnly', "Markdown Headers Only"),
                f1: false,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.notebook.outline.showMarkdownHeadersOnly', true)
                },
                menu: {
                    id: actions_1.MenuId.NotebookOutlineFilter,
                    group: '0_markdown_cells',
                }
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const showMarkdownHeadersOnly = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly);
            configurationService.updateValue(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly, !showMarkdownHeadersOnly);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCodeCellEntries extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.outline.toggleCodeCells',
                title: (0, nls_1.localize)('toggleCodeCells', "Code Cells"),
                f1: false,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.notebook.outline.showCodeCells', true)
                },
                menu: {
                    id: actions_1.MenuId.NotebookOutlineFilter,
                    order: 1,
                    group: '1_code_cells',
                }
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const showCodeCells = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCells);
            configurationService.updateValue(notebookCommon_1.NotebookSetting.outlineShowCodeCells, !showCodeCells);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCodeCellSymbolEntries extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.outline.toggleCodeCellSymbols',
                title: (0, nls_1.localize)('toggleCodeCellSymbols', "Code Cell Symbols"),
                f1: false,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.notebook.outline.showCodeCellSymbols', true)
                },
                menu: {
                    id: actions_1.MenuId.NotebookOutlineFilter,
                    order: 2,
                    group: '1_code_cells',
                }
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const showCodeCellSymbols = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols);
            configurationService.updateValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols, !showCodeCellSymbols);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRsaW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL291dGxpbmUvbm90ZWJvb2tPdXRsaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvRGhHLE1BQU0sdUJBQXVCO2lCQUVaLGVBQVUsR0FBRyx5QkFBeUIsQ0FBQztRQUV2RCxZQUNVLFNBQXNCLEVBQ3RCLFNBQXNCLEVBQ3RCLFNBQW9CLEVBQ3BCLFVBQXVCLEVBQ3ZCLFVBQXVCLEVBQ3ZCLGtCQUFtQztZQUxuQyxjQUFTLEdBQVQsU0FBUyxDQUFhO1lBQ3RCLGNBQVMsR0FBVCxTQUFTLENBQWE7WUFDdEIsY0FBUyxHQUFULFNBQVMsQ0FBVztZQUNwQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3ZCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFpQjtRQUN6QyxDQUFDOztJQUdOLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO1FBSTVCLFlBQ2tCLE9BQW9DLEVBQ3BDLE9BQXNCLEVBQ3hCLGFBQTZDLEVBQ3JDLHFCQUE2RCxFQUMvRCxtQkFBeUQsRUFDMUQsa0JBQXVELEVBQzdELFlBQTJDLEVBQ2xDLHFCQUE2RDtZQVBuRSxZQUFPLEdBQVAsT0FBTyxDQUE2QjtZQUNwQyxZQUFPLEdBQVAsT0FBTyxDQUFlO1lBQ1Asa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDcEIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM5Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ3pDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDNUMsaUJBQVksR0FBWixZQUFZLENBQWM7WUFD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