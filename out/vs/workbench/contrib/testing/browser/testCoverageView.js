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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arraysFind", "vs/base/common/assert", "vs/base/common/codicons", "vs/base/common/decorators", "vs/base/common/filters", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/resources", "vs/base/common/themables", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/editor/common/editor", "vs/platform/files/common/files", "vs/platform/hover/browser/hover", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/labels", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testCoverageBars", "vs/workbench/contrib/testing/common/observableUtils", "vs/workbench/contrib/testing/common/testCoverage", "vs/workbench/contrib/testing/common/testCoverageService", "vs/workbench/services/editor/common/editorService"], function (require, exports, dom, arraysFind_1, assert_1, codicons_1, decorators_1, filters_1, iterator_1, lifecycle_1, observable_1, resources_1, themables_1, position_1, range_1, nls_1, actions_1, configuration_1, contextkey_1, contextView_1, editor_1, files_1, hover_1, instantiation_1, keybinding_1, label_1, listService_1, opener_1, quickInput_1, telemetry_1, themeService_1, labels_1, viewPane_1, views_1, icons_1, testCoverageBars_1, observableUtils_1, testCoverage_1, testCoverageService_1, editorService_1) {
    "use strict";
    var FileCoverageRenderer_1, DeclarationCoverageRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestCoverageView = void 0;
    var CoverageSortOrder;
    (function (CoverageSortOrder) {
        CoverageSortOrder[CoverageSortOrder["Coverage"] = 0] = "Coverage";
        CoverageSortOrder[CoverageSortOrder["Location"] = 1] = "Location";
        CoverageSortOrder[CoverageSortOrder["Name"] = 2] = "Name";
    })(CoverageSortOrder || (CoverageSortOrder = {}));
    let TestCoverageView = class TestCoverageView extends viewPane_1.ViewPane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService, coverageService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService);
            this.coverageService = coverageService;
            this.tree = new lifecycle_1.MutableDisposable();
            this.sortOrder = (0, observable_1.observableValue)('sortOrder', 1 /* CoverageSortOrder.Location */);
        }
        renderBody(container) {
            super.renderBody(container);
            const labels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility }));
            this._register((0, observable_1.autorun)(reader => {
                const coverage = this.coverageService.selected.read(reader);
                if (coverage) {
                    const t = (this.tree.value ??= this.instantiationService.createInstance(TestCoverageTree, container, labels, this.sortOrder));
                    t.setInput(coverage);
                }
                else {
                    this.tree.clear();
                }
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.value?.layout(height, width);
        }
    };
    exports.TestCoverageView = TestCoverageView;
    exports.TestCoverageView = TestCoverageView = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, hover_1.IHoverService),
        __param(11, testCoverageService_1.ITestCoverageService)
    ], TestCoverageView);
    let fnNodeId = 0;
    class DeclarationCoverageNode {
        get hits() {
            return this.data.count;
        }
        get label() {
            return this.data.name;
        }
        get location() {
            return this.data.location;
        }
        get tpc() {
            const attr = this.attributableCoverage();
            return attr && (0, testCoverage_1.getTotalCoveragePercent)(attr.statement, attr.branch, undefined);
        }
        constructor(uri, data, details) {
            this.uri = uri;
            this.data = data;
            this.id = String(fnNodeId++);
            this.containedDetails = new Set();
            this.children = [];
            if (data.location instanceof range_1.Range) {
                for (const detail of details) {
                    if (this.contains(detail.location)) {
                        this.containedDetails.add(detail);
                    }
                }
            }
        }
        /** Gets whether this function has a defined range and contains the given range. */
        contains(location) {
            const own = this.data.location;
            return own instanceof range_1.Range && (location instanceof range_1.Range ? own.containsRange(location) : own.containsPosition(location));
        }
        /**
         * If the function defines a range, we can look at statements within the
         * function to get total coverage for the function, rather than a boolean
         * yes/no.
         */
        attributableCoverage() {
            const { location, count } = this.data;
            if (!(location instanceof range_1.Range) || !count) {
                return;
            }
            const statement = { covered: 0, total: 0 };
            const branch = { covered: 0, total: 0 };
            for (const detail of this.containedDetails) {
                if (detail.type !== 1 /* DetailType.Statement */) {
                    continue;
                }
                statement.covered += detail.count ? 1 : 0;
                statement.total++;
                if (detail.branches) {
                    for (const { count } of detail.branches) {
                        branch.covered += count ? 1 : 0;
                        branch.total++;
                    }
                }
            }
            return { statement, branch };
        }
    }
    __decorate([
        decorators_1.memoize
    ], DeclarationCoverageNode.prototype, "attributableCoverage", null);
    class RevealUncoveredDeclarations {
        get label() {
            return (0, nls_1.localize)('functionsWithoutCoverage', "{0} declarations without coverage...", this.n);
        }
        constructor(n) {
            this.n = n;
            this.id = String(fnNodeId++);
        }
    }
    class LoadingDetails {
        constructor() {
            this.id = String(fnNodeId++);
            this.label = (0, nls_1.localize)('loadingCoverageDetails', "Loading Coverage Details...");
        }
    }
    const isFileCoverage = (c) => typeof c === 'object' && 'value' in c;
    const isDeclarationCoverage = (c) => c instanceof DeclarationCoverageNode;
    const shouldShowDeclDetailsOnExpand = (c) => isFileCoverage(c) && c.value instanceof testCoverage_1.FileCoverage && !!c.value.declaration?.total;
    let TestCoverageTree = class TestCoverageTree extends lifecycle_1.Disposable {
        constructor(container, labels, sortOrder, instantiationService, editorService) {
            super();
            this.inputDisposables = this._register(new lifecycle_1.DisposableStore());
            this.tree = instantiationService.createInstance(listService_1.WorkbenchCompressibleObjectTree, 'TestCoverageView', container, new TestCoverageTreeListDelegate(), [
                instantiationService.createInstance(FileCoverageRenderer, labels),
                instantiationService.createInstance(DeclarationCoverageRenderer),
                instantiationService.createInstance(BasicRenderer),
            ], {
                expandOnlyOnTwistieClick: true,
                sorter: new Sorter(sortOrder),
                keyboardNavigationLabelProvider: {
                    getCompressedNodeKeyboardNavigationLabel(elements) {
                        return elements.map(e => this.getKeyboardNavigationLabel(e)).join('/');
                    },
                    getKeyboardNavigationLabel(e) {
                        return isFileCoverage(e)
                            ? (0, resources_1.basenameOrAuthority)(e.value.uri)
                            : e.label;
                    },
                },
                accessibilityProvider: {
                    getAriaLabel(element) {
                        if (isFileCoverage(element)) {
                            const name = (0, resources_1.basenameOrAuthority)(element.value.uri);
                            return (0, nls_1.localize)('testCoverageItemLabel', "{0} coverage: {0}%", name, (element.value.tpc * 100).toFixed(2));
                        }
                        else {
                            return element.label;
                        }
                    },
                    getWidgetAriaLabel() {
                        return (0, nls_1.localize)('testCoverageTreeLabel', "Test Coverage Explorer");
                    }
                },
                identityProvider: new TestCoverageIdentityProvider(),
            });
            this._register((0, observable_1.autorun)(reader => {
                sortOrder.read(reader);
                this.tree.resort(null, true);
            }));
            this._register(this.tree);
            this._register(this.tree.onDidChangeCollapseState(e => {
                const el = e.node.element;
                if (!e.node.collapsed && !e.node.children.length && el && shouldShowDeclDetailsOnExpand(el)) {
                    if (el.value.hasSynchronousDetails) {
                        this.tree.setChildren(el, [{ element: new LoadingDetails(), incompressible: true }]);
                    }
                    el.value.details().then(details => this.updateWithDetails(el, details));
                }
            }));
            this._register(this.tree.onDidOpen(e => {
                let resource;
                let selection;
                if (e.element) {
                    if (isFileCoverage(e.element) && !e.element.children?.size) {
                        resource = e.element.value.uri;
                    }
                    else if (isDeclarationCoverage(e.element)) {
                        resource = e.element.uri;
                        selection = e.element.location;
                    }
                }
                if (!resource) {
                    return;
                }
                editorService.openEditor({
                    resource,
                    options: {
                        selection: selection instanceof position_1.Position ? range_1.Range.fromPositions(selection, selection) : selection,
                        revealIfOpened: true,
                        selectionRevealType: 3 /* TextEditorSelectionRevealType.NearTopIfOutsideViewport */,
                        preserveFocus: e.editorOptions.preserveFocus,
                        pinned: e.editorOptions.pinned,
                        source: editor_1.EditorOpenSource.USER,
                    },
                }, e.sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
            }));
        }
        setInput(coverage) {
            this.inputDisposables.clear();
            const files = [];
            for (let node of coverage.tree.nodes) {
                // when showing initial children, only show from the first file or tee
                while (!(node.value instanceof testCoverage_1.FileCoverage) && node.children?.size === 1) {
                    node = iterator_1.Iterable.first(node.children.values());
                }
                files.push(node);
            }
            const toChild = (file) => {
                const isFile = !file.children?.size;
                return {
                    element: file,
                    incompressible: isFile,
                    collapsed: isFile,
                    // directories can be expanded, and items with function info can be expanded
                    collapsible: !isFile || !!file.value?.declaration?.total,
                    children: file.children && iterator_1.Iterable.map(file.children?.values(), toChild)
                };
            };
            this.inputDisposables.add((0, observableUtils_1.onObservableChange)(coverage.didAddCoverage, nodes => {
                const toRender = (0, arraysFind_1.findLast)(nodes, n => this.tree.hasElement(n));
                if (toRender) {
                    this.tree.setChildren(toRender, iterator_1.Iterable.map(toRender.children?.values() || [], toChild), { diffIdentityProvider: { getId: el => el.value.id } });
                }
            }));
            this.tree.setChildren(null, iterator_1.Iterable.map(files, toChild));
        }
        layout(height, width) {
            this.tree.layout(height, width);
        }
        updateWithDetails(el, details) {
            if (!this.tree.hasElement(el)) {
                return; // avoid any issues if the tree changes in the meanwhile
            }
            const decl = [];
            for (const fn of details) {
                if (fn.type !== 0 /* DetailType.Declaration */) {
                    continue;
                }
                let arr = decl;
                while (true) {
                    const parent = arr.find(p => p.containedDetails.has(fn));
                    if (parent) {
                        arr = parent.children;
                    }
                    else {
                        break;
                    }
                }
                arr.push(new DeclarationCoverageNode(el.value.uri, fn, details));
            }
            const makeChild = (fn) => ({
                element: fn,
                incompressible: true,
                collapsed: true,
                collapsible: fn.children.length > 0,
                children: fn.children.map(makeChild)
            });
            this.tree.setChildren(el, decl.map(makeChild));
        }
    };
    TestCoverageTree = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, editorService_1.IEditorService)
    ], TestCoverageTree);
    class TestCoverageTreeListDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (isFileCoverage(element)) {
                return FileCoverageRenderer.ID;
            }
            if (isDeclarationCoverage(element)) {
                return DeclarationCoverageRenderer.ID;
            }
            if (element instanceof LoadingDetails || element instanceof RevealUncoveredDeclarations) {
                return BasicRenderer.ID;
            }
            (0, assert_1.assertNever)(element);
        }
    }
    class Sorter {
        constructor(order) {
            this.order = order;
        }
        compare(a, b) {
            const order = this.order.get();
            if (isFileCoverage(a) && isFileCoverage(b)) {
                switch (order) {
                    case 1 /* CoverageSortOrder.Location */:
                    case 2 /* CoverageSortOrder.Name */:
                        return a.value.uri.toString().localeCompare(b.value.uri.toString());
                    case 0 /* CoverageSortOrder.Coverage */:
                        return b.value.tpc - a.value.tpc;
                }
            }
            else if (isDeclarationCoverage(a) && isDeclarationCoverage(b)) {
                switch (order) {
                    case 1 /* CoverageSortOrder.Location */:
                        return position_1.Position.compare(a.location instanceof range_1.Range ? a.location.getStartPosition() : a.location, b.location instanceof range_1.Range ? b.location.getStartPosition() : b.location);
                    case 2 /* CoverageSortOrder.Name */:
                        return a.label.localeCompare(b.label);
                    case 0 /* CoverageSortOrder.Coverage */: {
                        const attrA = a.tpc;
                        const attrB = b.tpc;
                        return (attrA !== undefined && attrB !== undefined && attrB - attrA)
                            || (+b.hits - +a.hits)
                            || a.label.localeCompare(b.label);
                    }
                }
            }
            else {
                return 0;
            }
        }
    }
    let FileCoverageRenderer = class FileCoverageRenderer {
        static { FileCoverageRenderer_1 = this; }
        static { this.ID = 'F'; }
        constructor(labels, labelService, instantiationService) {
            this.labels = labels;
            this.labelService = labelService;
            this.instantiationService = instantiationService;
            this.templateId = FileCoverageRenderer_1.ID;
        }
        /** @inheritdoc */
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            container.classList.add('test-coverage-list-item');
            return {
                container,
                bars: templateDisposables.add(this.instantiationService.createInstance(testCoverageBars_1.ManagedTestCoverageBars, { compact: false, container })),
                label: templateDisposables.add(this.labels.create(container, {
                    supportHighlights: true,
                })),
                elementsDisposables: templateDisposables.add(new lifecycle_1.DisposableStore()),
                templateDisposables,
            };
        }
        /** @inheritdoc */
        renderElement(node, _index, templateData) {
            this.doRender(node.element, templateData, node.filterData);
        }
        /** @inheritdoc */
        renderCompressedElements(node, _index, templateData) {
            this.doRender(node.element.elements, templateData, node.filterData);
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
        /** @inheritdoc */
        doRender(element, templateData, filterData) {
            templateData.elementsDisposables.clear();
            const stat = (element instanceof Array ? element[element.length - 1] : element);
            const file = stat.value;
            const name = element instanceof Array ? element.map(e => (0, resources_1.basenameOrAuthority)(e.value.uri)) : (0, resources_1.basenameOrAuthority)(file.uri);
            templateData.elementsDisposables.add((0, observable_1.autorun)(reader => {
                stat.value?.didChange.read(reader);
                templateData.bars.setCoverageInfo(file);
            }));
            templateData.bars.setCoverageInfo(file);
            templateData.label.setResource({ resource: file.uri, name }, {
                fileKind: stat.children?.size ? files_1.FileKind.FOLDER : files_1.FileKind.FILE,
                matches: (0, filters_1.createMatches)(filterData),
                separator: this.labelService.getSeparator(file.uri.scheme, file.uri.authority),
                extraClasses: ['test-coverage-list-item-label'],
            });
        }
    };
    FileCoverageRenderer = FileCoverageRenderer_1 = __decorate([
        __param(1, label_1.ILabelService),
        __param(2, instantiation_1.IInstantiationService)
    ], FileCoverageRenderer);
    let DeclarationCoverageRenderer = class DeclarationCoverageRenderer {
        static { DeclarationCoverageRenderer_1 = this; }
        static { this.ID = 'N'; }
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            this.templateId = DeclarationCoverageRenderer_1.ID;
        }
        /** @inheritdoc */
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            container.classList.add('test-coverage-list-item');
            const icon = dom.append(container, dom.$('.state'));
            const label = dom.append(container, dom.$('.name'));
            return {
                container,
                bars: templateDisposables.add(this.instantiationService.createInstance(testCoverageBars_1.ManagedTestCoverageBars, { compact: false, container })),
                templateDisposables,
                icon,
                label,
            };
        }
        /** @inheritdoc */
        renderElement(node, _index, templateData) {
            this.doRender(node.element, templateData, node.filterData);
        }
        /** @inheritdoc */
        renderCompressedElements(node, _index, templateData) {
            this.doRender(node.element.elements[node.element.elements.length - 1], templateData, node.filterData);
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
        /** @inheritdoc */
        doRender(element, templateData, _filterData) {
            const covered = !!element.hits;
            const icon = covered ? icons_1.testingWasCovered : icons_1.testingStatesToIcons.get(0 /* TestResultState.Unset */);
            templateData.container.classList.toggle('not-covered', !covered);
            templateData.icon.className = `computed-state ${themables_1.ThemeIcon.asClassName(icon)}`;
            templateData.label.innerText = element.label;
            templateData.bars.setCoverageInfo(element.attributableCoverage());
        }
    };
    DeclarationCoverageRenderer = DeclarationCoverageRenderer_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], DeclarationCoverageRenderer);
    class BasicRenderer {
        constructor() {
            this.templateId = BasicRenderer.ID;
        }
        static { this.ID = 'B'; }
        renderCompressedElements(node, _index, container) {
            this.renderInner(node.element.elements[node.element.elements.length - 1], container);
        }
        renderTemplate(container) {
            return container;
        }
        renderElement(node, index, container) {
            this.renderInner(node.element, container);
        }
        disposeTemplate() {
            // no-op
        }
        renderInner(element, container) {
            container.innerText = element.label;
        }
    }
    class TestCoverageIdentityProvider {
        getId(element) {
            return isFileCoverage(element)
                ? element.value.uri.toString()
                : element.id;
        }
    }
    (0, actions_1.registerAction2)(class TestCoverageChangeSortingAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.coverageViewChangeSorting" /* TestCommandId.CoverageViewChangeSorting */,
                viewId: "workbench.view.testCoverage" /* Testing.CoverageViewId */,
                title: (0, nls_1.localize2)('testing.changeCoverageSort', 'Change Sort Order'),
                icon: codicons_1.Codicon.sortPrecedence,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testCoverage" /* Testing.CoverageViewId */),
                    group: 'navigation',
                }
            });
        }
        runInView(accessor, view) {
            const disposables = new lifecycle_1.DisposableStore();
            const quickInput = disposables.add(accessor.get(quickInput_1.IQuickInputService).createQuickPick());
            const items = [
                { label: (0, nls_1.localize)('testing.coverageSortByLocation', 'Sort by Location'), value: 1 /* CoverageSortOrder.Location */, description: (0, nls_1.localize)('testing.coverageSortByLocationDescription', 'Files are sorted alphabetically, declarations are sorted by position') },
                { label: (0, nls_1.localize)('testing.coverageSortByCoverage', 'Sort by Coverage'), value: 0 /* CoverageSortOrder.Coverage */, description: (0, nls_1.localize)('testing.coverageSortByCoverageDescription', 'Files and declarations are sorted by total coverage') },
                { label: (0, nls_1.localize)('testing.coverageSortByName', 'Sort by Name'), value: 2 /* CoverageSortOrder.Name */, description: (0, nls_1.localize)('testing.coverageSortByNameDescription', 'Files and declarations are sorted alphabetically') },
            ];
            quickInput.placeholder = (0, nls_1.localize)('testing.coverageSortPlaceholder', 'Sort the Test Coverage view...');
            quickInput.items = items;
            quickInput.show();
            quickInput.onDidHide(() => quickInput.dispose());
            quickInput.onDidAccept(() => {
                const picked = quickInput.selectedItems[0]?.value;
                if (picked !== undefined) {
                    view.sortOrder.set(picked, undefined);
                    quickInput.dispose();
                }
            });
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvdmVyYWdlVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci90ZXN0Q292ZXJhZ2VWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpRGhHLElBQVcsaUJBSVY7SUFKRCxXQUFXLGlCQUFpQjtRQUMzQixpRUFBUSxDQUFBO1FBQ1IsaUVBQVEsQ0FBQTtRQUNSLHlEQUFJLENBQUE7SUFDTCxDQUFDLEVBSlUsaUJBQWlCLEtBQWpCLGlCQUFpQixRQUkzQjtJQUVNLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsbUJBQVE7UUFJN0MsWUFDQyxPQUF5QixFQUNMLGlCQUFxQyxFQUNwQyxrQkFBdUMsRUFDckMsb0JBQTJDLEVBQzlDLGlCQUFxQyxFQUNqQyxxQkFBNkMsRUFDOUMsb0JBQTJDLEVBQ2xELGFBQTZCLEVBQzlCLFlBQTJCLEVBQ3ZCLGdCQUFtQyxFQUN2QyxZQUEyQixFQUNwQixlQUFzRDtZQUU1RSxLQUFLLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFGbEssb0JBQWUsR0FBZixlQUFlLENBQXNCO1lBZjVELFNBQUksR0FBRyxJQUFJLDZCQUFpQixFQUFvQixDQUFDO1lBQ2xELGNBQVMsR0FBRyxJQUFBLDRCQUFlLEVBQUMsV0FBVyxxQ0FBNkIsQ0FBQztRQWlCckYsQ0FBQztRQUVrQixVQUFVLENBQUMsU0FBc0I7WUFDbkQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FB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