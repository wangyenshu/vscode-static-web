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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/workbench/contrib/markers/browser/markersModel", "vs/platform/markers/common/markers", "vs/platform/severityIcon/browser/severityIcon", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/label/common/label", "vs/workbench/contrib/markers/browser/markersFilterOptions", "vs/platform/opener/browser/link", "vs/platform/opener/common/opener", "vs/workbench/contrib/markers/browser/markersViewActions", "vs/base/browser/event", "vs/workbench/contrib/markers/browser/messages", "vs/base/common/types", "vs/editor/common/core/range", "vs/platform/markers/common/markerService", "vs/base/common/severity", "vs/platform/hover/browser/hover"], function (require, exports, nls_1, DOM, event_1, lifecycle_1, instantiation_1, listService_1, highlightedLabel_1, markersModel_1, markers_1, severityIcon_1, actionbar_1, label_1, markersFilterOptions_1, link_1, opener_1, markersViewActions_1, event_2, messages_1, types_1, range_1, markerService_1, severity_1, hover_1) {
    "use strict";
    var MarkerSeverityColumnRenderer_1, MarkerCodeColumnRenderer_1, MarkerFileColumnRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersTable = void 0;
    const $ = DOM.$;
    let MarkerSeverityColumnRenderer = class MarkerSeverityColumnRenderer {
        static { MarkerSeverityColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'severity'; }
        constructor(markersViewModel, instantiationService) {
            this.markersViewModel = markersViewModel;
            this.instantiationService = instantiationService;
            this.templateId = MarkerSeverityColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const severityColumn = DOM.append(container, $('.severity'));
            const icon = DOM.append(severityColumn, $(''));
            const actionBarColumn = DOM.append(container, $('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionBarColumn, {
                actionViewItemProvider: (action, options) => action.id === markersViewActions_1.QuickFixAction.ID ? this.instantiationService.createInstance(markersViewActions_1.QuickFixActionViewItem, action, options) : undefined
            });
            return { actionBar, icon };
        }
        renderElement(element, index, templateData, height) {
            const toggleQuickFix = (enabled) => {
                if (!(0, types_1.isUndefinedOrNull)(enabled)) {
                    const container = DOM.findParentWithClass(templateData.icon, 'monaco-table-td');
                    container.classList.toggle('quickFix', enabled);
                }
            };
            templateData.icon.title = markers_1.MarkerSeverity.toString(element.marker.severity);
            templateData.icon.className = `marker-icon ${severity_1.default.toString(markers_1.MarkerSeverity.toSeverity(element.marker.severity))} codicon ${severityIcon_1.SeverityIcon.className(markers_1.MarkerSeverity.toSeverity(element.marker.severity))}`;
            templateData.actionBar.clear();
            const viewModel = this.markersViewModel.getViewModel(element);
            if (viewModel) {
                const quickFixAction = viewModel.quickFixAction;
                templateData.actionBar.push([quickFixAction], { icon: true, label: false });
                toggleQuickFix(viewModel.quickFixAction.enabled);
                quickFixAction.onDidChange(({ enabled }) => toggleQuickFix(enabled));
                quickFixAction.onShowQuickFixes(() => {
                    const quickFixActionViewItem = templateData.actionBar.viewItems[0];
                    if (quickFixActionViewItem) {
                        quickFixActionViewItem.showQuickFixes();
                    }
                });
            }
        }
        disposeTemplate(templateData) { }
    };
    MarkerSeverityColumnRenderer = MarkerSeverityColumnRenderer_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], MarkerSeverityColumnRenderer);
    let MarkerCodeColumnRenderer = class MarkerCodeColumnRenderer {
        static { MarkerCodeColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'code'; }
        constructor(hoverService, openerService) {
            this.hoverService = hoverService;
            this.openerService = openerService;
            this.templateId = MarkerCodeColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const templateDisposable = new lifecycle_1.DisposableStore();
            const codeColumn = DOM.append(container, $('.code'));
            const sourceLabel = templateDisposable.add(new highlightedLabel_1.HighlightedLabel(codeColumn));
            sourceLabel.element.classList.add('source-label');
            const codeLabel = templateDisposable.add(new highlightedLabel_1.HighlightedLabel(codeColumn));
            codeLabel.element.classList.add('code-label');
            const codeLink = templateDisposable.add(new link_1.Link(codeColumn, { href: '', label: '' }, {}, this.hoverService, this.openerService));
            return { codeColumn, sourceLabel, codeLabel, codeLink, templateDisposable };
        }
        renderElement(element, index, templateData, height) {
            templateData.codeColumn.classList.remove('code-label');
            templateData.codeColumn.classList.remove('code-link');
            if (element.marker.source && element.marker.code) {
                if (typeof element.marker.code === 'string') {
                    templateData.codeColumn.classList.add('code-label');
                    templateData.codeColumn.title = `${element.marker.source} (${element.marker.code})`;
                    templateData.sourceLabel.set(element.marker.source, element.sourceMatches);
                    templateData.codeLabel.set(element.marker.code, element.codeMatches);
                }
                else {
                    templateData.codeColumn.classList.add('code-link');
                    templateData.codeColumn.title = `${element.marker.source} (${element.marker.code.value})`;
                    templateData.sourceLabel.set(element.marker.source, element.sourceMatches);
                    const codeLinkLabel = templateData.templateDisposable.add(new highlightedLabel_1.HighlightedLabel($('.code-link-label')));
                    codeLinkLabel.set(element.marker.code.value, element.codeMatches);
                    templateData.codeLink.link = {
                        href: element.marker.code.target.toString(),
                        title: element.marker.code.target.toString(),
                        label: codeLinkLabel.element,
                    };
                }
            }
            else {
                templateData.codeColumn.title = '';
                templateData.sourceLabel.set('-');
            }
        }
        disposeTemplate(templateData) {
            templateData.templateDisposable.dispose();
        }
    };
    MarkerCodeColumnRenderer = MarkerCodeColumnRenderer_1 = __decorate([
        __param(0, hover_1.IHoverService),
        __param(1, opener_1.IOpenerService)
    ], MarkerCodeColumnRenderer);
    class MarkerMessageColumnRenderer {
        constructor() {
            this.templateId = MarkerMessageColumnRenderer.TEMPLATE_ID;
        }
        static { this.TEMPLATE_ID = 'message'; }
        renderTemplate(container) {
            const columnElement = DOM.append(container, $('.message'));
            const highlightedLabel = new highlightedLabel_1.HighlightedLabel(columnElement);
            return { columnElement, highlightedLabel };
        }
        renderElement(element, index, templateData, height) {
            templateData.columnElement.title = element.marker.message;
            templateData.highlightedLabel.set(element.marker.message, element.messageMatches);
        }
        disposeTemplate(templateData) {
            templateData.highlightedLabel.dispose();
        }
    }
    let MarkerFileColumnRenderer = class MarkerFileColumnRenderer {
        static { MarkerFileColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'file'; }
        constructor(labelService) {
            this.labelService = labelService;
            this.templateId = MarkerFileColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const columnElement = DOM.append(container, $('.file'));
            const fileLabel = new highlightedLabel_1.HighlightedLabel(columnElement);
            fileLabel.element.classList.add('file-label');
            const positionLabel = new highlightedLabel_1.HighlightedLabel(columnElement);
            positionLabel.element.classList.add('file-position');
            return { columnElement, fileLabel, positionLabel };
        }
        renderElement(element, index, templateData, height) {
            const positionLabel = messages_1.default.MARKERS_PANEL_AT_LINE_COL_NUMBER(element.marker.startLineNumber, element.marker.startColumn);
            templateData.columnElement.title = `${this.labelService.getUriLabel(element.marker.resource, { relative: false })} ${positionLabel}`;
            templateData.fileLabel.set(this.labelService.getUriLabel(element.marker.resource, { relative: true }), element.fileMatches);
            templateData.positionLabel.set(positionLabel, undefined);
        }
        disposeTemplate(templateData) {
            templateData.fileLabel.dispose();
            templateData.positionLabel.dispose();
        }
    };
    MarkerFileColumnRenderer = MarkerFileColumnRenderer_1 = __decorate([
        __param(0, label_1.ILabelService)
    ], MarkerFileColumnRenderer);
    class MarkerOwnerColumnRenderer {
        constructor() {
            this.templateId = MarkerOwnerColumnRenderer.TEMPLATE_ID;
        }
        static { this.TEMPLATE_ID = 'owner'; }
        renderTemplate(container) {
            const columnElement = DOM.append(container, $('.owner'));
            const highlightedLabel = new highlightedLabel_1.HighlightedLabel(columnElement);
            return { columnElement, highlightedLabel };
        }
        renderElement(element, index, templateData, height) {
            templateData.columnElement.title = element.marker.owner;
            templateData.highlightedLabel.set(element.marker.owner, element.ownerMatches);
        }
        disposeTemplate(templateData) {
            templateData.highlightedLabel.dispose();
        }
    }
    class MarkersTableVirtualDelegate {
        constructor() {
            this.headerRowHeight = MarkersTableVirtualDelegate.HEADER_ROW_HEIGHT;
        }
        static { this.HEADER_ROW_HEIGHT = 24; }
        static { this.ROW_HEIGHT = 24; }
        getHeight(item) {
            return MarkersTableVirtualDelegate.ROW_HEIGHT;
        }
    }
    let MarkersTable = class MarkersTable extends lifecycle_1.Disposable {
        constructor(container, markersViewModel, resourceMarkers, filterOptions, options, instantiationService, labelService) {
            super();
            this.container = container;
            this.markersViewModel = markersViewModel;
            this.resourceMarkers = resourceMarkers;
            this.filterOptions = filterOptions;
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            this._itemCount = 0;
            this.table = this.instantiationService.createInstance(listService_1.WorkbenchTable, 'Markers', this.container, new MarkersTableVirtualDelegate(), [
                {
                    label: '',
                    tooltip: '',
                    weight: 0,
                    minimumWidth: 36,
                    maximumWidth: 36,
                    templateId: MarkerSeverityColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('codeColumnLabel', "Code"),
                    tooltip: '',
                    weight: 1,
                    minimumWidth: 100,
                    maximumWidth: 300,
                    templateId: MarkerCodeColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('messageColumnLabel', "Message"),
                    tooltip: '',
                    weight: 4,
                    templateId: MarkerMessageColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('fileColumnLabel', "File"),
                    tooltip: '',
                    weight: 2,
                    templateId: MarkerFileColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('sourceColumnLabel', "Source"),
                    tooltip: '',
                    weight: 1,
                    minimumWidth: 100,
                    maximumWidth: 300,
                    templateId: MarkerOwnerColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                }
            ], [
                this.instantiationService.createInstance(MarkerSeverityColumnRenderer, this.markersViewModel),
                this.instantiationService.createInstance(MarkerCodeColumnRenderer),
                this.instantiationService.createInstance(MarkerMessageColumnRenderer),
                this.instantiationService.createInstance(MarkerFileColumnRenderer),
                this.instantiationService.createInstance(MarkerOwnerColumnRenderer),
            ], options);
            const list = this.table.domNode.querySelector('.monaco-list-rows');
            // mouseover/mouseleave event handlers
            const onRowHover = event_1.Event.chain(this._register(new event_2.DomEmitter(list, 'mouseover')).event, $ => $.map(e => DOM.findParentWithClass(e.target, 'monaco-list-row', 'monaco-list-rows'))
                .filter(((e) => !!e))
                .map(e => parseInt(e.getAttribute('data-index'))));
            const onListLeave = event_1.Event.map(this._register(new event_2.DomEmitter(list, 'mouseleave')).event, () => -1);
            const onRowHoverOrLeave = event_1.Event.latch(event_1.Event.any(onRowHover, onListLeave));
            const onRowPermanentHover = event_1.Event.debounce(onRowHoverOrLeave, (_, e) => e, 500);
            this._register(onRowPermanentHover(e => {
                if (e !== -1 && this.table.row(e)) {
                    this.markersViewModel.onMarkerMouseHover(this.table.row(e));
                }
            }));
        }
        get contextKeyService() {
            return this.table.contextKeyService;
        }
        get onContextMenu() {
            return this.table.onContextMenu;
        }
        get onDidOpen() {
            return this.table.onDidOpen;
        }
        get onDidChangeFocus() {
            return this.table.onDidChangeFocus;
        }
        get onDidChangeSelection() {
            return this.table.onDidChangeSelection;
        }
        collapseMarkers() { }
        domFocus() {
            this.table.domFocus();
        }
        filterMarkers(resourceMarkers, filterOptions) {
            this.filterOptions = filterOptions;
            this.reset(resourceMarkers);
        }
        getFocus() {
            const focus = this.table.getFocus();
            return focus.length > 0 ? [...focus.map(f => this.table.row(f))] : [];
        }
        getHTMLElement() {
            return this.table.getHTMLElement();
        }
        getRelativeTop(marker) {
            return marker ? this.table.getRelativeTop(this.table.indexOf(marker)) : null;
        }
        getSelection() {
            const selection = this.table.getSelection();
            return selection.length > 0 ? [...selection.map(i => this.table.row(i))] : [];
        }
        getVisibleItemCount() {
            return this._itemCount;
        }
        isVisible() {
            return !this.container.classList.contains('hidden');
        }
        layout(height, width) {
            this.container.style.height = `${height}px`;
            this.table.layout(height, width);
        }
        reset(resourceMarkers) {
            this.resourceMarkers = resourceMarkers;
            const items = [];
            for (const resourceMarker of this.resourceMarkers) {
                for (const marker of resourceMarker.markers) {
                    if (markerService_1.unsupportedSchemas.has(marker.resource.scheme)) {
                        continue;
                    }
                    // Exclude pattern
                    if (this.filterOptions.excludesMatcher.matches(marker.resource)) {
                        continue;
                    }
                    // Include pattern
                    if (this.filterOptions.includesMatcher.matches(marker.resource)) {
                        items.push(new markersModel_1.MarkerTableItem(marker));
                        continue;
                    }
                    // Severity filter
                    const matchesSeverity = this.filterOptions.showErrors && markers_1.MarkerSeverity.Error === marker.marker.severity ||
                        this.filterOptions.showWarnings && markers_1.MarkerSeverity.Warning === marker.marker.severity ||
                        this.filterOptions.showInfos && markers_1.MarkerSeverity.Info === marker.marker.severity;
                    if (!matchesSeverity) {
                        continue;
                    }
                    // Text filter
                    if (this.filterOptions.textFilter.text) {
                        const sourceMatches = marker.marker.source ? markersFilterOptions_1.FilterOptions._filter(this.filterOptions.textFilter.text, marker.marker.source) ?? undefined : undefined;
                        const codeMatches = marker.marker.code ? markersFilterOptions_1.FilterOptions._filter(this.filterOptions.textFilter.text, typeof marker.marker.code === 'string' ? marker.marker.code : marker.marker.code.value) ?? undefined : undefined;
                        const messageMatches = markersFilterOptions_1.FilterOptions._messageFilter(this.filterOptions.textFilter.text, marker.marker.message) ?? undefined;
                        const fileMatches = markersFilterOptions_1.FilterOptions._messageFilter(this.filterOptions.textFilter.text, this.labelService.getUriLabel(marker.resource, { relative: true })) ?? undefined;
                        const ownerMatches = markersFilterOptions_1.FilterOptions._messageFilter(this.filterOptions.textFilter.text, marker.marker.owner) ?? undefined;
                        const matched = sourceMatches || codeMatches || messageMatches || fileMatches || ownerMatches;
                        if ((matched && !this.filterOptions.textFilter.negate) || (!matched && this.filterOptions.textFilter.negate)) {
                            items.push(new markersModel_1.MarkerTableItem(marker, sourceMatches, codeMatches, messageMatches, fileMatches, ownerMatches));
                        }
                        continue;
                    }
                    items.push(new markersModel_1.MarkerTableItem(marker));
                }
            }
            this._itemCount = items.length;
            this.table.splice(0, Number.POSITIVE_INFINITY, items.sort((a, b) => {
                let result = markers_1.MarkerSeverity.compare(a.marker.severity, b.marker.severity);
                if (result === 0) {
                    result = (0, markersModel_1.compareMarkersByUri)(a.marker, b.marker);
                }
                if (result === 0) {
                    result = range_1.Range.compareRangesUsingStarts(a.marker, b.marker);
                }
                return result;
            }));
        }
        revealMarkers(activeResource, focus, lastSelectedRelativeTop) {
            if (activeResource) {
                const activeResourceIndex = this.resourceMarkers.indexOf(activeResource);
                if (activeResourceIndex !== -1) {
                    if (this.hasSelectedMarkerFor(activeResource)) {
                        const tableSelection = this.table.getSelection();
                        this.table.reveal(tableSelection[0], lastSelectedRelativeTop);
                        if (focus) {
                            this.table.setFocus(tableSelection);
                        }
                    }
                    else {
                        this.table.reveal(activeResourceIndex, 0);
                        if (focus) {
                            this.table.setFocus([activeResourceIndex]);
                            this.table.setSelection([activeResourceIndex]);
                        }
                    }
                }
            }
            else if (focus) {
                this.table.setSelection([]);
                this.table.focusFirst();
            }
        }
        setAriaLabel(label) {
            this.table.domNode.ariaLabel = label;
        }
        setMarkerSelection(selection, focus) {
            if (this.isVisible()) {
                if (selection && selection.length > 0) {
                    this.table.setSelection(selection.map(m => this.findMarkerIndex(m)));
                    if (focus && focus.length > 0) {
                        this.table.setFocus(focus.map(f => this.findMarkerIndex(f)));
                    }
                    else {
                        this.table.setFocus([this.findMarkerIndex(selection[0])]);
                    }
                    this.table.reveal(this.findMarkerIndex(selection[0]));
                }
                else if (this.getSelection().length === 0 && this.getVisibleItemCount() > 0) {
                    this.table.setSelection([0]);
                    this.table.setFocus([0]);
                    this.table.reveal(0);
                }
            }
        }
        toggleVisibility(hide) {
            this.container.classList.toggle('hidden', hide);
        }
        update(resourceMarkers) {
            for (const resourceMarker of resourceMarkers) {
                const index = this.resourceMarkers.indexOf(resourceMarker);
                this.resourceMarkers.splice(index, 1, resourceMarker);
            }
            this.reset(this.resourceMarkers);
        }
        updateMarker(marker) {
            this.table.rerender();
        }
        findMarkerIndex(marker) {
            for (let index = 0; index < this.table.length; index++) {
                if (this.table.row(index).marker === marker.marker) {
                    return index;
                }
            }
            return -1;
        }
        hasSelectedMarkerFor(resource) {
            const selectedElement = this.getSelection();
            if (selectedElement && selectedElement.length > 0) {
                if (selectedElement[0] instanceof markersModel_1.Marker) {
                    if (resource.has(selectedElement[0].marker.resource)) {
                        return true;
                    }
                }
            }
            return false;
        }
    };
    exports.MarkersTable = MarkersTable;
    exports.MarkersTable = MarkersTable = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, label_1.ILabelService)
    ], MarkersTable);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc1RhYmxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWFya2Vycy9icm93c2VyL21hcmtlcnNUYWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0JoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBMkJoQixJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE0Qjs7aUJBRWpCLGdCQUFXLEdBQUcsVUFBVSxBQUFiLENBQWM7UUFJekMsWUFDa0IsZ0JBQWtDLEVBQzVCLG9CQUE0RDtZQURsRSxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ1gseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUozRSxlQUFVLEdBQVcsOEJBQTRCLENBQUMsV0FBVyxDQUFDO1FBS25FLENBQUM7UUFFTCxjQUFjLENBQUMsU0FBc0I7WUFDcEMsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDN0QsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFL0MsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDN0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxxQkFBUyxDQUFDLGVBQWUsRUFBRTtnQkFDaEQsc0JBQXNCLEVBQUUsQ0FBQyxNQUFlLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLG1DQUFjLENBQUMsRUFBRSxDQUFDLENBQUMs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