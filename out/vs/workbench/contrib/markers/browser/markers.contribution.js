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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configurationRegistry", "vs/platform/action/common/actionCommonCategories", "vs/platform/keybinding/common/keybindingsRegistry", "vs/nls", "vs/workbench/contrib/markers/browser/markersModel", "vs/workbench/contrib/markers/browser/markersView", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/contrib/markers/common/markers", "vs/workbench/contrib/markers/browser/messages", "vs/workbench/common/contributions", "vs/platform/clipboard/common/clipboardService", "vs/base/common/lifecycle", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/markers/common/markers", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/common/contextkeys", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/descriptors", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/services/activity/common/activity", "vs/workbench/browser/parts/views/viewFilter", "vs/platform/configuration/common/configuration", "vs/workbench/common/configuration", "vs/workbench/contrib/markers/browser/markersFileDecorations"], function (require, exports, contextkey_1, configurationRegistry_1, actionCommonCategories_1, keybindingsRegistry_1, nls_1, markersModel_1, markersView_1, actions_1, platform_1, markers_1, messages_1, contributions_1, clipboardService_1, lifecycle_1, statusbar_1, markers_2, views_1, viewsService_1, contextkeys_1, viewPaneContainer_1, descriptors_1, codicons_1, iconRegistry_1, viewPane_1, activity_1, viewFilter_1, configuration_1, configuration_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: markers_1.Markers.MARKER_OPEN_ACTION_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(markers_1.MarkersContextKeys.MarkerFocusContextKey),
        primary: 3 /* KeyCode.Enter */,
        mac: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
        },
        handler: (accessor, args) => {
            const markersView = accessor.get(viewsService_1.IViewsService).getActiveViewWithId(markers_1.Markers.MARKERS_VIEW_ID);
            markersView.openFileAtElement(markersView.getFocusElement(), false, false, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: markers_1.Markers.MARKER_OPEN_SIDE_ACTION_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(markers_1.MarkersContextKeys.MarkerFocusContextKey),
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        mac: {
            primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */
        },
        handler: (accessor, args) => {
            const markersView = accessor.get(viewsService_1.IViewsService).getActiveViewWithId(markers_1.Markers.MARKERS_VIEW_ID);
            markersView.openFileAtElement(markersView.getFocusElement(), false, true, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: markers_1.Markers.MARKER_SHOW_PANEL_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: undefined,
        primary: undefined,
        handler: async (accessor, args) => {
            await accessor.get(viewsService_1.IViewsService).openView(markers_1.Markers.MARKERS_VIEW_ID);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: markers_1.Markers.MARKER_SHOW_QUICK_FIX,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: markers_1.MarkersContextKeys.MarkerFocusContextKey,
        primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
        handler: (accessor, args) => {
            const markersView = accessor.get(viewsService_1.IViewsService).getActiveViewWithId(markers_1.Markers.MARKERS_VIEW_ID);
            const focusedElement = markersView.getFocusElement();
            if (focusedElement instanceof markersModel_1.Marker) {
                markersView.showQuickFixes(focusedElement);
            }
        }
    });
    // configuration
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...configuration_2.problemsConfigurationNodeBase,
        'properties': {
            'problems.autoReveal': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_AUTO_REVEAL,
                'type': 'boolean',
                'default': true
            },
            'problems.defaultViewMode': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_VIEW_MODE,
                'type': 'string',
                'default': 'tree',
                'enum': ['table', 'tree'],
            },
            'problems.showCurrentInStatus': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_SHOW_CURRENT_STATUS,
                'type': 'boolean',
                'default': false
            },
            'problems.sortOrder': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_COMPARE_ORDER,
                'type': 'string',
                'default': 'severity',
                'enum': ['severity', 'position'],
                'enumDescriptions': [
                    messages_1.default.PROBLEMS_PANEL_CONFIGURATION_COMPARE_ORDER_SEVERITY,
                    messages_1.default.PROBLEMS_PANEL_CONFIGURATION_COMPARE_ORDER_POSITION,
                ],
            },
        }
    });
    const markersViewIcon = (0, iconRegistry_1.registerIcon)('markers-view-icon', codicons_1.Codicon.warning, (0, nls_1.localize)('markersViewIcon', 'View icon of the markers view.'));
    // markers view container
    const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: markers_1.Markers.MARKERS_CONTAINER_ID,
        title: messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS,
        icon: markersViewIcon,
        hideIfEmpty: true,
        order: 0,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [markers_1.Markers.MARKERS_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
        storageId: markers_1.Markers.MARKERS_VIEW_STORAGE_ID,
    }, 1 /* ViewContainerLocation.Panel */, { doNotRegisterOpenCommand: true });
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: markers_1.Markers.MARKERS_VIEW_ID,
            containerIcon: markersViewIcon,
            name: messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS,
            canToggleVisibility: false,
            canMoveView: true,
            ctorDescriptor: new descriptors_1.SyncDescriptor(markersView_1.MarkersView),
            openCommandActionDescriptor: {
                id: 'workbench.actions.view.problems',
                mnemonicTitle: (0, nls_1.localize)({ key: 'miMarker', comment: ['&& denotes a mnemonic'] }, "&&Problems"),
                keybindings: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 43 /* KeyCode.KeyM */ },
                order: 0,
            }
        }], VIEW_CONTAINER);
    // workbench
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    // actions
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.table.${markers_1.Markers.MARKERS_VIEW_ID}.viewAsTree`,
                title: (0, nls_1.localize)('viewAsTree', "View as Tree"),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID), markers_1.MarkersContextKeys.MarkersViewModeContextKey.isEqualTo("table" /* MarkersViewMode.Table */)),
                    group: 'navigation',
                    order: 3
                },
                icon: codicons_1.Codicon.listTree,
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.setViewMode("tree" /* MarkersViewMode.Tree */);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.table.${markers_1.Markers.MARKERS_VIEW_ID}.viewAsTable`,
                title: (0, nls_1.localize)('viewAsTable', "View as Table"),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID), markers_1.MarkersContextKeys.MarkersViewModeContextKey.isEqualTo("tree" /* MarkersViewMode.Tree */)),
                    group: 'navigation',
                    order: 3
                },
                icon: codicons_1.Codicon.listFlat,
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.setViewMode("table" /* MarkersViewMode.Table */);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleErrors`,
                title: (0, nls_1.localize)('show errors', "Show Errors"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowErrorsFilterContextKey,
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 1
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showErrors = !view.filters.showErrors;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleWarnings`,
                title: (0, nls_1.localize)('show warnings', "Show Warnings"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowWarningsFilterContextKey,
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 2
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showWarnings = !view.filters.showWarnings;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleInfos`,
                title: (0, nls_1.localize)('show infos', "Show Infos"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowInfoFilterContextKey,
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 3
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showInfos = !view.filters.showInfos;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleActiveFile`,
                title: (0, nls_1.localize)('show active file', "Show Active File Only"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowActiveFileFilterContextKey,
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '2_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 1
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.activeFile = !view.filters.activeFile;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleExcludedFiles`,
                title: (0, nls_1.localize)('show excluded files', "Show Excluded Files"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowExcludedFilesFilterContextKey.negate(),
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '2_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 2
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.excludedFiles = !view.filters.excludedFiles;
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.problems.focus',
                title: messages_1.default.MARKERS_PANEL_SHOW_LABEL,
                category: actionCommonCategories_1.Categories.View,
                f1: true,
            });
        }
        async run(accessor) {
            accessor.get(viewsService_1.IViewsService).openView(markers_1.Markers.MARKERS_VIEW_ID, true);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            const when = contextkey_1.ContextKeyExpr.and(contextkeys_1.FocusedViewContext.isEqualTo(markers_1.Markers.MARKERS_VIEW_ID), markers_1.MarkersContextKeys.MarkersTreeVisibilityContextKey, markers_1.MarkersContextKeys.RelatedInformationFocusContextKey.toNegated());
            super({
                id: markers_1.Markers.MARKER_COPY_ACTION_ID,
                title: (0, nls_1.localize2)('copyMarker', 'Copy'),
                menu: {
                    id: actions_1.MenuId.ProblemsPanelContext,
                    when,
                    group: 'navigation'
                },
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
                    when
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            const clipboardService = serviceAccessor.get(clipboardService_1.IClipboardService);
            const selection = markersView.getFocusedSelectedElements() || markersView.getAllResourceMarkers();
            const markers = [];
            const addMarker = (marker) => {
                if (!markers.includes(marker)) {
                    markers.push(marker);
                }
            };
            for (const selected of selection) {
                if (selected instanceof markersModel_1.ResourceMarkers) {
                    selected.markers.forEach(addMarker);
                }
                else if (selected instanceof markersModel_1.Marker) {
                    addMarker(selected);
                }
            }
            if (markers.length) {
                await clipboardService.writeText(`[${markers}]`);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKER_COPY_MESSAGE_ACTION_ID,
                title: (0, nls_1.localize2)('copyMessage', 'Copy Message'),
                menu: {
                    id: actions_1.MenuId.ProblemsPanelContext,
                    when: markers_1.MarkersContextKeys.MarkerFocusContextKey,
                    group: 'navigation'
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            const clipboardService = serviceAccessor.get(clipboardService_1.IClipboardService);
            const element = markersView.getFocusElement();
            if (element instanceof markersModel_1.Marker) {
                await clipboardService.writeText(element.marker.message);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.RELATED_INFORMATION_COPY_MESSAGE_ACTION_ID,
                title: (0, nls_1.localize2)('copyMessage', 'Copy Message'),
                menu: {
                    id: actions_1.MenuId.ProblemsPanelContext,
                    when: markers_1.MarkersContextKeys.RelatedInformationFocusContextKey,
                    group: 'navigation'
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            const clipboardService = serviceAccessor.get(clipboardService_1.IClipboardService);
            const element = markersView.getFocusElement();
            if (element instanceof markersModel_1.RelatedInformation) {
                await clipboardService.writeText(element.raw.message);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.FOCUS_PROBLEMS_FROM_FILTER,
                title: (0, nls_1.localize)('focusProblemsList', "Focus problems view"),
                keybinding: {
                    when: markers_1.MarkersContextKeys.MarkerViewFilterFocusContextKey,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.focus();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKERS_VIEW_FOCUS_FILTER,
                title: (0, nls_1.localize)('focusProblemsFilter', "Focus problems filter"),
                keybinding: {
                    when: contextkeys_1.FocusedViewContext.isEqualTo(markers_1.Markers.MARKERS_VIEW_ID),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.focusFilter();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKERS_VIEW_SHOW_MULTILINE_MESSAGE,
                title: (0, nls_1.localize2)('show multiline', "Show message in multiple lines"),
                category: (0, nls_1.localize)('problems', "Problems"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.has((0, contextkeys_1.getVisbileViewContextKey)(markers_1.Markers.MARKERS_VIEW_ID))
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.setMultiline(true);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKERS_VIEW_SHOW_SINGLELINE_MESSAGE,
                title: (0, nls_1.localize2)('show singleline', "Show message in single line"),
                category: (0, nls_1.localize)('problems', "Problems"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.has((0, contextkeys_1.getVisbileViewContextKey)(markers_1.Markers.MARKERS_VIEW_ID))
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.setMultiline(false);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKERS_VIEW_CLEAR_FILTER_TEXT,
                title: (0, nls_1.localize)('clearFiltersText', "Clear filters text"),
                category: (0, nls_1.localize)('problems', "Problems"),
                keybinding: {
                    when: markers_1.MarkersContextKeys.MarkerViewFilterFocusContextKey,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 9 /* KeyCode.Escape */
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.clearFilterText();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.treeView.${markers_1.Markers.MARKERS_VIEW_ID}.collapseAll`,
                title: (0, nls_1.localize)('collapseAll', "Collapse All"),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID), markers_1.MarkersContextKeys.MarkersViewModeContextKey.isEqualTo("tree" /* MarkersViewMode.Tree */)),
                    group: 'navigation',
                    order: 2,
                },
                icon: codicons_1.Codicon.collapseAll,
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            return view.collapseAll();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: markers_1.Markers.TOGGLE_MARKERS_VIEW_ACTION_ID,
                title: messages_1.default.MARKERS_PANEL_TOGGLE_LABEL,
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(viewsService_1.IViewsService);
            if (viewsService.isViewVisible(markers_1.Markers.MARKERS_VIEW_ID)) {
                viewsService.closeView(markers_1.Markers.MARKERS_VIEW_ID);
            }
            else {
                viewsService.openView(markers_1.Markers.MARKERS_VIEW_ID, true);
            }
        }
    });
    let MarkersStatusBarContributions = class MarkersStatusBarContributions extends lifecycle_1.Disposable {
        constructor(markerService, statusbarService, configurationService) {
            super();
            this.markerService = markerService;
            this.statusbarService = statusbarService;
            this.configurationService = configurationService;
            this.markersStatusItem = this._register(this.statusbarService.addEntry(this.getMarkersItem(), 'status.problems', 0 /* StatusbarAlignment.LEFT */, 50 /* Medium Priority */));
            const addStatusBarEntry = () => {
                this.markersStatusItemOff = this.statusbarService.addEntry(this.getMarkersItemTurnedOff(), 'status.problemsVisibility', 0 /* StatusbarAlignment.LEFT */, 49);
            };
            // Add the status bar entry if the problems is not visible
            let config = this.configurationService.getValue('problems.visibility');
            if (!config) {
                addStatusBarEntry();
            }
            this._register(this.markerService.onMarkerChanged(() => {
                this.markersStatusItem.update(this.getMarkersItem());
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('problems.visibility')) {
                    this.markersStatusItem.update(this.getMarkersItem());
                    // Update based on what setting was changed to.
                    config = this.configurationService.getValue('problems.visibility');
                    if (!config && !this.markersStatusItemOff) {
                        addStatusBarEntry();
                    }
                    else if (config && this.markersStatusItemOff) {
                        this.markersStatusItemOff.dispose();
                        this.markersStatusItemOff = undefined;
                    }
                }
            }));
        }
        getMarkersItem() {
            const markersStatistics = this.markerService.getStatistics();
            const tooltip = this.getMarkersTooltip(markersStatistics);
            return {
                name: (0, nls_1.localize)('status.problems', "Problems"),
                text: this.getMarkersText(markersStatistics),
                ariaLabel: tooltip,
                tooltip,
                command: 'workbench.actions.view.toggleProblems'
            };
        }
        getMarkersItemTurnedOff() {
            // Update to true, config checked before `getMarkersItemTurnedOff` is called.
            this.statusbarService.updateEntryVisibility('status.problemsVisibility', true);
            const openSettingsCommand = 'workbench.action.openSettings';
            const configureSettingsLabel = '@id:problems.visibility';
            const tooltip = (0, nls_1.localize)('status.problemsVisibilityOff', "Problems are turned off. Click to open settings.");
            return {
                name: (0, nls_1.localize)('status.problemsVisibility', "Problems Visibility"),
                text: '$(whole-word)',
                ariaLabel: tooltip,
                tooltip,
                kind: 'warning',
                command: { title: openSettingsCommand, arguments: [configureSettingsLabel], id: openSettingsCommand }
            };
        }
        getMarkersTooltip(stats) {
            const errorTitle = (n) => (0, nls_1.localize)('totalErrors', "Errors: {0}", n);
            const warningTitle = (n) => (0, nls_1.localize)('totalWarnings', "Warnings: {0}", n);
            const infoTitle = (n) => (0, nls_1.localize)('totalInfos', "Infos: {0}", n);
            const titles = [];
            if (stats.errors > 0) {
                titles.push(errorTitle(stats.errors));
            }
            if (stats.warnings > 0) {
                titles.push(warningTitle(stats.warnings));
            }
            if (stats.infos > 0) {
                titles.push(infoTitle(stats.infos));
            }
            if (titles.length === 0) {
                return (0, nls_1.localize)('noProblems', "No Problems");
            }
            return titles.join(', ');
        }
        getMarkersText(stats) {
            const problemsText = [];
            // Errors
            problemsText.push('$(error) ' + this.packNumber(stats.errors));
            // Warnings
            problemsText.push('$(warning) ' + this.packNumber(stats.warnings));
            // Info (only if any)
            if (stats.infos > 0) {
                problemsText.push('$(info) ' + this.packNumber(stats.infos));
            }
            return problemsText.join(' ');
        }
        packNumber(n) {
            const manyProblems = (0, nls_1.localize)('manyProblems', "10K+");
            return n > 9999 ? manyProblems : n > 999 ? n.toString().charAt(0) + 'K' : n.toString();
        }
    };
    MarkersStatusBarContributions = __decorate([
        __param(0, markers_2.IMarkerService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, configuration_1.IConfigurationService)
    ], MarkersStatusBarContributions);
    workbenchRegistry.registerWorkbenchContribution(MarkersStatusBarContributions, 3 /* LifecyclePhase.Restored */);
    let ActivityUpdater = class ActivityUpdater extends lifecycle_1.Disposable {
        constructor(activityService, markerService) {
            super();
            this.activityService = activityService;
            this.markerService = markerService;
            this.activity = this._register(new lifecycle_1.MutableDisposable());
            this._register(this.markerService.onMarkerChanged(() => this.updateBadge()));
            this.updateBadge();
        }
        updateBadge() {
            const { errors, warnings, infos } = this.markerService.getStatistics();
            const total = errors + warnings + infos;
            if (total > 0) {
                const message = (0, nls_1.localize)('totalProblems', 'Total {0} Problems', total);
                this.activity.value = this.activityService.showViewActivity(markers_1.Markers.MARKERS_VIEW_ID, { badge: new activity_1.NumberBadge(total, () => message) });
            }
            else {
                this.activity.value = undefined;
            }
        }
    };
    ActivityUpdater = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, markers_2.IMarkerService)
    ], ActivityUpdater);
    workbenchRegistry.registerWorkbenchContribution(ActivityUpdater, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vycy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tYXJrZXJzL2Jyb3dzZXIvbWFya2Vycy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFvQ2hHLHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDO1FBQ3BELEVBQUUsRUFBRSxpQkFBTyxDQUFDLHFCQUFxQjtRQUNqQyxNQUFNLDZDQUFtQztRQUN6QyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsNEJBQWtCLENBQUMscUJBQXFCLENBQUM7UUFDbEUsT0FBTyx1QkFBZTtRQUN0QixHQUFHLEVBQUU7WUFDSixPQUFPLHVCQUFlO1lBQ3RCLFNBQVMsRUFBRSxDQUFDLHNEQUFrQyxDQUFDO1NBQy9DO1FBQ0QsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLElBQVMsRUFBRSxFQUFFO1lBQ2hDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWEsQ0FBQyxDQUFDLG1CQUFtQixDQUFjLGlCQUFPLENBQUMsZUFBZSxDQUFFLENBQUM7WUFDM0csV0FBVyxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCx5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQztRQUNwRCxFQUFFLEVBQUUsaUJBQU8sQ0FBQywwQkFBMEI7UUFDdEMsTUFBTSw2Q0FBbUM7UUFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDRCQUFrQixDQUFDLHFCQUFxQixDQUFDO1FBQ2xFLE9BQU8sRUFBRSxpREFBOEI7UUFD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