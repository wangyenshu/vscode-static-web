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
define(["require", "exports", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/browser/parts/views/viewPane", "vs/base/browser/dom", "vs/workbench/contrib/scm/common/scm", "vs/workbench/browser/labels", "vs/base/browser/ui/countBadge/countBadge", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/themeService", "./util", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/base/common/resourceTree", "vs/base/common/iterator", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/comparers", "vs/base/common/filters", "vs/workbench/common/views", "vs/nls", "vs/base/common/arrays", "vs/platform/storage/common/storage", "vs/workbench/common/editor", "vs/workbench/common/theme", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/editor/common/services/model", "vs/editor/browser/editorExtensions", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/codeEditor/browser/dictation/editorDictation", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/instantiation/common/serviceCollection", "vs/editor/contrib/colorPicker/browser/colorDetector", "vs/editor/contrib/links/browser/links", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/editor/common/languages/language", "vs/platform/label/common/label", "vs/base/browser/fonts", "vs/base/common/codicons", "vs/base/common/themables", "vs/workbench/contrib/scm/browser/scmRepositoryRenderer", "vs/platform/theme/common/theme", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/base/browser/ui/button/button", "vs/platform/notification/common/notification", "vs/workbench/contrib/scm/browser/scmViewService", "vs/editor/contrib/dnd/browser/dnd", "vs/editor/contrib/dropOrPasteInto/browser/copyPasteController", "vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorController", "vs/editor/contrib/message/browser/messageController", "vs/platform/theme/browser/defaultStyles", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/editor/contrib/codeAction/browser/codeActionController", "vs/editor/common/services/resolverService", "vs/base/common/network", "vs/workbench/browser/dnd", "vs/platform/dnd/browser/dnd", "vs/editor/contrib/format/browser/formatActions", "vs/editor/common/config/editorOptions", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/common/core/editOperation", "vs/base/common/iconLabels", "vs/base/browser/ui/iconLabel/iconLabel", "vs/platform/theme/common/colorRegistry", "vs/platform/actions/browser/toolbar", "vs/base/common/cancellation", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/base/common/numbers", "vs/platform/log/common/log", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/common/htmlContent", "vs/platform/hover/browser/hover", "vs/workbench/contrib/multiDiffEditor/browser/scmMultiDiffSourceResolver", "vs/editor/contrib/hover/browser/hoverController", "vs/css!./media/scm"], function (require, exports, event_1, resources_1, lifecycle_1, viewPane_1, dom_1, scm_1, labels_1, countBadge_1, editorService_1, instantiation_1, contextView_1, contextkey_1, commands_1, keybinding_1, actions_1, actions_2, actionbar_1, themeService_1, util_1, listService_1, configuration_1, async_1, resourceTree_1, iterator_1, uri_1, files_1, comparers_1, filters_1, views_1, nls_1, arrays_1, storage_1, editor_1, theme_1, codeEditorWidget_1, simpleEditorOptions_1, model_1, editorExtensions_1, menuPreventer_1, selectionClipboard_1, editorDictation_1, contextmenu_1, platform, strings_1, suggestController_1, snippetController2_1, serviceCollection_1, colorDetector_1, links_1, opener_1, telemetry_1, language_1, label_1, fonts_1, codicons_1, themables_1, scmRepositoryRenderer_1, theme_2, editorCommands_1, menuEntryActionViewItem_1, markdownRenderer_1, button_1, notification_1, scmViewService_1, dnd_1, copyPasteController_1, dropIntoEditorController_1, messageController_1, defaultStyles_1, inlineCompletionsController_1, codeActionController_1, resolverService_1, network_1, dnd_2, dnd_3, formatActions_1, editorOptions_1, uriIdentity_1, editOperation_1, iconLabels_1, iconLabel_1, colorRegistry_1, toolbar_1, cancellation_1, dropdownWithPrimaryActionViewItem_1, numbers_1, log_1, hoverDelegateFactory_1, htmlContent_1, hover_1, scmMultiDiffSourceResolver_1, hoverController_1) {
    "use strict";
    var ActionButtonRenderer_1, InputRenderer_1, ResourceGroupRenderer_1, ResourceRenderer_1, HistoryItemGroupRenderer_1, HistoryItemRenderer_1, HistoryItemChangeRenderer_1, SeparatorRenderer_1, SCMInputWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMActionButton = exports.SCMViewPane = exports.SCMAccessibilityProvider = exports.SCMTreeKeyboardNavigationLabelProvider = exports.SCMTreeSorter = exports.ActionButtonRenderer = void 0;
    (0, colorRegistry_1.registerColor)('scm.historyItemAdditionsForeground', {
        dark: 'gitDecoration.addedResourceForeground',
        light: 'gitDecoration.addedResourceForeground',
        hcDark: 'gitDecoration.addedResourceForeground',
        hcLight: 'gitDecoration.addedResourceForeground'
    }, (0, nls_1.localize)('scm.historyItemAdditionsForeground', "History item additions foreground color."));
    (0, colorRegistry_1.registerColor)('scm.historyItemDeletionsForeground', {
        dark: 'gitDecoration.deletedResourceForeground',
        light: 'gitDecoration.deletedResourceForeground',
        hcDark: 'gitDecoration.deletedResourceForeground',
        hcLight: 'gitDecoration.deletedResourceForeground'
    }, (0, nls_1.localize)('scm.historyItemDeletionsForeground', "History item deletions foreground color."));
    (0, colorRegistry_1.registerColor)('scm.historyItemStatisticsBorder', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.2),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.2),
        hcDark: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.2),
        hcLight: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.2)
    }, (0, nls_1.localize)('scm.historyItemStatisticsBorder', "History item statistics border color."));
    (0, colorRegistry_1.registerColor)('scm.historyItemSelectedStatisticsBorder', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.listActiveSelectionForeground, 0.2),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.listActiveSelectionForeground, 0.2),
        hcDark: (0, colorRegistry_1.transparent)(colorRegistry_1.listActiveSelectionForeground, 0.2),
        hcLight: (0, colorRegistry_1.transparent)(colorRegistry_1.listActiveSelectionForeground, 0.2)
    }, (0, nls_1.localize)('scm.historyItemSelectedStatisticsBorder', "History item selected statistics border color."));
    function processResourceFilterData(uri, filterData) {
        if (!filterData) {
            return [undefined, undefined];
        }
        if (!filterData.label) {
            const matches = (0, filters_1.createMatches)(filterData);
            return [matches, undefined];
        }
        const fileName = (0, resources_1.basename)(uri);
        const label = filterData.label;
        const pathLength = label.length - fileName.length;
        const matches = (0, filters_1.createMatches)(filterData.score);
        // FileName match
        if (label === fileName) {
            return [matches, undefined];
        }
        // FilePath match
        const labelMatches = [];
        const descriptionMatches = [];
        for (const match of matches) {
            if (match.start > pathLength) {
                // Label match
                labelMatches.push({
                    start: match.start - pathLength,
                    end: match.end - pathLength
                });
            }
            else if (match.end < pathLength) {
                // Description match
                descriptionMatches.push(match);
            }
            else {
                // Spanning match
                labelMatches.push({
                    start: 0,
                    end: match.end - pathLength
                });
                descriptionMatches.push({
                    start: match.start,
                    end: pathLength
                });
            }
        }
        return [labelMatches, descriptionMatches];
    }
    let ActionButtonRenderer = class ActionButtonRenderer {
        static { ActionButtonRenderer_1 = this; }
        static { this.DEFAULT_HEIGHT = 30; }
        static { this.TEMPLATE_ID = 'actionButton'; }
        get templateId() { return ActionButtonRenderer_1.TEMPLATE_ID; }
        constructor(commandService, contextMenuService, notificationService) {
            this.commandService = commandService;
            this.contextMenuService = contextMenuService;
            this.notificationService = notificationService;
            this.actionButtons = new Map();
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-no-twistie');
            // Use default cursor & disable hover for list item
            container.parentElement.parentElement.classList.add('cursor-default', 'force-no-hover');
            const buttonContainer = (0, dom_1.append)(container, (0, dom_1.$)('.button-container'));
            const actionButton = new SCMActionButton(buttonContainer, this.contextMenuService, this.commandService, this.notificationService);
            return { actionButton, disposable: lifecycle_1.Disposable.None, templateDisposable: actionButton };
        }
        renderElement(node, index, templateData, height) {
            templateData.disposable.dispose();
            const disposables = new lifecycle_1.DisposableStore();
            const actionButton = node.element;
            templateData.actionButton.setButton(node.element.button);
            // Remember action button
            const renderedActionButtons = this.actionButtons.get(actionButton) ?? [];
            this.actionButtons.set(actionButton, [...renderedActionButtons, templateData.actionButton]);
            disposables.add({
                dispose: () => {
                    const renderedActionButtons = this.actionButtons.get(actionButton) ?? [];
                    const renderedWidgetIndex = renderedActionButtons.findIndex(renderedActionButton => renderedActionButton === templateData.actionButton);
                    if (renderedWidgetIndex < 0) {
                        throw new Error('Disposing unknown action button');
                    }
                    if (renderedActionButtons.length === 1) {
                        this.actionButtons.delete(actionButton);
                    }
                    else {
                        renderedActionButtons.splice(renderedWidgetIndex, 1);
                    }
                }
            });
            templateData.disposable = disposables;
        }
        renderCompressedElements() {
            throw new Error('Should never happen since node is incompressible');
        }
        focusActionButton(actionButton) {
            this.actionButtons.get(actionButton)?.forEach(renderedActionButton => renderedActionButton.focus());
        }
        disposeElement(node, index, template) {
            template.disposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.disposable.dispose();
            templateData.templateDisposable.dispose();
        }
    };
    exports.ActionButtonRenderer = ActionButtonRenderer;
    exports.ActionButtonRenderer = ActionButtonRenderer = ActionButtonRenderer_1 = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, notification_1.INotificationService)
    ], ActionButtonRenderer);
    class SCMTreeDragAndDrop {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        getDragURI(element) {
            if ((0, util_1.isSCMResource)(element)) {
                return element.sourceUri.toString();
            }
            return null;
        }
        onDragStart(data, originalEvent) {
            const items = SCMTreeDragAndDrop.getResourcesFromDragAndDropData(data);
            if (originalEvent.dataTransfer && items?.length) {
                this.instantiationService.invokeFunction(accessor => (0, dnd_2.fillEditorsDragData)(accessor, items, originalEvent));
                const fileResources = items.filter(s => s.scheme === network_1.Schemas.file).map(r => r.fsPath);
                if (fileResources.length) {
                    originalEvent.dataTransfer.setData(dnd_3.CodeDataTransfers.FILES, JSON.stringify(fileResources));
                }
            }
        }
        getDragLabel(elements, originalEvent) {
            if (elements.length === 1) {
                const element = elements[0];
                if ((0, util_1.isSCMResource)(element)) {
                    return (0, resources_1.basename)(element.sourceUri);
                }
            }
            return String(elements.length);
        }
        onDragOver(data, targetElement, targetIndex, targetSector, originalEvent) {
            return true;
        }
        drop(data, targetElement, targetIndex, targetSector, originalEvent) { }
        static getResourcesFromDragAndDropData(data) {
            const uris = [];
            for (const element of [...data.context ?? [], ...data.elements]) {
                if ((0, util_1.isSCMResource)(element)) {
                    uris.push(element.sourceUri);
                }
            }
            return uris;
        }
        dispose() { }
    }
    let InputRenderer = class InputRenderer {
        static { InputRenderer_1 = this; }
        static { this.DEFAULT_HEIGHT = 26; }
        static { this.TEMPLATE_ID = 'input'; }
        get templateId() { return InputRenderer_1.TEMPLATE_ID; }
        constructor(outerLayout, overflowWidgetsDomNode, updateHeight, instantiationService) {
            this.outerLayout = outerLayout;
            this.overflowWidgetsDomNode = overflowWidgetsDomNode;
            this.updateHeight = updateHeight;
            this.instantiationService = instantiationService;
            this.inputWidgets = new Map();
            this.contentHeights = new WeakMap();
            this.editorSelections = new WeakMap();
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-no-twistie');
            // Disable hover for list item
            container.parentElement.parentElement.classList.add('force-no-hover');
            const templateDisposable = new lifecycle_1.DisposableStore();
            const inputElement = (0, dom_1.append)(container, (0, dom_1.$)('.scm-input'));
            const inputWidget = this.instantiationService.createInstance(SCMInputWidget, inputElement, this.overflowWidgetsDomNode);
            templateDisposable.add(inputWidget);
            return { inputWidget, inputWidgetHeight: InputRenderer_1.DEFAULT_HEIGHT, elementDisposables: new lifecycle_1.DisposableStore(), templateDisposable };
        }
        renderElement(node, index, templateData) {
            const input = node.element;
            templateData.inputWidget.setInput(input);
            // Remember widget
            const renderedWidgets = this.inputWidgets.get(input) ?? [];
            this.inputWidgets.set(input, [...renderedWidgets, templateData.inputWidget]);
            templateData.elementDisposables.add({
                dispose: () => {
                    const renderedWidgets = this.inputWidgets.get(input) ?? [];
                    const renderedWidgetIndex = renderedWidgets.findIndex(renderedWidget => renderedWidget === templateData.inputWidget);
                    if (renderedWidgetIndex < 0) {
                        throw new Error('Disposing unknown input widget');
                    }
                    if (renderedWidgets.length === 1) {
                        this.inputWidgets.delete(input);
                    }
                    else {
                        renderedWidgets.splice(renderedWidgetIndex, 1);
                    }
                }
            });
            // Widget cursor selections
            const selections = this.editorSelections.get(input);
            if (selections) {
                templateData.inputWidget.selections = selections;
            }
            templateData.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                const selections = templateData.inputWidget.selections;
                if (selections) {
                    this.editorSelections.set(input, selections);
                }
            }));
            // Reset widget height so it's recalculated
            templateData.inputWidgetHeight = InputRenderer_1.DEFAULT_HEIGHT;
            // Rerender the element whenever the editor content height changes
            const onDidChangeContentHeight = () => {
                const contentHeight = templateData.inputWidget.getContentHeight();
                this.contentHeights.set(input, contentHeight);
                if (templateData.inputWidgetHeight !== contentHeight) {
                    this.updateHeight(input, contentHeight + 10);
                    templateData.inputWidgetHeight = contentHeight;
                    templateData.inputWidget.layout();
                }
            };
            const startListeningContentHeightChange = () => {
                templateData.elementDisposables.add(templateData.inputWidget.onDidChangeContentHeight(onDidChangeContentHeight));
                onDidChangeContentHeight();
            };
            // Setup height change listener on next tick
            (0, async_1.disposableTimeout)(startListeningContentHeightChange, 0, templateData.elementDisposables);
            // Layout the editor whenever the outer layout happens
            const layoutEditor = () => templateData.inputWidget.layout();
            templateData.elementDisposables.add(this.outerLayout.onDidChange(layoutEditor));
            layoutEditor();
        }
        renderCompressedElements() {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(group, index, template) {
            template.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.templateDisposable.dispose();
        }
        getHeight(input) {
            return (this.contentHeights.get(input) ?? InputRenderer_1.DEFAULT_HEIGHT) + 10;
        }
        getRenderedInputWidget(input) {
            return this.inputWidgets.get(input);
        }
        getFocusedInput() {
            for (const [input, inputWidgets] of this.inputWidgets) {
                for (const inputWidget of inputWidgets) {
                    if (inputWidget.hasFocus()) {
                        return input;
                    }
                }
            }
            return undefined;
        }
        clearValidation() {
            for (const [, inputWidgets] of this.inputWidgets) {
                for (const inputWidget of inputWidgets) {
                    inputWidget.clearValidation();
                }
            }
        }
    };
    InputRenderer = InputRenderer_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], InputRenderer);
    let ResourceGroupRenderer = class ResourceGroupRenderer {
        static { ResourceGroupRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'resource group'; }
        get templateId() { return ResourceGroupRenderer_1.TEMPLATE_ID; }
        constructor(actionViewItemProvider, scmViewService) {
            this.actionViewItemProvider = actionViewItemProvider;
            this.scmViewService = scmViewService;
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-twistie');
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.resource-group'));
            const name = (0, dom_1.append)(element, (0, dom_1.$)('.name'));
            const actionsContainer = (0, dom_1.append)(element, (0, dom_1.$)('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, { actionViewItemProvider: this.actionViewItemProvider });
            const countContainer = (0, dom_1.append)(element, (0, dom_1.$)('.count'));
            const count = new countBadge_1.CountBadge(countContainer, {}, defaultStyles_1.defaultCountBadgeStyles);
            const disposables = (0, lifecycle_1.combinedDisposable)(actionBar);
            return { name, count, actionBar, elementDisposables: new lifecycle_1.DisposableStore(), disposables };
        }
        renderElement(node, index, template) {
            const group = node.element;
            template.name.textContent = group.label;
            template.actionBar.clear();
            template.actionBar.context = group;
            template.count.setCount(group.resources.length);
            const menus = this.scmViewService.menus.getRepositoryMenus(group.provider);
            template.elementDisposables.add((0, util_1.connectPrimaryMenuToInlineActionBar)(menus.getResourceGroupMenu(group), template.actionBar));
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(group, index, template) {
            template.elementDisposables.clear();
        }
        disposeTemplate(template) {
            template.elementDisposables.dispose();
            template.disposables.dispose();
        }
    };
    ResourceGroupRenderer = ResourceGroupRenderer_1 = __decorate([
        __param(1, scm_1.ISCMViewService)
    ], ResourceGroupRenderer);
    class RepositoryPaneActionRunner extends actions_2.ActionRunner {
        constructor(getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
        }
        async runAction(action, context) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const selection = this.getSelectedResources();
            const contextIsSelected = selection.some(s => s === context);
            const actualContext = contextIsSelected ? selection : [context];
            const args = (0, arrays_1.flatten)(actualContext.map(e => resourceTree_1.ResourceTree.isResourceNode(e) ? resourceTree_1.ResourceTree.collect(e) : [e]));
            await action.run(...args);
        }
    }
    let ResourceRenderer = class ResourceRenderer {
        static { ResourceRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'resource'; }
        get templateId() { return ResourceRenderer_1.TEMPLATE_ID; }
        constructor(viewMode, labels, actionViewItemProvider, actionRunner, labelService, scmViewService, themeService) {
            this.viewMode = viewMode;
            this.labels = labels;
            this.actionViewItemProvider = actionViewItemProvider;
            this.actionRunner = actionRunner;
            this.labelService = labelService;
            this.scmViewService = scmViewService;
            this.themeService = themeService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.renderedResources = new Map();
            themeService.onDidColorThemeChange(this.onDidColorThemeChange, this, this.disposables);
        }
        renderTemplate(container) {
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.resource'));
            const name = (0, dom_1.append)(element, (0, dom_1.$)('.name'));
            const fileLabel = this.labels.create(name, { supportDescriptionHighlights: true, supportHighlights: true });
            const actionsContainer = (0, dom_1.append)(fileLabel.element, (0, dom_1.$)('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider,
                actionRunner: this.actionRunner
            });
            const decorationIcon = (0, dom_1.append)(element, (0, dom_1.$)('.decoration-icon'));
            const actionBarMenuListener = new lifecycle_1.MutableDisposable();
            const disposables = (0, lifecycle_1.combinedDisposable)(actionBar, fileLabel, actionBarMenuListener);
            return { element, name, fileLabel, decorationIcon, actionBar, actionBarMenu: undefined, actionBarMenuListener, elementDisposables: new lifecycle_1.DisposableStore(), disposables };
        }
        renderElement(node, index, template) {
            const resourceOrFolder = node.element;
            const iconResource = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? resourceOrFolder.element : resourceOrFolder;
            const uri = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? resourceOrFolder.uri : resourceOrFolder.sourceUri;
            const fileKind = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const tooltip = !resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) && resourceOrFolder.decorations.tooltip || '';
            const hidePath = this.viewMode() === "tree" /* ViewMode.Tree */;
            let matches;
            let descriptionMatches;
            let strikethrough;
            if (resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder)) {
                if (resourceOrFolder.element) {
                    const menus = this.scmViewService.menus.getRepositoryMenus(resourceOrFolder.element.resourceGroup.provider);
                    this._renderActionBar(template, resourceOrFolder, menus.getResourceMenu(resourceOrFolder.element));
                    template.element.classList.toggle('faded', resourceOrFolder.element.decorations.faded);
                    strikethrough = resourceOrFolder.element.decorations.strikeThrough;
                }
                else {
                    const menus = this.scmViewService.menus.getRepositoryMenus(resourceOrFolder.context.provider);
                    this._renderActionBar(template, resourceOrFolder, menus.getResourceFolderMenu(resourceOrFolder.context));
                    matches = (0, filters_1.createMatches)(node.filterData);
                    template.element.classList.remove('faded');
                }
            }
            else {
                const menus = this.scmViewService.menus.getRepositoryMenus(resourceOrFolder.resourceGroup.provider);
                this._renderActionBar(template, resourceOrFolder, menus.getResourceMenu(resourceOrFolder));
                [matches, descriptionMatches] = processResourceFilterData(uri, node.filterData);
                template.element.classList.toggle('faded', resourceOrFolder.decorations.faded);
                strikethrough = resourceOrFolder.decorations.strikeThrough;
            }
            const renderedData = {
                tooltip, uri, fileLabelOptions: { hidePath, fileKind, matches, descriptionMatches, strikethrough }, iconResource
            };
            this.renderIcon(template, renderedData);
            this.renderedResources.set(template, renderedData);
            template.elementDisposables.add((0, lifecycle_1.toDisposable)(() => this.renderedResources.delete(template)));
            template.element.setAttribute('data-tooltip', tooltip);
        }
        disposeElement(resource, index, template) {
            template.elementDisposables.clear();
        }
        renderCompressedElements(node, index, template, height) {
            const compressed = node.element;
            const folder = compressed.elements[compressed.elements.length - 1];
            const label = compressed.elements.map(e => e.name);
            const fileKind = files_1.FileKind.FOLDER;
            const matches = (0, filters_1.createMatches)(node.filterData);
            template.fileLabel.setResource({ resource: folder.uri, name: label }, {
                fileDecorations: { colors: false, badges: true },
                fileKind,
                matches,
                separator: this.labelService.getSeparator(folder.uri.scheme)
            });
            const menus = this.scmViewService.menus.getRepositoryMenus(folder.context.provider);
            this._renderActionBar(template, folder, menus.getResourceFolderMenu(folder.context));
            template.name.classList.remove('strike-through');
            template.element.classList.remove('faded');
            template.decorationIcon.style.display = 'none';
            template.decorationIcon.style.backgroundImage = '';
            template.element.setAttribute('data-tooltip', '');
        }
        disposeCompressedElements(node, index, template, height) {
            template.elementDisposables.clear();
        }
        disposeTemplate(template) {
            template.elementDisposables.dispose();
            template.disposables.dispose();
        }
        _renderActionBar(template, resourceOrFolder, menu) {
            if (!template.actionBarMenu || template.actionBarMenu !== menu) {
                template.actionBar.clear();
                template.actionBarMenu = menu;
                template.actionBarMenuListener.value = (0, util_1.connectPrimaryMenuToInlineActionBar)(menu, template.actionBar);
            }
            template.actionBar.context = resourceOrFolder;
        }
        onDidColorThemeChange() {
            for (const [template, data] of this.renderedResources) {
                this.renderIcon(template, data);
            }
        }
        renderIcon(template, data) {
            const theme = this.themeService.getColorTheme();
            const icon = theme.type === theme_2.ColorScheme.LIGHT ? data.iconResource?.decorations.icon : data.iconResource?.decorations.iconDark;
            template.fileLabel.setFile(data.uri, {
                ...data.fileLabelOptions,
                fileDecorations: { colors: false, badges: !icon },
            });
            if (icon) {
                if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                    template.decorationIcon.className = `decoration-icon ${themables_1.ThemeIcon.asClassName(icon)}`;
                    if (icon.color) {
                        template.decorationIcon.style.color = theme.getColor(icon.color.id)?.toString() ?? '';
                    }
                    template.decorationIcon.style.display = '';
                    template.decorationIcon.style.backgroundImage = '';
                }
                else {
                    template.decorationIcon.className = 'decoration-icon';
                    template.decorationIcon.style.color = '';
                    template.decorationIcon.style.display = '';
                    template.decorationIcon.style.backgroundImage = (0, dom_1.asCSSUrl)(icon);
                }
                template.decorationIcon.title = data.tooltip;
            }
            else {
                template.decorationIcon.className = 'decoration-icon';
                template.decorationIcon.style.color = '';
                template.decorationIcon.style.display = 'none';
                template.decorationIcon.style.backgroundImage = '';
                template.decorationIcon.title = '';
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    ResourceRenderer = ResourceRenderer_1 = __decorate([
        __param(4, label_1.ILabelService),
        __param(5, scm_1.ISCMViewService),
        __param(6, themeService_1.IThemeService)
    ], ResourceRenderer);
    class HistoryItemGroupActionRunner extends actions_2.ActionRunner {
        runAction(action, context) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return super.runAction(action, context);
            }
            return action.run(context.repository.provider, context.id);
        }
    }
    let HistoryItemGroupRenderer = class HistoryItemGroupRenderer {
        static { HistoryItemGroupRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'history-item-group'; }
        get templateId() { return HistoryItemGroupRenderer_1.TEMPLATE_ID; }
        constructor(actionRunner, contextKeyService, contextMenuService, keybindingService, commandService, menuService, scmViewService, telemetryService) {
            this.actionRunner = actionRunner;
            this.contextKeyService = contextKeyService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.commandService = commandService;
            this.menuService = menuService;
            this.scmViewService = scmViewService;
            this.telemetryService = telemetryService;
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-twistie');
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.history-item-group'));
            const label = new iconLabel_1.IconLabel(element, { supportIcons: true });
            const iconContainer = (0, dom_1.prepend)(label.element, (0, dom_1.$)('.icon-container'));
            const templateDisposables = new lifecycle_1.DisposableStore();
            const toolBar = new toolbar_1.WorkbenchToolBar((0, dom_1.append)(element, (0, dom_1.$)('.actions')), { actionRunner: this.actionRunner, menuOptions: { shouldForwardArgs: true } }, this.menuService, this.contextKeyService, this.contextMenuService, this.keybindingService, this.commandService, this.telemetryService);
            templateDisposables.add(toolBar);
            const countContainer = (0, dom_1.append)(element, (0, dom_1.$)('.count'));
            const count = new countBadge_1.CountBadge(countContainer, {}, defaultStyles_1.defaultCountBadgeStyles);
            return { iconContainer, label, toolBar, count, elementDisposables: new lifecycle_1.DisposableStore(), templateDisposables };
        }
        renderElement(node, index, templateData, height) {
            const historyItemGroup = node.element;
            templateData.iconContainer.className = 'icon-container';
            if (historyItemGroup.icon && themables_1.ThemeIcon.isThemeIcon(historyItemGroup.icon)) {
                templateData.iconContainer.classList.add(...themables_1.ThemeIcon.asClassNameArray(historyItemGroup.icon));
            }
            templateData.label.setLabel(historyItemGroup.label, historyItemGroup.description, { title: historyItemGroup.ariaLabel });
            templateData.count.setCount(historyItemGroup.count ?? 0);
            const repositoryMenus = this.scmViewService.menus.getRepositoryMenus(historyItemGroup.repository.provider);
            const historyProviderMenu = repositoryMenus.historyProviderMenu;
            if (historyProviderMenu) {
                const menu = historyProviderMenu.getHistoryItemGroupMenu(historyItemGroup);
                const resetMenuId = historyItemGroup.direction === 'incoming' ? actions_1.MenuId.SCMIncomingChanges : actions_1.MenuId.SCMOutgoingChanges;
                templateData.elementDisposables.add((0, util_1.connectPrimaryMenu)(menu, (primary, secondary) => {
                    templateData.toolBar.setActions(primary, secondary, [resetMenuId]);
                }));
                templateData.toolBar.context = historyItemGroup;
            }
            else {
                templateData.toolBar.setActions([], []);
                templateData.toolBar.context = undefined;
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(node, index, templateData, height) {
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposables.dispose();
            templateData.templateDisposables.dispose();
        }
    };
    HistoryItemGroupRenderer = HistoryItemGroupRenderer_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, commands_1.ICommandService),
        __param(5, actions_1.IMenuService),
        __param(6, scm_1.ISCMViewService),
        __param(7, telemetry_1.ITelemetryService)
    ], HistoryItemGroupRenderer);
    class HistoryItemActionRunner extends actions_2.ActionRunner {
        async runAction(action, context) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const args = [];
            args.push(context.historyItemGroup.repository.provider);
            args.push({
                id: context.id,
                parentIds: context.parentIds,
                message: context.message,
                author: context.author,
                icon: context.icon,
                timestamp: context.timestamp,
                statistics: context.statistics,
            });
            await action.run(...args);
        }
    }
    let HistoryItemRenderer = class HistoryItemRenderer {
        static { HistoryItemRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'history-item'; }
        get templateId() { return HistoryItemRenderer_1.TEMPLATE_ID; }
        constructor(actionRunner, actionViewItemProvider, hoverService, scmViewService) {
            this.actionRunner = actionRunner;
            this.actionViewItemProvider = actionViewItemProvider;
            this.hoverService = hoverService;
            this.scmViewService = scmViewService;
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-twistie');
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.history-item'));
            const iconLabel = new iconLabel_1.IconLabel(element, { supportIcons: true, supportHighlights: true, supportDescriptionHighlights: true });
            const iconContainer = (0, dom_1.prepend)(iconLabel.element, (0, dom_1.$)('.icon-container'));
            const disposables = new lifecycle_1.DisposableStore();
            const actionsContainer = (0, dom_1.append)(element, (0, dom_1.$)('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, { actionRunner: this.actionRunner, actionViewItemProvider: this.actionViewItemProvider });
            disposables.add(actionBar);
            const statsContainer = (0, dom_1.append)(element, (0, dom_1.$)('.stats-container'));
            const filesLabel = (0, dom_1.append)(statsContainer, (0, dom_1.$)('.files-label'));
            const insertionsLabel = (0, dom_1.append)(statsContainer, (0, dom_1.$)('.insertions-label'));
            const deletionsLabel = (0, dom_1.append)(statsContainer, (0, dom_1.$)('.deletions-label'));
            const statsCustomHover = this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), statsContainer, '');
            disposables.add(statsCustomHover);
            return { iconContainer, label: iconLabel, actionBar, statsContainer, statsCustomHover, filesLabel, insertionsLabel, deletionsLabel, elementDisposables: new lifecycle_1.DisposableStore(), disposables };
        }
        renderElement(node, index, templateData, height) {
            const historyItem = node.element;
            templateData.iconContainer.className = 'icon-container';
            if (historyItem.icon && themables_1.ThemeIcon.isThemeIcon(historyItem.icon)) {
                templateData.iconContainer.classList.add(...themables_1.ThemeIcon.asClassNameArray(historyItem.icon));
            }
            const title = this.getTooltip(historyItem);
            const [matches, descriptionMatches] = this.processMatches(historyItem, node.filterData);
            templateData.label.setLabel(historyItem.message, historyItem.author, { matches, descriptionMatches, title });
            templateData.actionBar.clear();
            templateData.actionBar.context = historyItem;
            const menus = this.scmViewService.menus.getRepositoryMenus(historyItem.historyItemGroup.repository.provider);
            if (menus.historyProviderMenu) {
                const historyItemMenu = menus.historyProviderMenu.getHistoryItemMenu(historyItem);
                templateData.elementDisposables.add((0, util_1.connectPrimaryMenuToInlineActionBar)(historyItemMenu, templateData.actionBar));
            }
            this.renderStatistics(node, index, templateData, height);
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        getTooltip(historyItem) {
            const markdown = new htmlContent_1.MarkdownString('', { isTrusted: true, supportThemeIcons: true });
            if (historyItem.author) {
                markdown.appendMarkdown(`$(account) **${historyItem.author}**\n\n`);
            }
            if (historyItem.timestamp) {
                const dateFormatter = new Intl.DateTimeFormat(platform.language, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                markdown.appendMarkdown(`$(history) ${dateFormatter.format(historyItem.timestamp)}\n\n`);
            }
            markdown.appendMarkdown(historyItem.message);
            return { markdown, markdownNotSupportedFallback: historyItem.message };
        }
        processMatches(historyItem, filterData) {
            if (!filterData) {
                return [undefined, undefined];
            }
            return [
                historyItem.message === filterData.label ? (0, filters_1.createMatches)(filterData.score) : undefined,
                historyItem.author === filterData.label ? (0, filters_1.createMatches)(filterData.score) : undefined
            ];
        }
        renderStatistics(node, index, templateData, height) {
            const historyItem = node.element;
            if (historyItem.statistics) {
                const statsAriaLabel = [
                    historyItem.statistics.files === 1 ?
                        (0, nls_1.localize)('fileChanged', "{0} file changed", historyItem.statistics.files) :
                        (0, nls_1.localize)('filesChanged', "{0} files changed", historyItem.statistics.files),
                    historyItem.statistics.insertions === 1 ? (0, nls_1.localize)('insertion', "{0} insertion{1}", historyItem.statistics.insertions, '(+)') :
                        historyItem.statistics.insertions > 1 ? (0, nls_1.localize)('insertions', "{0} insertions{1}", historyItem.statistics.insertions, '(+)') : '',
                    historyItem.statistics.deletions === 1 ? (0, nls_1.localize)('deletion', "{0} deletion{1}", historyItem.statistics.deletions, '(-)') :
                        historyItem.statistics.deletions > 1 ? (0, nls_1.localize)('deletions', "{0} deletions{1}", historyItem.statistics.deletions, '(-)') : ''
                ];
                const statsTitle = statsAriaLabel.filter(l => l !== '').join(', ');
                templateData.statsContainer.setAttribute('aria-label', statsTitle);
                templateData.statsCustomHover.update(statsTitle);
                templateData.filesLabel.textContent = historyItem.statistics.files.toString();
                templateData.insertionsLabel.textContent = historyItem.statistics.insertions > 0 ? `+${historyItem.statistics.insertions}` : '';
                templateData.insertionsLabel.classList.toggle('hidden', historyItem.statistics.insertions === 0);
                templateData.deletionsLabel.textContent = historyItem.statistics.deletions > 0 ? `-${historyItem.statistics.deletions}` : '';
                templateData.deletionsLabel.classList.toggle('hidden', historyItem.statistics.deletions === 0);
            }
            templateData.statsContainer.classList.toggle('hidden', historyItem.statistics === undefined);
        }
        disposeElement(element, index, templateData, height) {
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    HistoryItemRenderer = HistoryItemRenderer_1 = __decorate([
        __param(2, hover_1.IHoverService),
        __param(3, scm_1.ISCMViewService)
    ], HistoryItemRenderer);
    let HistoryItemChangeRenderer = class HistoryItemChangeRenderer {
        static { HistoryItemChangeRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'historyItemChange'; }
        get templateId() { return HistoryItemChangeRenderer_1.TEMPLATE_ID; }
        constructor(viewMode, labels, labelService) {
            this.viewMode = viewMode;
            this.labels = labels;
            this.labelService = labelService;
        }
        renderTemplate(container) {
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.change'));
            const name = (0, dom_1.append)(element, (0, dom_1.$)('.name'));
            const fileLabel = this.labels.create(name, { supportDescriptionHighlights: true, supportHighlights: true });
            const decorationIcon = (0, dom_1.append)(element, (0, dom_1.$)('.decoration-icon'));
            return { element, name, fileLabel, decorationIcon, disposables: new lifecycle_1.DisposableStore() };
        }
        renderElement(node, index, templateData, height) {
            const historyItemChangeOrFolder = node.element;
            const uri = resourceTree_1.ResourceTree.isResourceNode(historyItemChangeOrFolder) ? historyItemChangeOrFolder.element?.uri ?? historyItemChangeOrFolder.uri : historyItemChangeOrFolder.uri;
            const fileKind = resourceTree_1.ResourceTree.isResourceNode(historyItemChangeOrFolder) ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const hidePath = this.viewMode() === "tree" /* ViewMode.Tree */;
            let matches;
            let descriptionMatches;
            if (resourceTree_1.ResourceTree.isResourceNode(historyItemChangeOrFolder)) {
                if (!historyItemChangeOrFolder.element) {
                    matches = (0, filters_1.createMatches)(node.filterData);
                }
            }
            else {
                [matches, descriptionMatches] = processResourceFilterData(uri, node.filterData);
            }
            templateData.fileLabel.setFile(uri, { fileDecorations: { colors: false, badges: true }, fileKind, hidePath, matches, descriptionMatches });
        }
        renderCompressedElements(node, index, templateData, height) {
            const compressed = node.element;
            const folder = compressed.elements[compressed.elements.length - 1];
            const label = compressed.elements.map(e => e.name);
            const matches = (0, filters_1.createMatches)(node.filterData);
            templateData.fileLabel.setResource({ resource: folder.uri, name: label }, {
                fileDecorations: { colors: false, badges: true },
                fileKind: files_1.FileKind.FOLDER,
                matches,
                separator: this.labelService.getSeparator(folder.uri.scheme)
            });
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    HistoryItemChangeRenderer = HistoryItemChangeRenderer_1 = __decorate([
        __param(2, label_1.ILabelService)
    ], HistoryItemChangeRenderer);
    let SeparatorRenderer = class SeparatorRenderer {
        static { SeparatorRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'separator'; }
        get templateId() { return SeparatorRenderer_1.TEMPLATE_ID; }
        constructor(contextKeyService, contextMenuService, keybindingService, commandService, menuService, telemetryService) {
            this.contextKeyService = contextKeyService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.commandService = commandService;
            this.menuService = menuService;
            this.telemetryService = telemetryService;
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-no-twistie');
            // Use default cursor & disable hover for list item
            container.parentElement.parentElement.classList.add('cursor-default', 'force-no-hover');
            const disposables = new lifecycle_1.DisposableStore();
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.separator-container'));
            const label = new iconLabel_1.IconLabel(element, { supportIcons: true, });
            (0, dom_1.append)(element, (0, dom_1.$)('.separator'));
            disposables.add(label);
            const toolBar = new toolbar_1.MenuWorkbenchToolBar((0, dom_1.append)(element, (0, dom_1.$)('.actions')), actions_1.MenuId.SCMChangesSeparator, { moreIcon: codicons_1.Codicon.gear }, this.menuService, this.contextKeyService, this.contextMenuService, this.keybindingService, this.commandService, this.telemetryService);
            disposables.add(toolBar);
            return { label, disposables };
        }
        renderElement(element, index, templateData, height) {
            templateData.label.setLabel(element.element.label, undefined, { title: element.element.ariaLabel });
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    SeparatorRenderer = SeparatorRenderer_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, commands_1.ICommandService),
        __param(4, actions_1.IMenuService),
        __param(5, telemetry_1.ITelemetryService)
    ], SeparatorRenderer);
    class ListDelegate {
        constructor(inputRenderer) {
            this.inputRenderer = inputRenderer;
        }
        getHeight(element) {
            if ((0, util_1.isSCMInput)(element)) {
                return this.inputRenderer.getHeight(element);
            }
            else if ((0, util_1.isSCMActionButton)(element)) {
                return ActionButtonRenderer.DEFAULT_HEIGHT + 10;
            }
            else {
                return 22;
            }
        }
        getTemplateId(element) {
            if ((0, util_1.isSCMRepository)(element)) {
                return scmRepositoryRenderer_1.RepositoryRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMInput)(element)) {
                return InputRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMActionButton)(element)) {
                return ActionButtonRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMResourceGroup)(element)) {
                return ResourceGroupRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMResource)(element) || (0, util_1.isSCMResourceNode)(element)) {
                return ResourceRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
                return HistoryItemGroupRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
                return HistoryItemRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(element) || (0, util_1.isSCMHistoryItemChangeNode)(element)) {
                return HistoryItemChangeRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMViewSeparator)(element)) {
                return SeparatorRenderer.TEMPLATE_ID;
            }
            else {
                throw new Error('Unknown element');
            }
        }
    }
    class SCMTreeCompressionDelegate {
        isIncompressible(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return element.childrenCount === 0 || !element.parent || !element.parent.parent;
            }
            return true;
        }
    }
    class SCMTreeFilter {
        filter(element) {
            if ((0, util_1.isSCMResourceGroup)(element)) {
                return element.resources.length > 0 || !element.hideWhenEmpty;
            }
            else {
                return true;
            }
        }
    }
    class SCMTreeSorter {
        constructor(viewMode, viewSortKey) {
            this.viewMode = viewMode;
            this.viewSortKey = viewSortKey;
        }
        compare(one, other) {
            if ((0, util_1.isSCMRepository)(one)) {
                if (!(0, util_1.isSCMRepository)(other)) {
                    throw new Error('Invalid comparison');
                }
                return 0;
            }
            if ((0, util_1.isSCMInput)(one)) {
                return -1;
            }
            else if ((0, util_1.isSCMInput)(other)) {
                return 1;
            }
            if ((0, util_1.isSCMActionButton)(one)) {
                return -1;
            }
            else if ((0, util_1.isSCMActionButton)(other)) {
                return 1;
            }
            if ((0, util_1.isSCMResourceGroup)(one)) {
                return (0, util_1.isSCMResourceGroup)(other) ? 0 : -1;
            }
            if ((0, util_1.isSCMViewSeparator)(one)) {
                return (0, util_1.isSCMResourceGroup)(other) ? 1 : -1;
            }
            if ((0, util_1.isSCMHistoryItemGroupTreeElement)(one)) {
                return (0, util_1.isSCMHistoryItemGroupTreeElement)(other) ? 0 : 1;
            }
            if ((0, util_1.isSCMHistoryItemTreeElement)(one)) {
                if (!(0, util_1.isSCMHistoryItemTreeElement)(other)) {
                    throw new Error('Invalid comparison');
                }
                return 0;
            }
            if ((0, util_1.isSCMHistoryItemChangeTreeElement)(one) || (0, util_1.isSCMHistoryItemChangeNode)(one)) {
                // List
                if (this.viewMode() === "list" /* ViewMode.List */) {
                    if (!(0, util_1.isSCMHistoryItemChangeTreeElement)(other)) {
                        throw new Error('Invalid comparison');
                    }
                    return (0, comparers_1.comparePaths)(one.uri.fsPath, other.uri.fsPath);
                }
                // Tree
                if (!(0, util_1.isSCMHistoryItemChangeTreeElement)(other) && !(0, util_1.isSCMHistoryItemChangeNode)(other)) {
                    throw new Error('Invalid comparison');
                }
                const oneName = (0, util_1.isSCMHistoryItemChangeNode)(one) ? one.name : (0, resources_1.basename)(one.uri);
                const otherName = (0, util_1.isSCMHistoryItemChangeNode)(other) ? other.name : (0, resources_1.basename)(other.uri);
                return (0, comparers_1.compareFileNames)(oneName, otherName);
            }
            // Resource (List)
            if (this.viewMode() === "list" /* ViewMode.List */) {
                // FileName
                if (this.viewSortKey() === "name" /* ViewSortKey.Name */) {
                    const oneName = (0, resources_1.basename)(one.sourceUri);
                    const otherName = (0, resources_1.basename)(other.sourceUri);
                    return (0, comparers_1.compareFileNames)(oneName, otherName);
                }
                // Status
                if (this.viewSortKey() === "status" /* ViewSortKey.Status */) {
                    const oneTooltip = one.decorations.tooltip ?? '';
                    const otherTooltip = other.decorations.tooltip ?? '';
                    if (oneTooltip !== otherTooltip) {
                        return (0, strings_1.compare)(oneTooltip, otherTooltip);
                    }
                }
                // Path (default)
                const onePath = one.sourceUri.fsPath;
                const otherPath = other.sourceUri.fsPath;
                return (0, comparers_1.comparePaths)(onePath, otherPath);
            }
            // Resource (Tree)
            const oneIsDirectory = resourceTree_1.ResourceTree.isResourceNode(one);
            const otherIsDirectory = resourceTree_1.ResourceTree.isResourceNode(other);
            if (oneIsDirectory !== otherIsDirectory) {
                return oneIsDirectory ? -1 : 1;
            }
            const oneName = resourceTree_1.ResourceTree.isResourceNode(one) ? one.name : (0, resources_1.basename)(one.sourceUri);
            const otherName = resourceTree_1.ResourceTree.isResourceNode(other) ? other.name : (0, resources_1.basename)(other.sourceUri);
            return (0, comparers_1.compareFileNames)(oneName, otherName);
        }
    }
    exports.SCMTreeSorter = SCMTreeSorter;
    let SCMTreeKeyboardNavigationLabelProvider = class SCMTreeKeyboardNavigationLabelProvider {
        constructor(viewMode, labelService) {
            this.viewMode = viewMode;
            this.labelService = labelService;
        }
        getKeyboardNavigationLabel(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return element.name;
            }
            else if ((0, util_1.isSCMRepository)(element) || (0, util_1.isSCMInput)(element) || (0, util_1.isSCMActionButton)(element)) {
                return undefined;
            }
            else if ((0, util_1.isSCMResourceGroup)(element)) {
                return element.label;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
                return element.label;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
                // For a history item we want to match both the message and
                // the author. A match in the message takes precedence over
                // a match in the author.
                return [element.message, element.author];
            }
            else if ((0, util_1.isSCMViewSeparator)(element)) {
                return element.label;
            }
            else {
                if (this.viewMode() === "list" /* ViewMode.List */) {
                    // In List mode match using the file name and the path.
                    // Since we want to match both on the file name and the
                    // full path we return an array of labels. A match in the
                    // file name takes precedence over a match in the path.
                    const uri = (0, util_1.isSCMResource)(element) ? element.sourceUri : element.uri;
                    return [(0, resources_1.basename)(uri), this.labelService.getUriLabel(uri, { relative: true })];
                }
                else {
                    // In Tree mode only match using the file name
                    return (0, resources_1.basename)((0, util_1.isSCMResource)(element) ? element.sourceUri : element.uri);
                }
            }
        }
        getCompressedNodeKeyboardNavigationLabel(elements) {
            const folders = elements;
            return folders.map(e => e.name).join('/');
        }
    };
    exports.SCMTreeKeyboardNavigationLabelProvider = SCMTreeKeyboardNavigationLabelProvider;
    exports.SCMTreeKeyboardNavigationLabelProvider = SCMTreeKeyboardNavigationLabelProvider = __decorate([
        __param(1, label_1.ILabelService)
    ], SCMTreeKeyboardNavigationLabelProvider);
    function getSCMResourceId(element) {
        if ((0, util_1.isSCMRepository)(element)) {
            const provider = element.provider;
            return `repo:${provider.id}`;
        }
        else if ((0, util_1.isSCMInput)(element)) {
            const provider = element.repository.provider;
            return `input:${provider.id}`;
        }
        else if ((0, util_1.isSCMActionButton)(element)) {
            const provider = element.repository.provider;
            return `actionButton:${provider.id}`;
        }
        else if ((0, util_1.isSCMResourceGroup)(element)) {
            const provider = element.provider;
            return `resourceGroup:${provider.id}/${element.id}`;
        }
        else if ((0, util_1.isSCMResource)(element)) {
            const group = element.resourceGroup;
            const provider = group.provider;
            return `resource:${provider.id}/${group.id}/${element.sourceUri.toString()}`;
        }
        else if ((0, util_1.isSCMResourceNode)(element)) {
            const group = element.context;
            return `folder:${group.provider.id}/${group.id}/$FOLDER/${element.uri.toString()}`;
        }
        else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
            const provider = element.repository.provider;
            return `historyItemGroup:${provider.id}/${element.id}`;
        }
        else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
            const historyItemGroup = element.historyItemGroup;
            const provider = historyItemGroup.repository.provider;
            return `historyItem:${provider.id}/${historyItemGroup.id}/${element.id}/${element.parentIds.join(',')}`;
        }
        else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(element)) {
            const historyItem = element.historyItem;
            const historyItemGroup = historyItem.historyItemGroup;
            const provider = historyItemGroup.repository.provider;
            return `historyItemChange:${provider.id}/${historyItemGroup.id}/${historyItem.id}/${element.uri.toString()}`;
        }
        else if ((0, util_1.isSCMHistoryItemChangeNode)(element)) {
            const historyItem = element.context;
            const historyItemGroup = historyItem.historyItemGroup;
            const provider = historyItemGroup.repository.provider;
            return `folder:${provider.id}/${historyItemGroup.id}/${historyItem.id}/$FOLDER/${element.uri.toString()}`;
        }
        else if ((0, util_1.isSCMViewSeparator)(element)) {
            const provider = element.repository.provider;
            return `separator:${provider.id}`;
        }
        else {
            throw new Error('Invalid tree element');
        }
    }
    class SCMResourceIdentityProvider {
        getId(element) {
            return getSCMResourceId(element);
        }
    }
    let SCMAccessibilityProvider = class SCMAccessibilityProvider {
        constructor(labelService) {
            this.labelService = labelService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('scm', "Source Control Management");
        }
        getAriaLabel(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return this.labelService.getUriLabel(element.uri, { relative: true, noPrefix: true }) || element.name;
            }
            else if ((0, util_1.isSCMRepository)(element)) {
                return `${element.provider.name} ${element.provider.label}`;
            }
            else if ((0, util_1.isSCMInput)(element)) {
                return (0, nls_1.localize)('input', "Source Control Input");
            }
            else if ((0, util_1.isSCMActionButton)(element)) {
                return element.button?.command.title ?? '';
            }
            else if ((0, util_1.isSCMResourceGroup)(element)) {
                return element.label;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
                return element.ariaLabel ?? `${element.label.trim()}${element.description ? `, ${element.description}` : ''}`;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
                return `${(0, iconLabels_1.stripIcons)(element.message).trim()}${element.author ? `, ${element.author}` : ''}`;
            }
            else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(element)) {
                const result = [(0, resources_1.basename)(element.uri)];
                const path = this.labelService.getUriLabel((0, resources_1.dirname)(element.uri), { relative: true, noPrefix: true });
                if (path) {
                    result.push(path);
                }
                return result.join(', ');
            }
            else if ((0, util_1.isSCMViewSeparator)(element)) {
                return element.ariaLabel ?? element.label;
            }
            else {
                const result = [];
                result.push((0, resources_1.basename)(element.sourceUri));
                if (element.decorations.tooltip) {
                    result.push(element.decorations.tooltip);
                }
                const path = this.labelService.getUriLabel((0, resources_1.dirname)(element.sourceUri), { relative: true, noPrefix: true });
                if (path) {
                    result.push(path);
                }
                return result.join(', ');
            }
        }
    };
    exports.SCMAccessibilityProvider = SCMAccessibilityProvider;
    exports.SCMAccessibilityProvider = SCMAccessibilityProvider = __decorate([
        __param(0, label_1.ILabelService)
    ], SCMAccessibilityProvider);
    var ViewMode;
    (function (ViewMode) {
        ViewMode["List"] = "list";
        ViewMode["Tree"] = "tree";
    })(ViewMode || (ViewMode = {}));
    var ViewSortKey;
    (function (ViewSortKey) {
        ViewSortKey["Path"] = "path";
        ViewSortKey["Name"] = "name";
        ViewSortKey["Status"] = "status";
    })(ViewSortKey || (ViewSortKey = {}));
    const Menus = {
        ViewSort: new actions_1.MenuId('SCMViewSort'),
        Repositories: new actions_1.MenuId('SCMRepositories'),
        ChangesSettings: new actions_1.MenuId('SCMChangesSettings'),
    };
    const ContextKeys = {
        SCMViewMode: new contextkey_1.RawContextKey('scmViewMode', "list" /* ViewMode.List */),
        SCMViewSortKey: new contextkey_1.RawContextKey('scmViewSortKey', "path" /* ViewSortKey.Path */),
        SCMViewAreAllRepositoriesCollapsed: new contextkey_1.RawContextKey('scmViewAreAllRepositoriesCollapsed', false),
        SCMViewIsAnyRepositoryCollapsible: new contextkey_1.RawContextKey('scmViewIsAnyRepositoryCollapsible', false),
        SCMProvider: new contextkey_1.RawContextKey('scmProvider', undefined),
        SCMProviderRootUri: new contextkey_1.RawContextKey('scmProviderRootUri', undefined),
        SCMProviderHasRootUri: new contextkey_1.RawContextKey('scmProviderHasRootUri', undefined),
        RepositoryCount: new contextkey_1.RawContextKey('scmRepositoryCount', 0),
        RepositoryVisibilityCount: new contextkey_1.RawContextKey('scmRepositoryVisibleCount', 0),
        RepositoryVisibility(repository) {
            return new contextkey_1.RawContextKey(`scmRepositoryVisible:${repository.provider.id}`, false);
        }
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMTitle, {
        title: (0, nls_1.localize)('sortAction', "View & Sort"),
        submenu: Menus.ViewSort,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.RepositoryCount.notEqualsTo(0)),
        group: '0_view&sort',
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMTitle, {
        title: (0, nls_1.localize)('scmChanges', "Incoming & Outgoing"),
        submenu: Menus.ChangesSettings,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.RepositoryCount.notEqualsTo(0)),
        group: '0_view&sort',
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(Menus.ViewSort, {
        title: (0, nls_1.localize)('repositories', "Repositories"),
        submenu: Menus.Repositories,
        when: contextkey_1.ContextKeyExpr.greater(ContextKeys.RepositoryCount.key, 1),
        group: '0_repositories'
    });
    class SCMChangesSettingAction extends actions_1.Action2 {
        constructor(settingKey, settingValue, desc) {
            super({
                ...desc,
                f1: false,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${settingKey}`, settingValue),
            });
            this.settingKey = settingKey;
            this.settingValue = settingValue;
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue(this.settingKey, this.settingValue);
        }
    }
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMChangesSeparator, {
        title: (0, nls_1.localize)('incomingChanges', "Show Incoming Changes"),
        submenu: actions_1.MenuId.SCMIncomingChangesSetting,
        group: '1_incoming&outgoing',
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(Menus.ChangesSettings, {
        title: (0, nls_1.localize)('incomingChanges', "Show Incoming Changes"),
        submenu: actions_1.MenuId.SCMIncomingChangesSetting,
        group: '1_incoming&outgoing',
        order: 1
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showIncomingChanges', 'always', {
                id: 'workbench.scm.action.showIncomingChanges.always',
                title: (0, nls_1.localize)('always', "Always"),
                menu: { id: actions_1.MenuId.SCMIncomingChangesSetting },
            });
        }
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showIncomingChanges', 'auto', {
                id: 'workbench.scm.action.showIncomingChanges.auto',
                title: (0, nls_1.localize)('auto', "Auto"),
                menu: {
                    id: actions_1.MenuId.SCMIncomingChangesSetting,
                }
            });
        }
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showIncomingChanges', 'never', {
                id: 'workbench.scm.action.showIncomingChanges.never',
                title: (0, nls_1.localize)('never', "Never"),
                menu: {
                    id: actions_1.MenuId.SCMIncomingChangesSetting,
                }
            });
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMChangesSeparator, {
        title: (0, nls_1.localize)('outgoingChanges', "Show Outgoing Changes"),
        submenu: actions_1.MenuId.SCMOutgoingChangesSetting,
        group: '1_incoming&outgoing',
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(Menus.ChangesSettings, {
        title: (0, nls_1.localize)('outgoingChanges', "Show Outgoing Changes"),
        submenu: actions_1.MenuId.SCMOutgoingChangesSetting,
        group: '1_incoming&outgoing',
        order: 2
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showOutgoingChanges', 'always', {
                id: 'workbench.scm.action.showOutgoingChanges.always',
                title: (0, nls_1.localize)('always', "Always"),
                menu: {
                    id: actions_1.MenuId.SCMOutgoingChangesSetting,
                }
            });
        }
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showOutgoingChanges', 'auto', {
                id: 'workbench.scm.action.showOutgoingChanges.auto',
                title: (0, nls_1.localize)('auto', "Auto"),
                menu: {
                    id: actions_1.MenuId.SCMOutgoingChangesSetting,
                }
            });
        }
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showOutgoingChanges', 'never', {
                id: 'workbench.scm.action.showOutgoingChanges.never',
                title: (0, nls_1.localize)('never', "Never"),
                menu: {
                    id: actions_1.MenuId.SCMOutgoingChangesSetting,
                }
            });
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.scm.action.scm.showChangesSummary',
                title: (0, nls_1.localize)('showChangesSummary', "Show Changes Summary"),
                f1: false,
                toggled: contextkey_1.ContextKeyExpr.equals('config.scm.showChangesSummary', true),
                menu: [
                    { id: actions_1.MenuId.SCMChangesSeparator, order: 3 },
                    { id: Menus.ChangesSettings, order: 3 },
                ]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const configValue = configurationService.getValue('scm.showChangesSummary') === true;
            configurationService.updateValue('scm.showChangesSummary', !configValue);
        }
    });
    class RepositoryVisibilityAction extends actions_1.Action2 {
        constructor(repository) {
            super({
                id: `workbench.scm.action.toggleRepositoryVisibility.${repository.provider.id}`,
                title: repository.provider.name,
                f1: false,
                precondition: contextkey_1.ContextKeyExpr.or(ContextKeys.RepositoryVisibilityCount.notEqualsTo(1), ContextKeys.RepositoryVisibility(repository).isEqualTo(false)),
                toggled: ContextKeys.RepositoryVisibility(repository).isEqualTo(true),
                menu: { id: Menus.Repositories, group: '0_repositories' }
            });
            this.repository = repository;
        }
        run(accessor) {
            const scmViewService = accessor.get(scm_1.ISCMViewService);
            scmViewService.toggleVisibility(this.repository);
        }
    }
    let RepositoryVisibilityActionController = class RepositoryVisibilityActionController {
        constructor(contextKeyService, scmViewService, scmService) {
            this.contextKeyService = contextKeyService;
            this.scmViewService = scmViewService;
            this.items = new Map();
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryCountContextKey = ContextKeys.RepositoryCount.bindTo(contextKeyService);
            this.repositoryVisibilityCountContextKey = ContextKeys.RepositoryVisibilityCount.bindTo(contextKeyService);
            scmViewService.onDidChangeVisibleRepositories(this.onDidChangeVisibleRepositories, this, this.disposables);
            scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            scmService.onDidRemoveRepository(this.onDidRemoveRepository, this, this.disposables);
            for (const repository of scmService.repositories) {
                this.onDidAddRepository(repository);
            }
        }
        onDidAddRepository(repository) {
            const action = (0, actions_1.registerAction2)(class extends RepositoryVisibilityAction {
                constructor() {
                    super(repository);
                }
            });
            const contextKey = ContextKeys.RepositoryVisibility(repository).bindTo(this.contextKeyService);
            contextKey.set(this.scmViewService.isVisible(repository));
            this.items.set(repository, {
                contextKey,
                dispose() {
                    contextKey.reset();
                    action.dispose();
                }
            });
            this.updateRepositoryContextKeys();
        }
        onDidRemoveRepository(repository) {
            this.items.get(repository)?.dispose();
            this.items.delete(repository);
            this.updateRepositoryContextKeys();
        }
        onDidChangeVisibleRepositories() {
            let count = 0;
            for (const [repository, item] of this.items) {
                const isVisible = this.scmViewService.isVisible(repository);
                item.contextKey.set(isVisible);
                if (isVisible) {
                    count++;
                }
            }
            this.repositoryCountContextKey.set(this.items.size);
            this.repositoryVisibilityCountContextKey.set(count);
        }
        updateRepositoryContextKeys() {
            this.repositoryCountContextKey.set(this.items.size);
            this.repositoryVisibilityCountContextKey.set(iterator_1.Iterable.reduce(this.items.keys(), (r, repository) => r + (this.scmViewService.isVisible(repository) ? 1 : 0), 0));
        }
        dispose() {
            this.disposables.dispose();
            (0, lifecycle_1.dispose)(this.items.values());
            this.items.clear();
        }
    };
    RepositoryVisibilityActionController = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, scm_1.ISCMViewService),
        __param(2, scm_1.ISCMService)
    ], RepositoryVisibilityActionController);
    class SetListViewModeAction extends viewPane_1.ViewAction {
        constructor(id = 'workbench.scm.action.setListViewMode', menu = {}) {
            super({
                id,
                title: (0, nls_1.localize)('setListViewMode', "View as List"),
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                icon: codicons_1.Codicon.listTree,
                toggled: ContextKeys.SCMViewMode.isEqualTo("list" /* ViewMode.List */),
                menu: { id: Menus.ViewSort, group: '1_viewmode', ...menu }
            });
        }
        async runInView(_, view) {
            view.viewMode = "list" /* ViewMode.List */;
        }
    }
    class SetListViewModeNavigationAction extends SetListViewModeAction {
        constructor() {
            super('workbench.scm.action.setListViewModeNavigation', {
                id: actions_1.MenuId.SCMTitle,
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.RepositoryCount.notEqualsTo(0), ContextKeys.SCMViewMode.isEqualTo("tree" /* ViewMode.Tree */)),
                group: 'navigation',
                order: -1000
            });
        }
    }
    class SetTreeViewModeAction extends viewPane_1.ViewAction {
        constructor(id = 'workbench.scm.action.setTreeViewMode', menu = {}) {
            super({
                id,
                title: (0, nls_1.localize)('setTreeViewMode', "View as Tree"),
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                icon: codicons_1.Codicon.listFlat,
                toggled: ContextKeys.SCMViewMode.isEqualTo("tree" /* ViewMode.Tree */),
                menu: { id: Menus.ViewSort, group: '1_viewmode', ...menu }
            });
        }
        async runInView(_, view) {
            view.viewMode = "tree" /* ViewMode.Tree */;
        }
    }
    class SetTreeViewModeNavigationAction extends SetTreeViewModeAction {
        constructor() {
            super('workbench.scm.action.setTreeViewModeNavigation', {
                id: actions_1.MenuId.SCMTitle,
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.RepositoryCount.notEqualsTo(0), ContextKeys.SCMViewMode.isEqualTo("list" /* ViewMode.List */)),
                group: 'navigation',
                order: -1000
            });
        }
    }
    (0, actions_1.registerAction2)(SetListViewModeAction);
    (0, actions_1.registerAction2)(SetTreeViewModeAction);
    (0, actions_1.registerAction2)(SetListViewModeNavigationAction);
    (0, actions_1.registerAction2)(SetTreeViewModeNavigationAction);
    class RepositorySortAction extends viewPane_1.ViewAction {
        constructor(sortKey, title) {
            super({
                id: `workbench.scm.action.repositories.setSortKey.${sortKey}`,
                title,
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                toggled: scmViewService_1.RepositoryContextKeys.RepositorySortKey.isEqualTo(sortKey),
                menu: [
                    {
                        id: Menus.Repositories,
                        group: '1_sort'
                    },
                    {
                        id: actions_1.MenuId.SCMSourceControlTitle,
                        group: '1_sort',
                    },
                ]
            });
            this.sortKey = sortKey;
        }
        runInView(accessor) {
            accessor.get(scm_1.ISCMViewService).toggleSortKey(this.sortKey);
        }
    }
    class RepositorySortByDiscoveryTimeAction extends RepositorySortAction {
        constructor() {
            super("discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */, (0, nls_1.localize)('repositorySortByDiscoveryTime', "Sort by Discovery Time"));
        }
    }
    class RepositorySortByNameAction extends RepositorySortAction {
        constructor() {
            super("name" /* ISCMRepositorySortKey.Name */, (0, nls_1.localize)('repositorySortByName', "Sort by Name"));
        }
    }
    class RepositorySortByPathAction extends RepositorySortAction {
        constructor() {
            super("path" /* ISCMRepositorySortKey.Path */, (0, nls_1.localize)('repositorySortByPath', "Sort by Path"));
        }
    }
    (0, actions_1.registerAction2)(RepositorySortByDiscoveryTimeAction);
    (0, actions_1.registerAction2)(RepositorySortByNameAction);
    (0, actions_1.registerAction2)(RepositorySortByPathAction);
    class SetSortKeyAction extends viewPane_1.ViewAction {
        constructor(sortKey, title) {
            super({
                id: `workbench.scm.action.setSortKey.${sortKey}`,
                title,
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                toggled: ContextKeys.SCMViewSortKey.isEqualTo(sortKey),
                precondition: ContextKeys.SCMViewMode.isEqualTo("list" /* ViewMode.List */),
                menu: { id: Menus.ViewSort, group: '2_sort' }
            });
            this.sortKey = sortKey;
        }
        async runInView(_, view) {
            view.viewSortKey = this.sortKey;
        }
    }
    class SetSortByNameAction extends SetSortKeyAction {
        constructor() {
            super("name" /* ViewSortKey.Name */, (0, nls_1.localize)('sortChangesByName', "Sort Changes by Name"));
        }
    }
    class SetSortByPathAction extends SetSortKeyAction {
        constructor() {
            super("path" /* ViewSortKey.Path */, (0, nls_1.localize)('sortChangesByPath', "Sort Changes by Path"));
        }
    }
    class SetSortByStatusAction extends SetSortKeyAction {
        constructor() {
            super("status" /* ViewSortKey.Status */, (0, nls_1.localize)('sortChangesByStatus', "Sort Changes by Status"));
        }
    }
    (0, actions_1.registerAction2)(SetSortByNameAction);
    (0, actions_1.registerAction2)(SetSortByPathAction);
    (0, actions_1.registerAction2)(SetSortByStatusAction);
    class CollapseAllRepositoriesAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.scm.action.collapseAllRepositories`,
                title: (0, nls_1.localize)('collapse all', "Collapse All Repositories"),
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.SCMTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.SCMViewIsAnyRepositoryCollapsible.isEqualTo(true), ContextKeys.SCMViewAreAllRepositoriesCollapsed.isEqualTo(false))
                }
            });
        }
        async runInView(_, view) {
            view.collapseAllRepositories();
        }
    }
    class ExpandAllRepositoriesAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.scm.action.expandAllRepositories`,
                title: (0, nls_1.localize)('expand all', "Expand All Repositories"),
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                icon: codicons_1.Codicon.expandAll,
                menu: {
                    id: actions_1.MenuId.SCMTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.SCMViewIsAnyRepositoryCollapsible.isEqualTo(true), ContextKeys.SCMViewAreAllRepositoriesCollapsed.isEqualTo(true))
                }
            });
        }
        async runInView(_, view) {
            view.expandAllRepositories();
        }
    }
    (0, actions_1.registerAction2)(CollapseAllRepositoriesAction);
    (0, actions_1.registerAction2)(ExpandAllRepositoriesAction);
    var SCMInputWidgetCommandId;
    (function (SCMInputWidgetCommandId) {
        SCMInputWidgetCommandId["CancelAction"] = "scm.input.cancelAction";
    })(SCMInputWidgetCommandId || (SCMInputWidgetCommandId = {}));
    var SCMInputWidgetStorageKey;
    (function (SCMInputWidgetStorageKey) {
        SCMInputWidgetStorageKey["LastActionId"] = "scm.input.lastActionId";
    })(SCMInputWidgetStorageKey || (SCMInputWidgetStorageKey = {}));
    let SCMInputWidgetActionRunner = class SCMInputWidgetActionRunner extends actions_2.ActionRunner {
        get runningActions() { return this._runningActions; }
        constructor(input, storageService) {
            super();
            this.input = input;
            this.storageService = storageService;
            this._runningActions = new Set();
        }
        async runAction(action) {
            try {
                // Cancel previous action
                if (this.runningActions.size !== 0) {
                    this._cts?.cancel();
                    if (action.id === "scm.input.cancelAction" /* SCMInputWidgetCommandId.CancelAction */) {
                        return;
                    }
                }
                // Create action context
                const context = [];
                for (const group of this.input.repository.provider.groups) {
                    context.push({
                        resourceGroupId: group.id,
                        resources: [...group.resources.map(r => r.sourceUri)]
                    });
                }
                // Run action
                this._runningActions.add(action);
                this._cts = new cancellation_1.CancellationTokenSource();
                await action.run(...[this.input.repository.provider.rootUri, context, this._cts.token]);
            }
            finally {
                this._runningActions.delete(action);
                // Save last action
                if (this._runningActions.size === 0) {
                    this.storageService.store("scm.input.lastActionId" /* SCMInputWidgetStorageKey.LastActionId */, action.id, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                }
            }
        }
    };
    SCMInputWidgetActionRunner = __decorate([
        __param(1, storage_1.IStorageService)
    ], SCMInputWidgetActionRunner);
    let SCMInputWidgetToolbar = class SCMInputWidgetToolbar extends toolbar_1.WorkbenchToolBar {
        get dropdownActions() { return this._dropdownActions; }
        get dropdownAction() { return this._dropdownAction; }
        constructor(container, options, menuService, contextKeyService, contextMenuService, commandService, keybindingService, storageService, telemetryService) {
            super(container, { resetMenu: actions_1.MenuId.SCMInputBox, ...options }, menuService, contextKeyService, contextMenuService, keybindingService, commandService, telemetryService);
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.storageService = storageService;
            this._dropdownActions = [];
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.repositoryDisposables = new lifecycle_1.DisposableStore();
            this._dropdownAction = new actions_2.Action('scmInputMoreActions', (0, nls_1.localize)('scmInputMoreActions', "More Actions..."), 'codicon-chevron-down');
            this._cancelAction = new actions_1.MenuItemAction({
                id: "scm.input.cancelAction" /* SCMInputWidgetCommandId.CancelAction */,
                title: (0, nls_1.localize)('scmInputCancelAction', "Cancel"),
                icon: codicons_1.Codicon.debugStop,
            }, undefined, undefined, undefined, undefined, contextKeyService, commandService);
        }
        setInput(input) {
            this.repositoryDisposables.clear();
            const contextKeyService = this.contextKeyService.createOverlay([
                ['scmProvider', input.repository.provider.contextValue],
                ['scmProviderRootUri', input.repository.provider.rootUri?.toString()],
                ['scmProviderHasRootUri', !!input.repository.provider.rootUri]
            ]);
            const menu = this.repositoryDisposables.add(this.menuService.createMenu(actions_1.MenuId.SCMInputBox, contextKeyService, { emitEventsForSubmenuChanges: true }));
            const isEnabled = () => {
                return input.repository.provider.groups.some(g => g.resources.length > 0);
            };
            const updateToolbar = () => {
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, actions);
                for (const action of actions) {
                    action.enabled = isEnabled();
                }
                this._dropdownAction.enabled = isEnabled();
                let primaryAction = undefined;
                if (actions.length === 1) {
                    primaryAction = actions[0];
                }
                else if (actions.length > 1) {
                    const lastActionId = this.storageService.get("scm.input.lastActionId" /* SCMInputWidgetStorageKey.LastActionId */, 0 /* StorageScope.PROFILE */, '');
                    primaryAction = actions.find(a => a.id === lastActionId) ?? actions[0];
                }
                this._dropdownActions = actions.length === 1 ? [] : actions;
                super.setActions(primaryAction ? [primaryAction] : [], []);
                this._onDidChange.fire();
            };
            this.repositoryDisposables.add(menu.onDidChange(() => updateToolbar()));
            this.repositoryDisposables.add(input.repository.provider.onDidChangeResources(() => updateToolbar()));
            this.repositoryDisposables.add(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, "scm.input.lastActionId" /* SCMInputWidgetStorageKey.LastActionId */, this.repositoryDisposables)(() => updateToolbar()));
            this.actionRunner = new SCMInputWidgetActionRunner(input, this.storageService);
            this.repositoryDisposables.add(this.actionRunner.onWillRun(e => {
                if (this.actionRunner.runningActions.size === 0) {
                    super.setActions([this._cancelAction], []);
                    this._onDidChange.fire();
                }
            }));
            this.repositoryDisposables.add(this.actionRunner.onDidRun(e => {
                if (this.actionRunner.runningActions.size === 0) {
                    updateToolbar();
                }
            }));
            updateToolbar();
        }
    };
    SCMInputWidgetToolbar = __decorate([
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, commands_1.ICommandService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, storage_1.IStorageService),
        __param(8, telemetry_1.ITelemetryService)
    ], SCMInputWidgetToolbar);
    class SCMInputWidgetEditorOptions {
        constructor(overflowWidgetsDomNode, configurationService) {
            this.overflowWidgetsDomNode = overflowWidgetsDomNode;
            this.configurationService = configurationService;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.defaultInputFontFamily = fonts_1.DEFAULT_FONT_FAMILY;
            this._disposables = new lifecycle_1.DisposableStore();
            const onDidChangeConfiguration = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => {
                return e.affectsConfiguration('editor.accessibilitySupport') ||
                    e.affectsConfiguration('editor.cursorBlinking') ||
                    e.affectsConfiguration('editor.fontFamily') ||
                    e.affectsConfiguration('editor.rulers') ||
                    e.affectsConfiguration('editor.wordWrap') ||
                    e.affectsConfiguration('scm.inputFontFamily') ||
                    e.affectsConfiguration('scm.inputFontSize');
            }, this._disposables);
            this._disposables.add(onDidChangeConfiguration(() => this._onDidChange.fire()));
        }
        getEditorConstructionOptions() {
            const fontFamily = this._getEditorFontFamily();
            const fontSize = this._getEditorFontSize();
            const lineHeight = this._getEditorLineHeight(fontSize);
            return {
                ...(0, simpleEditorOptions_1.getSimpleEditorOptions)(this.configurationService),
                ...this._getEditorLanguageConfiguration(),
                cursorWidth: 1,
                dragAndDrop: true,
                dropIntoEditor: { enabled: true },
                fontFamily: fontFamily,
                fontSize: fontSize,
                formatOnType: true,
                lineDecorationsWidth: 6,
                lineHeight: lineHeight,
                overflowWidgetsDomNode: this.overflowWidgetsDomNode,
                padding: { top: 2, bottom: 2 },
                quickSuggestions: false,
                renderWhitespace: 'none',
                scrollbar: {
                    alwaysConsumeMouseWheel: false,
                    vertical: 'hidden'
                },
                wrappingIndent: 'none',
                wrappingStrategy: 'advanced',
            };
        }
        getEditorOptions() {
            const fontFamily = this._getEditorFontFamily();
            const fontSize = this._getEditorFontSize();
            const lineHeight = this._getEditorLineHeight(fontSize);
            const accessibilitySupport = this.configurationService.getValue('editor.accessibilitySupport');
            const cursorBlinking = this.configurationService.getValue('editor.cursorBlinking');
            return { ...this._getEditorLanguageConfiguration(), accessibilitySupport, cursorBlinking, fontFamily, fontSize, lineHeight };
        }
        _getEditorFontFamily() {
            const inputFontFamily = this.configurationService.getValue('scm.inputFontFamily').trim();
            if (inputFontFamily.toLowerCase() === 'editor') {
                return this.configurationService.getValue('editor.fontFamily').trim();
            }
            if (inputFontFamily.length !== 0 && inputFontFamily.toLowerCase() !== 'default') {
                return inputFontFamily;
            }
            return this.defaultInputFontFamily;
        }
        _getEditorFontSize() {
            return this.configurationService.getValue('scm.inputFontSize');
        }
        _getEditorLanguageConfiguration() {
            // editor.rulers
            const rulersConfig = this.configurationService.inspect('editor.rulers', { overrideIdentifier: 'scminput' });
            const rulers = rulersConfig.overrideIdentifiers?.includes('scminput') ? editorOptions_1.EditorOptions.rulers.validate(rulersConfig.value) : [];
            // editor.wordWrap
            const wordWrapConfig = this.configurationService.inspect('editor.wordWrap', { overrideIdentifier: 'scminput' });
            const wordWrap = wordWrapConfig.overrideIdentifiers?.includes('scminput') ? editorOptions_1.EditorOptions.wordWrap.validate(wordWrapConfig.value) : 'on';
            return { rulers, wordWrap };
        }
        _getEditorLineHeight(fontSize) {
            return Math.round(fontSize * 1.5);
        }
        dispose() {
            this._disposables.dispose();
        }
    }
    let SCMInputWidget = class SCMInputWidget {
        static { SCMInputWidget_1 = this; }
        static { this.ValidationTimeouts = {
            [2 /* InputValidationType.Information */]: 5000,
            [1 /* InputValidationType.Warning */]: 8000,
            [0 /* InputValidationType.Error */]: 10000
        }; }
        get input() {
            return this.model?.input;
        }
        async setInput(input) {
            if (input === this.input) {
                return;
            }
            this.clearValidation();
            this.element.classList.remove('synthetic-focus');
            this.repositoryDisposables.clear();
            this.repositoryIdContextKey.set(input?.repository.id);
            if (!input) {
                this.model?.textModelRef?.dispose();
                this.inputEditor.setModel(undefined);
                this.model = undefined;
                return;
            }
            const uri = input.repository.provider.inputBoxDocumentUri;
            if (this.configurationService.getValue('editor.wordBasedSuggestions', { resource: uri }) !== 'off') {
                this.configurationService.updateValue('editor.wordBasedSuggestions', 'off', { resource: uri }, 8 /* ConfigurationTarget.MEMORY */);
            }
            const modelValue = { input, textModelRef: undefined };
            // Save model
            this.model = modelValue;
            const modelRef = await this.textModelService.createModelReference(uri);
            // Model has been changed in the meantime
            if (this.model !== modelValue) {
                modelRef.dispose();
                return;
            }
            modelValue.textModelRef = modelRef;
            const textModel = modelRef.object.textEditorModel;
            this.inputEditor.setModel(textModel);
            // Validation
            const validationDelayer = new async_1.ThrottledDelayer(200);
            const validate = async () => {
                const position = this.inputEditor.getSelection()?.getStartPosition();
                const offset = position && textModel.getOffsetAt(position);
                const value = textModel.getValue();
                this.setValidation(await input.validateInput(value, offset || 0));
            };
            const triggerValidation = () => validationDelayer.trigger(validate);
            this.repositoryDisposables.add(validationDelayer);
            this.repositoryDisposables.add(this.inputEditor.onDidChangeCursorPosition(triggerValidation));
            // Adaptive indentation rules
            const opts = this.modelService.getCreationOptions(textModel.getLanguageId(), textModel.uri, textModel.isForSimpleWidget);
            const onEnter = event_1.Event.filter(this.inputEditor.onKeyDown, e => e.keyCode === 3 /* KeyCode.Enter */, this.repositoryDisposables);
            this.repositoryDisposables.add(onEnter(() => textModel.detectIndentation(opts.insertSpaces, opts.tabSize)));
            // Keep model in sync with API
            textModel.setValue(input.value);
            this.repositoryDisposables.add(input.onDidChange(({ value, reason }) => {
                const currentValue = textModel.getValue();
                if (value === currentValue) { // circuit breaker
                    return;
                }
                textModel.pushStackElement();
                textModel.pushEditOperations(null, [editOperation_1.EditOperation.replaceMove(textModel.getFullModelRange(), value)], () => []);
                const position = reason === scm_1.SCMInputChangeReason.HistoryPrevious
                    ? textModel.getFullModelRange().getStartPosition()
                    : textModel.getFullModelRange().getEndPosition();
                this.inputEditor.setPosition(position);
                this.inputEditor.revealPositionInCenterIfOutsideViewport(position);
            }));
            this.repositoryDisposables.add(input.onDidChangeFocus(() => this.focus()));
            this.repositoryDisposables.add(input.onDidChangeValidationMessage((e) => this.setValidation(e, { focus: true, timeout: true })));
            this.repositoryDisposables.add(input.onDidChangeValidateInput((e) => triggerValidation()));
            // Keep API in sync with model, update placeholder visibility and validate
            const updatePlaceholderVisibility = () => this.placeholderTextContainer.classList.toggle('hidden', textModel.getValueLength() > 0);
            this.repositoryDisposables.add(textModel.onDidChangeContent(() => {
                input.setValue(textModel.getValue(), true);
                updatePlaceholderVisibility();
                triggerValidation();
            }));
            updatePlaceholderVisibility();
            // Update placeholder text
            const updatePlaceholderText = () => {
                const binding = this.keybindingService.lookupKeybinding('scm.acceptInput');
                const label = binding ? binding.getLabel() : (platform.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter');
                const placeholderText = (0, strings_1.format)(input.placeholder, label);
                this.inputEditor.updateOptions({ ariaLabel: placeholderText });
                this.placeholderTextContainer.textContent = placeholderText;
            };
            this.repositoryDisposables.add(input.onDidChangePlaceholder(updatePlaceholderText));
            this.repositoryDisposables.add(this.keybindingService.onDidUpdateKeybindings(updatePlaceholderText));
            updatePlaceholderText();
            // Update input template
            let commitTemplate = '';
            const updateTemplate = () => {
                if (typeof input.repository.provider.commitTemplate === 'undefined' || !input.visible) {
                    return;
                }
                const oldCommitTemplate = commitTemplate;
                commitTemplate = input.repository.provider.commitTemplate;
                const value = textModel.getValue();
                if (value && value !== oldCommitTemplate) {
                    return;
                }
                textModel.setValue(commitTemplate);
            };
            this.repositoryDisposables.add(input.repository.provider.onDidChangeCommitTemplate(updateTemplate, this));
            updateTemplate();
            // Update input enablement
            const updateEnablement = (enabled) => {
                this.inputEditor.updateOptions({ readOnly: !enabled });
            };
            this.repositoryDisposables.add(input.onDidChangeEnablement(enabled => updateEnablement(enabled)));
            updateEnablement(input.enabled);
            // Toolbar
            this.toolbar.setInput(input);
        }
        get selections() {
            return this.inputEditor.getSelections();
        }
        set selections(selections) {
            if (selections) {
                this.inputEditor.setSelections(selections);
            }
        }
        setValidation(validation, options) {
            if (this._validationTimer) {
                clearTimeout(this._validationTimer);
                this._validationTimer = 0;
            }
            this.validation = validation;
            this.renderValidation();
            if (options?.focus && !this.hasFocus()) {
                this.focus();
            }
            if (validation && options?.timeout) {
                this._validationTimer = setTimeout(() => this.setValidation(undefined), SCMInputWidget_1.ValidationTimeouts[validation.type]);
            }
        }
        constructor(container, overflowWidgetsDomNode, contextKeyService, modelService, textModelService, keybindingService, configurationService, instantiationService, scmViewService, contextViewService, openerService, contextMenuService) {
            this.modelService = modelService;
            this.textModelService = textModelService;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.scmViewService = scmViewService;
            this.contextViewService = contextViewService;
            this.openerService = openerService;
            this.contextMenuService = contextMenuService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables = new lifecycle_1.DisposableStore();
            this.validationHasFocus = false;
            // This is due to "Setup height change listener on next tick" above
            // https://github.com/microsoft/vscode/issues/108067
            this.lastLayoutWasTrash = false;
            this.shouldFocusAfterLayout = false;
            this.element = (0, dom_1.append)(container, (0, dom_1.$)('.scm-editor'));
            this.editorContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('.scm-editor-container'));
            this.placeholderTextContainer = (0, dom_1.append)(this.editorContainer, (0, dom_1.$)('.scm-editor-placeholder'));
            this.toolbarContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('.scm-editor-toolbar'));
            this.contextKeyService = contextKeyService.createScoped(this.element);
            this.repositoryIdContextKey = this.contextKeyService.createKey('scmRepository', undefined);
            this.inputEditorOptions = new SCMInputWidgetEditorOptions(overflowWidgetsDomNode, this.configurationService);
            this.disposables.add(this.inputEditorOptions.onDidChange(this.onDidChangeEditorOptions, this));
            this.disposables.add(this.inputEditorOptions);
            const editorConstructionOptions = this.inputEditorOptions.getEditorConstructionOptions();
            this.setPlaceholderFontStyles(editorConstructionOptions.fontFamily, editorConstructionOptions.fontSize, editorConstructionOptions.lineHeight);
            const codeEditorWidgetOptions = {
                isSimpleWidget: true,
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    colorDetector_1.ColorDetector.ID,
                    contextmenu_1.ContextMenuController.ID,
                    dnd_1.DragAndDropController.ID,
                    copyPasteController_1.CopyPasteController.ID,
                    dropIntoEditorController_1.DropIntoEditorController.ID,
                    links_1.LinkDetector.ID,
                    menuPreventer_1.MenuPreventer.ID,
                    messageController_1.MessageController.ID,
                    hoverController_1.HoverController.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                    snippetController2_1.SnippetController2.ID,
                    suggestController_1.SuggestController.ID,
                    inlineCompletionsController_1.InlineCompletionsController.ID,
                    codeActionController_1.CodeActionController.ID,
                    formatActions_1.FormatOnType.ID,
                    editorDictation_1.EditorDictation.ID,
                ])
            };
            const services = new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]);
            const instantiationService2 = instantiationService.createChild(services);
            this.inputEditor = instantiationService2.createInstance(codeEditorWidget_1.CodeEditorWidget, this.editorContainer, editorConstructionOptions, codeEditorWidgetOptions);
            this.disposables.add(this.inputEditor);
            this.disposables.add(this.inputEditor.onDidFocusEditorText(() => {
                if (this.input?.repository) {
                    this.scmViewService.focus(this.input.repository);
                }
                this.element.classList.add('synthetic-focus');
                this.renderValidation();
            }));
            this.disposables.add(this.inputEditor.onDidBlurEditorText(() => {
                this.element.classList.remove('synthetic-focus');
                setTimeout(() => {
                    if (!this.validation || !this.validationHasFocus) {
                        this.clearValidation();
                    }
                }, 0);
            }));
            this.disposables.add(this.inputEditor.onDidBlurEditorWidget(() => {
                copyPasteController_1.CopyPasteController.get(this.inputEditor)?.clearWidgets();
                dropIntoEditorController_1.DropIntoEditorController.get(this.inputEditor)?.clearWidgets();
            }));
            const firstLineKey = this.contextKeyService.createKey('scmInputIsInFirstPosition', false);
            const lastLineKey = this.contextKeyService.createKey('scmInputIsInLastPosition', false);
            this.disposables.add(this.inputEditor.onDidChangeCursorPosition(({ position }) => {
                const viewModel = this.inputEditor._getViewModel();
                const lastLineNumber = viewModel.getLineCount();
                const lastLineCol = viewModel.getLineLength(lastLineNumber) + 1;
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(position);
                firstLineKey.set(viewPosition.lineNumber === 1 && viewPosition.column === 1);
                lastLineKey.set(viewPosition.lineNumber === lastLineNumber && viewPosition.column === lastLineCol);
            }));
            this.disposables.add(this.inputEditor.onDidScrollChange(e => {
                this.toolbarContainer.classList.toggle('scroll-decoration', e.scrollTop > 0);
            }));
            event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.showInputActionButton'))(() => this.layout(), this, this.disposables);
            this.onDidChangeContentHeight = event_1.Event.signal(event_1.Event.filter(this.inputEditor.onDidContentSizeChange, e => e.contentHeightChanged, this.disposables));
            // Toolbar
            this.toolbar = instantiationService2.createInstance(SCMInputWidgetToolbar, this.toolbarContainer, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_1.MenuItemAction && this.toolbar.dropdownActions.length > 1) {
                        return instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, action, this.toolbar.dropdownAction, this.toolbar.dropdownActions, '', this.contextMenuService, { actionRunner: this.toolbar.actionRunner, hoverDelegate: options.hoverDelegate });
                    }
                    return (0, menuEntryActionViewItem_1.createActionViewItem)(instantiationService, action, options);
                },
                menuOptions: {
                    shouldForwardArgs: true
                }
            });
            this.disposables.add(this.toolbar.onDidChange(() => this.layout()));
            this.disposables.add(this.toolbar);
        }
        getContentHeight() {
            const lineHeight = this.inputEditor.getOption(67 /* EditorOption.lineHeight */);
            const { top, bottom } = this.inputEditor.getOption(84 /* EditorOption.padding */);
            const inputMinLinesConfig = this.configurationService.getValue('scm.inputMinLineCount');
            const inputMinLines = typeof inputMinLinesConfig === 'number' ? (0, numbers_1.clamp)(inputMinLinesConfig, 1, 50) : 1;
            const editorMinHeight = inputMinLines * lineHeight + top + bottom;
            const inputMaxLinesConfig = this.configurationService.getValue('scm.inputMaxLineCount');
            const inputMaxLines = typeof inputMaxLinesConfig === 'number' ? (0, numbers_1.clamp)(inputMaxLinesConfig, 1, 50) : 10;
            const editorMaxHeight = inputMaxLines * lineHeight + top + bottom;
            return (0, numbers_1.clamp)(this.inputEditor.getContentHeight(), editorMinHeight, editorMaxHeight);
        }
        layout() {
            const editorHeight = this.getContentHeight();
            const toolbarWidth = this.getToolbarWidth();
            const dimension = new dom_1.Dimension(this.element.clientWidth - toolbarWidth, editorHeight);
            if (dimension.width < 0) {
                this.lastLayoutWasTrash = true;
                return;
            }
            this.lastLayoutWasTrash = false;
            this.inputEditor.layout(dimension);
            this.placeholderTextContainer.style.width = `${dimension.width}px`;
            this.renderValidation();
            const showInputActionButton = this.configurationService.getValue('scm.showInputActionButton') === true;
            this.toolbarContainer.classList.toggle('hidden', !showInputActionButton || this.toolbar?.isEmpty() === true);
            if (this.shouldFocusAfterLayout) {
                this.shouldFocusAfterLayout = false;
                this.focus();
            }
        }
        focus() {
            if (this.lastLayoutWasTrash) {
                this.lastLayoutWasTrash = false;
                this.shouldFocusAfterLayout = true;
                return;
            }
            this.inputEditor.focus();
            this.element.classList.add('synthetic-focus');
        }
        hasFocus() {
            return this.inputEditor.hasTextFocus();
        }
        onDidChangeEditorOptions() {
            const editorOptions = this.inputEditorOptions.getEditorOptions();
            this.inputEditor.updateOptions(editorOptions);
            this.setPlaceholderFontStyles(editorOptions.fontFamily, editorOptions.fontSize, editorOptions.lineHeight);
        }
        renderValidation() {
            this.clearValidation();
            this.element.classList.toggle('validation-info', this.validation?.type === 2 /* InputValidationType.Information */);
            this.element.classList.toggle('validation-warning', this.validation?.type === 1 /* InputValidationType.Warning */);
            this.element.classList.toggle('validation-error', this.validation?.type === 0 /* InputValidationType.Error */);
            if (!this.validation || !this.inputEditor.hasTextFocus()) {
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            this.validationContextView = this.contextViewService.showContextView({
                getAnchor: () => this.element,
                render: container => {
                    this.element.style.borderBottomLeftRadius = '0';
                    this.element.style.borderBottomRightRadius = '0';
                    const validationContainer = (0, dom_1.append)(container, (0, dom_1.$)('.scm-editor-validation-container'));
                    validationContainer.classList.toggle('validation-info', this.validation.type === 2 /* InputValidationType.Information */);
                    validationContainer.classList.toggle('validation-warning', this.validation.type === 1 /* InputValidationType.Warning */);
                    validationContainer.classList.toggle('validation-error', this.validation.type === 0 /* InputValidationType.Error */);
                    validationContainer.style.width = `${this.element.clientWidth + 2}px`;
                    const element = (0, dom_1.append)(validationContainer, (0, dom_1.$)('.scm-editor-validation'));
                    const message = this.validation.message;
                    if (typeof message === 'string') {
                        element.textContent = message;
                    }
                    else {
                        const tracker = (0, dom_1.trackFocus)(element);
                        disposables.add(tracker);
                        disposables.add(tracker.onDidFocus(() => (this.validationHasFocus = true)));
                        disposables.add(tracker.onDidBlur(() => {
                            this.validationHasFocus = false;
                            this.element.style.borderBottomLeftRadius = '2px';
                            this.element.style.borderBottomRightRadius = '2px';
                            this.contextViewService.hideContextView();
                        }));
                        const renderer = disposables.add(this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {}));
                        const renderedMarkdown = renderer.render(message, {
                            actionHandler: {
                                callback: (link) => {
                                    (0, markdownRenderer_1.openLinkFromMarkdown)(this.openerService, link, message.isTrusted);
                                    this.element.style.borderBottomLeftRadius = '2px';
                                    this.element.style.borderBottomRightRadius = '2px';
                                    this.contextViewService.hideContextView();
                                },
                                disposables: disposables
                            },
                        });
                        disposables.add(renderedMarkdown);
                        element.appendChild(renderedMarkdown.element);
                    }
                    const actionsContainer = (0, dom_1.append)(validationContainer, (0, dom_1.$)('.scm-editor-validation-actions'));
                    const actionbar = new actionbar_1.ActionBar(actionsContainer);
                    const action = new actions_2.Action('scmInputWidget.validationMessage.close', (0, nls_1.localize)('label.close', "Close"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close), true, () => {
                        this.contextViewService.hideContextView();
                        this.element.style.borderBottomLeftRadius = '2px';
                        this.element.style.borderBottomRightRadius = '2px';
                    });
                    disposables.add(actionbar);
                    actionbar.push(action, { icon: true, label: false });
                    return lifecycle_1.Disposable.None;
                },
                onHide: () => {
                    this.validationHasFocus = false;
                    this.element.style.borderBottomLeftRadius = '2px';
                    this.element.style.borderBottomRightRadius = '2px';
                    disposables.dispose();
                },
                anchorAlignment: 0 /* AnchorAlignment.LEFT */
            });
        }
        getToolbarWidth() {
            const showInputActionButton = this.configurationService.getValue('scm.showInputActionButton');
            if (!this.toolbar || !showInputActionButton || this.toolbar?.isEmpty() === true) {
                return 0;
            }
            return this.toolbar.dropdownActions.length === 0 ?
                26 /* 22px action + 4px margin */ :
                39 /* 35px action + 4px margin */;
        }
        setPlaceholderFontStyles(fontFamily, fontSize, lineHeight) {
            this.placeholderTextContainer.style.fontFamily = fontFamily;
            this.placeholderTextContainer.style.fontSize = `${fontSize}px`;
            this.placeholderTextContainer.style.lineHeight = `${lineHeight}px`;
        }
        clearValidation() {
            this.validationContextView?.close();
            this.validationContextView = undefined;
            this.validationHasFocus = false;
        }
        dispose() {
            this.setInput(undefined);
            this.repositoryDisposables.dispose();
            this.clearValidation();
            this.disposables.dispose();
        }
    };
    SCMInputWidget = SCMInputWidget_1 = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, model_1.IModelService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, scm_1.ISCMViewService),
        __param(9, contextView_1.IContextViewService),
        __param(10, opener_1.IOpenerService),
        __param(11, contextView_1.IContextMenuService)
    ], SCMInputWidget);
    let SCMViewPane = class SCMViewPane extends viewPane_1.ViewPane {
        get viewMode() { return this._viewMode; }
        set viewMode(mode) {
            if (this._viewMode === mode) {
                return;
            }
            this._viewMode = mode;
            // Update sort key based on view mode
            this.viewSortKey = this.getViewSortKey();
            this.updateChildren();
            this.onDidActiveEditorChange();
            this._onDidChangeViewMode.fire(mode);
            this.viewModeContextKey.set(mode);
            this.updateIndentStyles(this.themeService.getFileIconTheme());
            this.storageService.store(`scm.viewMode`, mode, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        get viewSortKey() { return this._viewSortKey; }
        set viewSortKey(sortKey) {
            if (this._viewSortKey === sortKey) {
                return;
            }
            this._viewSortKey = sortKey;
            this.updateChildren();
            this.viewSortKeyContextKey.set(sortKey);
            this._onDidChangeViewSortKey.fire(sortKey);
            if (this._viewMode === "list" /* ViewMode.List */) {
                this.storageService.store(`scm.viewSortKey`, sortKey, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            }
        }
        constructor(options, commandService, editorService, logService, menuService, scmService, scmViewService, storageService, uriIdentityService, keybindingService, themeService, contextMenuService, instantiationService, viewDescriptorService, configurationService, contextKeyService, openerService, telemetryService, hoverService) {
            super({ ...options, titleMenuId: actions_1.MenuId.SCMTitle }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService);
            this.commandService = commandService;
            this.editorService = editorService;
            this.logService = logService;
            this.menuService = menuService;
            this.scmService = scmService;
            this.scmViewService = scmViewService;
            this.storageService = storageService;
            this.uriIdentityService = uriIdentityService;
            this._onDidChangeViewMode = new event_1.Emitter();
            this.onDidChangeViewMode = this._onDidChangeViewMode.event;
            this._onDidChangeViewSortKey = new event_1.Emitter();
            this.onDidChangeViewSortKey = this._onDidChangeViewSortKey.event;
            this.items = new lifecycle_1.DisposableMap();
            this.visibilityDisposables = new lifecycle_1.DisposableStore();
            this.treeOperationSequencer = new async_1.Sequencer();
            this.revealResourceThrottler = new async_1.Throttler();
            this.updateChildrenThrottler = new async_1.Throttler();
            this.disposables = new lifecycle_1.DisposableStore();
            // View mode and sort key
            this._viewMode = this.getViewMode();
            this._viewSortKey = this.getViewSortKey();
            // Context Keys
            this.viewModeContextKey = ContextKeys.SCMViewMode.bindTo(contextKeyService);
            this.viewModeContextKey.set(this._viewMode);
            this.viewSortKeyContextKey = ContextKeys.SCMViewSortKey.bindTo(contextKeyService);
            this.viewSortKeyContextKey.set(this.viewSortKey);
            this.areAllRepositoriesCollapsedContextKey = ContextKeys.SCMViewAreAllRepositoriesCollapsed.bindTo(contextKeyService);
            this.isAnyRepositoryCollapsibleContextKey = ContextKeys.SCMViewIsAnyRepositoryCollapsible.bindTo(contextKeyService);
            this.scmProviderContextKey = ContextKeys.SCMProvider.bindTo(contextKeyService);
            this.scmProviderRootUriContextKey = ContextKeys.SCMProviderRootUri.bindTo(contextKeyService);
            this.scmProviderHasRootUriContextKey = ContextKeys.SCMProviderHasRootUri.bindTo(contextKeyService);
            this._onDidLayout = new event_1.Emitter();
            this.layoutCache = { height: undefined, width: undefined, onDidChange: this._onDidLayout.event };
            this.storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, undefined, this.disposables)(e => {
                switch (e.key) {
                    case 'scm.viewMode':
                        this.viewMode = this.getViewMode();
                        break;
                    case 'scm.viewSortKey':
                        this.viewSortKey = this.getViewSortKey();
                        break;
                }
            }, this, this.disposables);
            this.storageService.onWillSaveState(e => {
                this.viewMode = this.getViewMode();
                this.viewSortKey = this.getViewSortKey();
                this.storeTreeViewState();
            }, this, this.disposables);
            this.disposables.add(this.instantiationService.createInstance(ScmInputContentProvider));
            event_1.Event.any(this.scmService.onDidAddRepository, this.scmService.onDidRemoveRepository)(() => this._onDidChangeViewWelcomeState.fire(), this, this.disposables);
            this.disposables.add(this.revealResourceThrottler);
            this.disposables.add(this.updateChildrenThrottler);
        }
        layoutBody(height = this.layoutCache.height, width = this.layoutCache.width) {
            if (height === undefined) {
                return;
            }
            if (width !== undefined) {
                super.layoutBody(height, width);
            }
            this.layoutCache.height = height;
            this.layoutCache.width = width;
            this._onDidLayout.fire();
            this.treeContainer.style.height = `${height}px`;
            this.tree.layout(height, width);
        }
        renderBody(container) {
            super.renderBody(container);
            // Tree
            this.treeContainer = (0, dom_1.append)(container, (0, dom_1.$)('.scm-view.show-file-icons'));
            this.treeContainer.classList.add('file-icon-themable-tree');
            this.treeContainer.classList.add('show-file-icons');
            const updateActionsVisibility = () => this.treeContainer.classList.toggle('show-actions', this.configurationService.getValue('scm.alwaysShowActions'));
            event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.alwaysShowActions'), this.disposables)(updateActionsVisibility, this, this.disposables);
            updateActionsVisibility();
            const updateProviderCountVisibility = () => {
                const value = this.configurationService.getValue('scm.providerCountBadge');
                this.treeContainer.classList.toggle('hide-provider-counts', value === 'hidden');
                this.treeContainer.classList.toggle('auto-provider-counts', value === 'auto');
            };
            event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.providerCountBadge'), this.disposables)(updateProviderCountVisibility, this, this.disposables);
            updateProviderCountVisibility();
            const viewState = this.loadTreeViewState();
            this.createTree(this.treeContainer, viewState);
            this.onDidChangeBodyVisibility(async (visible) => {
                if (visible) {
                    await this.tree.setInput(this.scmViewService, viewState);
                    event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.alwaysShowRepositories'), this.visibilityDisposables)(() => {
                        this.updateActions();
                        this.updateChildren();
                    }, this, this.visibilityDisposables);
                    event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.inputMinLineCount') ||
                        e.affectsConfiguration('scm.inputMaxLineCount') ||
                        e.affectsConfiguration('scm.showActionButton') ||
                        e.affectsConfiguration('scm.showChangesSummary') ||
                        e.affectsConfiguration('scm.showIncomingChanges') ||
                        e.affectsConfiguration('scm.showOutgoingChanges'), this.visibilityDisposables)(() => this.updateChildren(), this, this.visibilityDisposables);
                    // Add visible repositories
                    this.editorService.onDidActiveEditorChange(this.onDidActiveEditorChange, this, this.visibilityDisposables);
                    this.scmViewService.onDidChangeVisibleRepositories(this.onDidChangeVisibleRepositories, this, this.visibilityDisposables);
                    this.onDidChangeVisibleRepositories({ added: this.scmViewService.visibleRepositories, removed: iterator_1.Iterable.empty() });
                    // Restore scroll position
                    if (typeof this.treeScrollTop === 'number') {
                        this.tree.scrollTop = this.treeScrollTop;
                        this.treeScrollTop = undefined;
                    }
                }
                else {
                    this.visibilityDisposables.clear();
                    this.onDidChangeVisibleRepositories({ added: iterator_1.Iterable.empty(), removed: [...this.items.keys()] });
                    this.treeScrollTop = this.tree.scrollTop;
                }
                this.updateRepositoryCollapseAllContextKeys();
            }, this, this.disposables);
            this.disposables.add(this.instantiationService.createInstance(RepositoryVisibilityActionController));
            this.themeService.onDidFileIconThemeChange(this.updateIndentStyles, this, this.disposables);
            this.updateIndentStyles(this.themeService.getFileIconTheme());
        }
        createTree(container, viewState) {
            const overflowWidgetsDomNode = (0, dom_1.$)('.scm-overflow-widgets-container.monaco-editor');
            this.inputRenderer = this.instantiationService.createInstance(InputRenderer, this.layoutCache, overflowWidgetsDomNode, (input, height) => { this.tree.updateElementHeight(input, height); });
            this.actionButtonRenderer = this.instantiationService.createInstance(ActionButtonRenderer);
            this.listLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this.disposables.add(this.listLabels);
            const resourceActionRunner = new RepositoryPaneActionRunner(() => this.getSelectedResources());
            resourceActionRunner.onWillRun(() => this.tree.domFocus(), this, this.disposables);
            this.disposables.add(resourceActionRunner);
            const historyItemGroupActionRunner = new HistoryItemGroupActionRunner();
            historyItemGroupActionRunner.onWillRun(() => this.tree.domFocus(), this, this.disposables);
            this.disposables.add(historyItemGroupActionRunner);
            const historyItemActionRunner = new HistoryItemActionRunner();
            historyItemActionRunner.onWillRun(() => this.tree.domFocus(), this, this.disposables);
            this.disposables.add(historyItemActionRunner);
            const treeDataSource = this.instantiationService.createInstance(SCMTreeDataSource, () => this.viewMode);
            this.disposables.add(treeDataSource);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleAsyncDataTree, 'SCM Tree Repo', container, new ListDelegate(this.inputRenderer), new SCMTreeCompressionDelegate(), [
                this.inputRenderer,
                this.actionButtonRenderer,
                this.instantiationService.createInstance(scmRepositoryRenderer_1.RepositoryRenderer, actions_1.MenuId.SCMTitle, (0, util_1.getActionViewItemProvider)(this.instantiationService)),
                this.instantiationService.createInstance(ResourceGroupRenderer, (0, util_1.getActionViewItemProvider)(this.instantiationService)),
                this.instantiationService.createInstance(ResourceRenderer, () => this.viewMode, this.listLabels, (0, util_1.getActionViewItemProvider)(this.instantiationService), resourceActionRunner),
                this.instantiationService.createInstance(HistoryItemGroupRenderer, historyItemGroupActionRunner),
                this.instantiationService.createInstance(HistoryItemRenderer, historyItemActionRunner, (0, util_1.getActionViewItemProvider)(this.instantiationService)),
                this.instantiationService.createInstance(HistoryItemChangeRenderer, () => this.viewMode, this.listLabels),
                this.instantiationService.createInstance(SeparatorRenderer)
            ], treeDataSource, {
                horizontalScrolling: false,
                setRowLineHeight: false,
                transformOptimization: false,
                filter: new SCMTreeFilter(),
                dnd: new SCMTreeDragAndDrop(this.instantiationService),
                identityProvider: new SCMResourceIdentityProvider(),
                sorter: new SCMTreeSorter(() => this.viewMode, () => this.viewSortKey),
                keyboardNavigationLabelProvider: this.instantiationService.createInstance(SCMTreeKeyboardNavigationLabelProvider, () => this.viewMode),
                overrideStyles: {
                    listBackground: this.viewDescriptorService.getViewLocationById(this.id) === 1 /* ViewContainerLocation.Panel */ ? theme_1.PANEL_BACKGROUND : theme_1.SIDE_BAR_BACKGROUND
                },
                collapseByDefault: (e) => {
                    // Repository, Resource Group, Resource Folder (Tree), History Item Change Folder (Tree)
                    if ((0, util_1.isSCMRepository)(e) || (0, util_1.isSCMResourceGroup)(e) || (0, util_1.isSCMResourceNode)(e) || (0, util_1.isSCMHistoryItemChangeNode)(e)) {
                        return false;
                    }
                    // History Item Group, History Item, or History Item Change
                    return (viewState?.expanded ?? []).indexOf(getSCMResourceId(e)) === -1;
                },
                accessibilityProvider: this.instantiationService.createInstance(SCMAccessibilityProvider)
            });
            this.disposables.add(this.tree);
            this.tree.onDidOpen(this.open, this, this.disposables);
            this.tree.onContextMenu(this.onListContextMenu, this, this.disposables);
            this.tree.onDidScroll(this.inputRenderer.clearValidation, this.inputRenderer, this.disposables);
            event_1.Event.filter(this.tree.onDidChangeCollapseState, e => (0, util_1.isSCMRepository)(e.node.element?.element), this.disposables)(this.updateRepositoryCollapseAllContextKeys, this, this.disposables);
            (0, dom_1.append)(container, overflowWidgetsDomNode);
        }
        async open(e) {
            if (!e.element) {
                return;
            }
            else if ((0, util_1.isSCMRepository)(e.element)) {
                this.scmViewService.focus(e.element);
                return;
            }
            else if ((0, util_1.isSCMInput)(e.element)) {
                this.scmViewService.focus(e.element.repository);
                const widgets = this.inputRenderer.getRenderedInputWidget(e.element);
                if (widgets) {
                    for (const widget of widgets) {
                        widget.focus();
                    }
                    this.tree.setFocus([], e.browserEvent);
                    const selection = this.tree.getSelection();
                    if (selection.length === 1 && selection[0] === e.element) {
                        setTimeout(() => this.tree.setSelection([]));
                    }
                }
                return;
            }
            else if ((0, util_1.isSCMActionButton)(e.element)) {
                this.scmViewService.focus(e.element.repository);
                // Focus the action button
                this.actionButtonRenderer.focusActionButton(e.element);
                this.tree.setFocus([], e.browserEvent);
                return;
            }
            else if ((0, util_1.isSCMResourceGroup)(e.element)) {
                const provider = e.element.provider;
                const repository = iterator_1.Iterable.find(this.scmService.repositories, r => r.provider === provider);
                if (repository) {
                    this.scmViewService.focus(repository);
                }
                return;
            }
            else if ((0, util_1.isSCMResource)(e.element)) {
                if (e.element.command?.id === editorCommands_1.API_OPEN_EDITOR_COMMAND_ID || e.element.command?.id === editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID) {
                    if ((0, dom_1.isPointerEvent)(e.browserEvent) && e.browserEvent.button === 1) {
                        const resourceGroup = e.element.resourceGroup;
                        const title = `${resourceGroup.provider.label}: ${resourceGroup.label}`;
                        await scmMultiDiffSourceResolver_1.OpenScmGroupAction.openMultiFileDiffEditor(this.editorService, title, resourceGroup.provider.rootUri, resourceGroup.id, {
                            ...e.editorOptions,
                            viewState: {
                                revealData: {
                                    resource: {
                                        original: e.element.multiDiffEditorOriginalUri,
                                        modified: e.element.multiDiffEditorModifiedUri,
                                    }
                                }
                            },
                            preserveFocus: true,
                        });
                    }
                    else {
                        await this.commandService.executeCommand(e.element.command.id, ...(e.element.command.arguments || []), e);
                    }
                }
                else {
                    await e.element.open(!!e.editorOptions.preserveFocus);
                    if (e.editorOptions.pinned) {
                        const activeEditorPane = this.editorService.activeEditorPane;
                        activeEditorPane?.group.pinEditor(activeEditorPane.input);
                    }
                }
                const provider = e.element.resourceGroup.provider;
                const repository = iterator_1.Iterable.find(this.scmService.repositories, r => r.provider === provider);
                if (repository) {
                    this.scmViewService.focus(repository);
                }
            }
            else if ((0, util_1.isSCMResourceNode)(e.element)) {
                const provider = e.element.context.provider;
                const repository = iterator_1.Iterable.find(this.scmService.repositories, r => r.provider === provider);
                if (repository) {
                    this.scmViewService.focus(repository);
                }
                return;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(e.element)) {
                this.scmViewService.focus(e.element.repository);
                return;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(e.element)) {
                this.scmViewService.focus(e.element.historyItemGroup.repository);
                return;
            }
            else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(e.element)) {
                if (e.element.originalUri && e.element.modifiedUri) {
                    await this.commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...(0, util_1.toDiffEditorArguments)(e.element.uri, e.element.originalUri, e.element.modifiedUri), e);
                }
                this.scmViewService.focus(e.element.historyItem.historyItemGroup.repository);
                return;
            }
            else if ((0, util_1.isSCMHistoryItemChangeNode)(e.element)) {
                this.scmViewService.focus(e.element.context.historyItemGroup.repository);
                return;
            }
        }
        onDidActiveEditorChange() {
            if (!this.configurationService.getValue('scm.autoReveal')) {
                return;
            }
            const uri = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (!uri) {
                return;
            }
            // Do not set focus/selection when the resource is already focused and selected
            if (this.tree.getFocus().some(e => (0, util_1.isSCMResource)(e) && this.uriIdentityService.extUri.isEqual(e.sourceUri, uri)) &&
                this.tree.getSelection().some(e => (0, util_1.isSCMResource)(e) && this.uriIdentityService.extUri.isEqual(e.sourceUri, uri))) {
                return;
            }
            this.revealResourceThrottler.queue(() => this.treeOperationSequencer.queue(async () => {
                for (const repository of this.scmViewService.visibleRepositories) {
                    const item = this.items.get(repository);
                    if (!item) {
                        continue;
                    }
                    // go backwards from last group
                    for (let j = repository.provider.groups.length - 1; j >= 0; j--) {
                        const groupItem = repository.provider.groups[j];
                        const resource = this.viewMode === "tree" /* ViewMode.Tree */
                            ? groupItem.resourceTree.getNode(uri)?.element
                            : groupItem.resources.find(r => this.uriIdentityService.extUri.isEqual(r.sourceUri, uri));
                        if (resource) {
                            await this.tree.expandTo(resource);
                            this.tree.setSelection([resource]);
                            this.tree.setFocus([resource]);
                            return;
                        }
                    }
                }
            }));
        }
        onDidChangeVisibleRepositories({ added, removed }) {
            // Added repositories
            for (const repository of added) {
                const repositoryDisposables = new lifecycle_1.DisposableStore();
                repositoryDisposables.add(repository.provider.onDidChange(() => this.updateChildren(repository)));
                repositoryDisposables.add(repository.input.onDidChangeVisibility(() => this.updateChildren(repository)));
                repositoryDisposables.add(repository.provider.onDidChangeResourceGroups(() => this.updateChildren(repository)));
                repositoryDisposables.add(event_1.Event.runAndSubscribe(repository.provider.onDidChangeHistoryProvider, () => {
                    if (!repository.provider.historyProvider) {
                        this.logService.debug('SCMViewPane:onDidChangeVisibleRepositories - no history provider present');
                        return;
                    }
                    repositoryDisposables.add(repository.provider.historyProvider.onDidChangeCurrentHistoryItemGroup(() => {
                        this.updateChildren(repository);
                        this.logService.debug('SCMViewPane:onDidChangeCurrentHistoryItemGroup - update children');
                    }));
                    this.logService.debug('SCMViewPane:onDidChangeVisibleRepositories - onDidChangeCurrentHistoryItemGroup listener added');
                }));
                const resourceGroupDisposables = repositoryDisposables.add(new lifecycle_1.DisposableMap());
                const onDidChangeResourceGroups = () => {
                    for (const [resourceGroup] of resourceGroupDisposables) {
                        if (!repository.provider.groups.includes(resourceGroup)) {
                            resourceGroupDisposables.deleteAndDispose(resourceGroup);
                        }
                    }
                    for (const resourceGroup of repository.provider.groups) {
                        if (!resourceGroupDisposables.has(resourceGroup)) {
                            const disposableStore = new lifecycle_1.DisposableStore();
                            disposableStore.add(resourceGroup.onDidChange(() => this.updateChildren(repository)));
                            disposableStore.add(resourceGroup.onDidChangeResources(() => this.updateChildren(repository)));
                            resourceGroupDisposables.set(resourceGroup, disposableStore);
                        }
                    }
                };
                repositoryDisposables.add(repository.provider.onDidChangeResourceGroups(onDidChangeResourceGroups));
                onDidChangeResourceGroups();
                this.items.set(repository, repositoryDisposables);
            }
            // Removed repositories
            for (const repository of removed) {
                this.items.deleteAndDispose(repository);
            }
            this.updateChildren();
            this.onDidActiveEditorChange();
        }
        onListContextMenu(e) {
            if (!e.element) {
                const menu = this.menuService.createMenu(Menus.ViewSort, this.contextKeyService);
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, actions);
                return this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => actions,
                    onHide: () => {
                        menu.dispose();
                    }
                });
            }
            const element = e.element;
            let context = element;
            let actions = [];
            let actionRunner = new RepositoryPaneActionRunner(() => this.getSelectedResources());
            if ((0, util_1.isSCMRepository)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.provider);
                const menu = menus.repositoryContextMenu;
                context = element.provider;
                actionRunner = new scmRepositoryRenderer_1.RepositoryActionRunner(() => this.getSelectedRepositories());
                actions = (0, util_1.collectContextMenuActions)(menu);
            }
            else if ((0, util_1.isSCMInput)(element) || (0, util_1.isSCMActionButton)(element)) {
                // noop
            }
            else if ((0, util_1.isSCMResourceGroup)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.provider);
                const menu = menus.getResourceGroupMenu(element);
                actions = (0, util_1.collectContextMenuActions)(menu);
            }
            else if ((0, util_1.isSCMResource)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.resourceGroup.provider);
                const menu = menus.getResourceMenu(element);
                actions = (0, util_1.collectContextMenuActions)(menu);
            }
            else if ((0, util_1.isSCMResourceNode)(element)) {
                if (element.element) {
                    const menus = this.scmViewService.menus.getRepositoryMenus(element.element.resourceGroup.provider);
                    const menu = menus.getResourceMenu(element.element);
                    actions = (0, util_1.collectContextMenuActions)(menu);
                }
                else {
                    const menus = this.scmViewService.menus.getRepositoryMenus(element.context.provider);
                    const menu = menus.getResourceFolderMenu(element.context);
                    actions = (0, util_1.collectContextMenuActions)(menu);
                }
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.repository.provider);
                const menu = menus.historyProviderMenu?.getHistoryItemGroupContextMenu(element);
                if (menu) {
                    actionRunner = new HistoryItemGroupActionRunner();
                    (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, actions);
                }
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.historyItemGroup.repository.provider);
                const menu = menus.historyProviderMenu?.getHistoryItemMenu(element);
                if (menu) {
                    actionRunner = new HistoryItemActionRunner();
                    actions = (0, util_1.collectContextMenuActions)(menu);
                }
            }
            actionRunner.onWillRun(() => this.tree.domFocus());
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => context,
                actionRunner
            });
        }
        getSelectedRepositories() {
            const focusedRepositories = this.tree.getFocus().filter(r => !!r && (0, util_1.isSCMRepository)(r));
            const selectedRepositories = this.tree.getSelection().filter(r => !!r && (0, util_1.isSCMRepository)(r));
            return Array.from(new Set([...focusedRepositories, ...selectedRepositories]));
        }
        getSelectedResources() {
            return this.tree.getSelection()
                .filter(r => !!r && !(0, util_1.isSCMResourceGroup)(r));
        }
        getViewMode() {
            let mode = this.configurationService.getValue('scm.defaultViewMode') === 'list' ? "list" /* ViewMode.List */ : "tree" /* ViewMode.Tree */;
            const storageMode = this.storageService.get(`scm.viewMode`, 1 /* StorageScope.WORKSPACE */);
            if (typeof storageMode === 'string') {
                mode = storageMode;
            }
            return mode;
        }
        getViewSortKey() {
            // Tree
            if (this._viewMode === "tree" /* ViewMode.Tree */) {
                return "path" /* ViewSortKey.Path */;
            }
            // List
            let viewSortKey;
            const viewSortKeyString = this.configurationService.getValue('scm.defaultViewSortKey');
            switch (viewSortKeyString) {
                case 'name':
                    viewSortKey = "name" /* ViewSortKey.Name */;
                    break;
                case 'status':
                    viewSortKey = "status" /* ViewSortKey.Status */;
                    break;
                default:
                    viewSortKey = "path" /* ViewSortKey.Path */;
                    break;
            }
            const storageSortKey = this.storageService.get(`scm.viewSortKey`, 1 /* StorageScope.WORKSPACE */);
            if (typeof storageSortKey === 'string') {
                viewSortKey = storageSortKey;
            }
            return viewSortKey;
        }
        loadTreeViewState() {
            const storageViewState = this.storageService.get('scm.viewState2', 1 /* StorageScope.WORKSPACE */);
            if (!storageViewState) {
                return undefined;
            }
            try {
                const treeViewState = JSON.parse(storageViewState);
                return treeViewState;
            }
            catch {
                return undefined;
            }
        }
        storeTreeViewState() {
            if (this.tree) {
                this.storageService.store('scm.viewState2', JSON.stringify(this.tree.getViewState()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
        }
        updateChildren(element) {
            this.updateChildrenThrottler.queue(() => this.treeOperationSequencer.queue(async () => {
                const focusedInput = this.inputRenderer.getFocusedInput();
                if (element && this.tree.hasNode(element)) {
                    // Refresh specific repository
                    await this.tree.updateChildren(element);
                }
                else {
                    // Refresh the entire tree
                    await this.tree.updateChildren(undefined);
                }
                if (focusedInput) {
                    this.inputRenderer.getRenderedInputWidget(focusedInput)?.forEach(widget => widget.focus());
                }
                this.updateScmProviderContextKeys();
                this.updateRepositoryCollapseAllContextKeys();
            }));
        }
        updateIndentStyles(theme) {
            this.treeContainer.classList.toggle('list-view-mode', this.viewMode === "list" /* ViewMode.List */);
            this.treeContainer.classList.toggle('tree-view-mode', this.viewMode === "tree" /* ViewMode.Tree */);
            this.treeContainer.classList.toggle('align-icons-and-twisties', (this.viewMode === "list" /* ViewMode.List */ && theme.hasFileIcons) || (theme.hasFileIcons && !theme.hasFolderIcons));
            this.treeContainer.classList.toggle('hide-arrows', this.viewMode === "tree" /* ViewMode.Tree */ && theme.hidesExplorerArrows === true);
        }
        updateScmProviderContextKeys() {
            const alwaysShowRepositories = this.configurationService.getValue('scm.alwaysShowRepositories');
            if (!alwaysShowRepositories && this.items.size === 1) {
                const provider = iterator_1.Iterable.first(this.items.keys()).provider;
                this.scmProviderContextKey.set(provider.contextValue);
                this.scmProviderRootUriContextKey.set(provider.rootUri?.toString());
                this.scmProviderHasRootUriContextKey.set(!!provider.rootUri);
            }
            else {
                this.scmProviderContextKey.set(undefined);
                this.scmProviderRootUriContextKey.set(undefined);
                this.scmProviderHasRootUriContextKey.set(false);
            }
        }
        updateRepositoryCollapseAllContextKeys() {
            if (!this.isBodyVisible() || this.items.size === 1) {
                this.isAnyRepositoryCollapsibleContextKey.set(false);
                this.areAllRepositoriesCollapsedContextKey.set(false);
                return;
            }
            this.isAnyRepositoryCollapsibleContextKey.set(this.scmViewService.visibleRepositories.some(r => this.tree.hasElement(r) && this.tree.isCollapsible(r)));
            this.areAllRepositoriesCollapsedContextKey.set(this.scmViewService.visibleRepositories.every(r => this.tree.hasElement(r) && (!this.tree.isCollapsible(r) || this.tree.isCollapsed(r))));
        }
        collapseAllRepositories() {
            for (const repository of this.scmViewService.visibleRepositories) {
                if (this.tree.isCollapsible(repository)) {
                    this.tree.collapse(repository);
                }
            }
        }
        expandAllRepositories() {
            for (const repository of this.scmViewService.visibleRepositories) {
                if (this.tree.isCollapsible(repository)) {
                    this.tree.expand(repository);
                }
            }
        }
        shouldShowWelcome() {
            return this.scmService.repositoryCount === 0;
        }
        getActionsContext() {
            return this.scmViewService.visibleRepositories.length === 1 ? this.scmViewService.visibleRepositories[0].provider : undefined;
        }
        focus() {
            super.focus();
            if (this.isExpanded()) {
                if (this.tree.getFocus().length === 0) {
                    for (const repository of this.scmViewService.visibleRepositories) {
                        const widgets = this.inputRenderer.getRenderedInputWidget(repository.input);
                        if (widgets) {
                            for (const widget of widgets) {
                                widget.focus();
                            }
                            return;
                        }
                    }
                }
                this.tree.domFocus();
            }
        }
        dispose() {
            this.visibilityDisposables.dispose();
            this.disposables.dispose();
            this.items.dispose();
            super.dispose();
        }
    };
    exports.SCMViewPane = SCMViewPane;
    exports.SCMViewPane = SCMViewPane = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, editorService_1.IEditorService),
        __param(3, log_1.ILogService),
        __param(4, actions_1.IMenuService),
        __param(5, scm_1.ISCMService),
        __param(6, scm_1.ISCMViewService),
        __param(7, storage_1.IStorageService),
        __param(8, uriIdentity_1.IUriIdentityService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, themeService_1.IThemeService),
        __param(11, contextView_1.IContextMenuService),
        __param(12, instantiation_1.IInstantiationService),
        __param(13, views_1.IViewDescriptorService),
        __param(14, configuration_1.IConfigurationService),
        __param(15, contextkey_1.IContextKeyService),
        __param(16, opener_1.IOpenerService),
        __param(17, telemetry_1.ITelemetryService),
        __param(18, hover_1.IHoverService)
    ], SCMViewPane);
    let SCMTreeDataSource = class SCMTreeDataSource {
        constructor(viewMode, configurationService, logService, scmViewService, uriIdentityService) {
            this.viewMode = viewMode;
            this.configurationService = configurationService;
            this.logService = logService;
            this.scmViewService = scmViewService;
            this.uriIdentityService = uriIdentityService;
            this.historyProviderCache = new Map();
            this.repositoryDisposables = new lifecycle_1.DisposableMap();
            this.disposables = new lifecycle_1.DisposableStore();
            const onDidChangeConfiguration = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.showChangesSummary'), this.disposables);
            this.disposables.add(onDidChangeConfiguration(() => this.historyProviderCache.clear()));
            this.scmViewService.onDidChangeVisibleRepositories(this.onDidChangeVisibleRepositories, this, this.disposables);
            this.onDidChangeVisibleRepositories({ added: this.scmViewService.visibleRepositories, removed: iterator_1.Iterable.empty() });
        }
        hasChildren(inputOrElement) {
            if ((0, util_1.isSCMViewService)(inputOrElement)) {
                return this.scmViewService.visibleRepositories.length !== 0;
            }
            else if ((0, util_1.isSCMRepository)(inputOrElement)) {
                return true;
            }
            else if ((0, util_1.isSCMInput)(inputOrElement)) {
                return false;
            }
            else if ((0, util_1.isSCMActionButton)(inputOrElement)) {
                return false;
            }
            else if ((0, util_1.isSCMResourceGroup)(inputOrElement)) {
                return true;
            }
            else if ((0, util_1.isSCMResource)(inputOrElement)) {
                return false;
            }
            else if (resourceTree_1.ResourceTree.isResourceNode(inputOrElement)) {
                return inputOrElement.childrenCount > 0;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(inputOrElement)) {
                return true;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(inputOrElement)) {
                return true;
            }
            else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(inputOrElement)) {
                return false;
            }
            else if ((0, util_1.isSCMViewSeparator)(inputOrElement)) {
                return false;
            }
            else {
                throw new Error('hasChildren not implemented.');
            }
        }
        async getChildren(inputOrElement) {
            const { alwaysShowRepositories, showActionButton } = this.getConfiguration();
            const repositoryCount = this.scmViewService.visibleRepositories.length;
            if ((0, util_1.isSCMViewService)(inputOrElement) && (repositoryCount > 1 || alwaysShowRepositories)) {
                return this.scmViewService.visibleRepositories;
            }
            else if (((0, util_1.isSCMViewService)(inputOrElement) && repositoryCount === 1 && !alwaysShowRepositories) || (0, util_1.isSCMRepository)(inputOrElement)) {
                const children = [];
                inputOrElement = (0, util_1.isSCMRepository)(inputOrElement) ? inputOrElement : this.scmViewService.visibleRepositories[0];
                const actionButton = inputOrElement.provider.actionButton;
                const resourceGroups = inputOrElement.provider.groups;
                // SCM Input
                if (inputOrElement.input.visible) {
                    children.push(inputOrElement.input);
                }
                // Action Button
                if (showActionButton && actionButton) {
                    children.push({
                        type: 'actionButton',
                        repository: inputOrElement,
                        button: actionButton
                    });
                }
                // ResourceGroups
                const hasSomeChanges = resourceGroups.some(group => group.resources.length > 0);
                if (hasSomeChanges || (repositoryCount === 1 && (!showActionButton || !actionButton))) {
                    children.push(...resourceGroups);
                }
                // History item groups
                const historyItemGroups = await this.getHistoryItemGroups(inputOrElement);
                // Incoming/Outgoing Separator
                if (historyItemGroups.length > 0) {
                    let label = (0, nls_1.localize)('syncSeparatorHeader', "Incoming/Outgoing");
                    let ariaLabel = (0, nls_1.localize)('syncSeparatorHeaderAriaLabel', "Incoming and outgoing changes");
                    const incomingHistoryItems = historyItemGroups.find(g => g.direction === 'incoming');
                    const outgoingHistoryItems = historyItemGroups.find(g => g.direction === 'outgoing');
                    if (incomingHistoryItems && !outgoingHistoryItems) {
                        label = (0, nls_1.localize)('syncIncomingSeparatorHeader', "Incoming");
                        ariaLabel = (0, nls_1.localize)('syncIncomingSeparatorHeaderAriaLabel', "Incoming changes");
                    }
                    else if (!incomingHistoryItems && outgoingHistoryItems) {
                        label = (0, nls_1.localize)('syncOutgoingSeparatorHeader', "Outgoing");
                        ariaLabel = (0, nls_1.localize)('syncOutgoingSeparatorHeaderAriaLabel', "Outgoing changes");
                    }
                    children.push({ label, ariaLabel, repository: inputOrElement, type: 'separator' });
                }
                children.push(...historyItemGroups);
                return children;
            }
            else if ((0, util_1.isSCMResourceGroup)(inputOrElement)) {
                if (this.viewMode() === "list" /* ViewMode.List */) {
                    // Resources (List)
                    return inputOrElement.resources;
                }
                else if (this.viewMode() === "tree" /* ViewMode.Tree */) {
                    // Resources (Tree)
                    const children = [];
                    for (const node of inputOrElement.resourceTree.root.children) {
                        children.push(node.element && node.childrenCount === 0 ? node.element : node);
                    }
                    return children;
                }
            }
            else if ((0, util_1.isSCMResourceNode)(inputOrElement) || (0, util_1.isSCMHistoryItemChangeNode)(inputOrElement)) {
                // Resources (Tree), History item changes (Tree)
                const children = [];
                for (const node of inputOrElement.children) {
                    children.push(node.element && node.childrenCount === 0 ? node.element : node);
                }
                return children;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(inputOrElement)) {
                // History item group
                return this.getHistoryItems(inputOrElement);
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(inputOrElement)) {
                // History item changes (List/Tree)
                return this.getHistoryItemChanges(inputOrElement);
            }
            return [];
        }
        async getHistoryItemGroups(element) {
            const { showIncomingChanges, showOutgoingChanges } = this.getConfiguration();
            const scmProvider = element.provider;
            const historyProvider = scmProvider.historyProvider;
            const currentHistoryItemGroup = historyProvider?.currentHistoryItemGroup;
            if (!historyProvider || !currentHistoryItemGroup || (showIncomingChanges === 'never' && showOutgoingChanges === 'never')) {
                return [];
            }
            const children = [];
            const historyProviderCacheEntry = this.getHistoryProviderCacheEntry(element);
            let incomingHistoryItemGroup = historyProviderCacheEntry?.incomingHistoryItemGroup;
            let outgoingHistoryItemGroup = historyProviderCacheEntry?.outgoingHistoryItemGroup;
            if (!incomingHistoryItemGroup && !outgoingHistoryItemGroup) {
                // Common ancestor, ahead, behind
                const ancestor = await historyProvider.resolveHistoryItemGroupCommonAncestor(currentHistoryItemGroup.id, currentHistoryItemGroup.base?.id);
                if (!ancestor) {
                    return [];
                }
                // Only show "Incoming" node if there is a base branch
                incomingHistoryItemGroup = currentHistoryItemGroup.base ? {
                    id: currentHistoryItemGroup.base.id,
                    label: currentHistoryItemGroup.base.name,
                    ariaLabel: (0, nls_1.localize)('incomingChangesAriaLabel', "Incoming changes from {0}", currentHistoryItemGroup.base.name),
                    icon: codicons_1.Codicon.arrowCircleDown,
                    direction: 'incoming',
                    ancestor: ancestor.id,
                    count: ancestor.behind,
                    repository: element,
                    type: 'historyItemGroup'
                } : undefined;
                outgoingHistoryItemGroup = {
                    id: currentHistoryItemGroup.id,
                    label: currentHistoryItemGroup.name,
                    ariaLabel: (0, nls_1.localize)('outgoingChangesAriaLabel', "Outgoing changes to {0}", currentHistoryItemGroup.name),
                    icon: codicons_1.Codicon.arrowCircleUp,
                    direction: 'outgoing',
                    ancestor: ancestor.id,
                    count: ancestor.ahead,
                    repository: element,
                    type: 'historyItemGroup'
                };
                this.historyProviderCache.set(element, {
                    ...historyProviderCacheEntry,
                    incomingHistoryItemGroup,
                    outgoingHistoryItemGroup
                });
            }
            // Incoming
            if (incomingHistoryItemGroup &&
                (showIncomingChanges === 'always' ||
                    (showIncomingChanges === 'auto' && (incomingHistoryItemGroup.count ?? 0) > 0))) {
                children.push(incomingHistoryItemGroup);
            }
            // Outgoing
            if (outgoingHistoryItemGroup &&
                (showOutgoingChanges === 'always' ||
                    (showOutgoingChanges === 'auto' && (outgoingHistoryItemGroup.count ?? 0) > 0))) {
                children.push(outgoingHistoryItemGroup);
            }
            return children;
        }
        async getHistoryItems(element) {
            const repository = element.repository;
            const historyProvider = repository.provider.historyProvider;
            if (!historyProvider) {
                return [];
            }
            const historyProviderCacheEntry = this.getHistoryProviderCacheEntry(repository);
            const historyItemsMap = historyProviderCacheEntry.historyItems;
            let historyItemsElement = historyProviderCacheEntry.historyItems.get(element.id);
            if (!historyItemsElement) {
                const historyItems = await historyProvider.provideHistoryItems(element.id, { limit: { id: element.ancestor } }) ?? [];
                // All Changes
                const { showChangesSummary } = this.getConfiguration();
                const allChanges = showChangesSummary && historyItems.length >= 2 ?
                    await historyProvider.provideHistoryItemSummary(historyItems[0].id, element.ancestor) : undefined;
                historyItemsElement = [allChanges, historyItems];
                this.historyProviderCache.set(repository, {
                    ...historyProviderCacheEntry,
                    historyItems: historyItemsMap.set(element.id, historyItemsElement)
                });
            }
            const children = [];
            if (historyItemsElement[0]) {
                children.push({
                    ...historyItemsElement[0],
                    icon: historyItemsElement[0].icon ?? codicons_1.Codicon.files,
                    message: (0, nls_1.localize)('allChanges', "All Changes"),
                    historyItemGroup: element,
                    type: 'allChanges'
                });
            }
            children.push(...historyItemsElement[1]
                .map(historyItem => ({
                ...historyItem,
                historyItemGroup: element,
                type: 'historyItem'
            })));
            return children;
        }
        async getHistoryItemChanges(element) {
            const repository = element.historyItemGroup.repository;
            const historyProvider = repository.provider.historyProvider;
            if (!historyProvider) {
                return [];
            }
            const historyProviderCacheEntry = this.getHistoryProviderCacheEntry(repository);
            const historyItemChangesMap = historyProviderCacheEntry.historyItemChanges;
            const historyItemParentId = element.parentIds.length > 0 ? element.parentIds[0] : undefined;
            let historyItemChanges = historyItemChangesMap.get(`${element.id}/${historyItemParentId}`);
            if (!historyItemChanges) {
                const historyItemParentId = element.parentIds.length > 0 ? element.parentIds[0] : undefined;
                historyItemChanges = await historyProvider.provideHistoryItemChanges(element.id, historyItemParentId) ?? [];
                this.historyProviderCache.set(repository, {
                    ...historyProviderCacheEntry,
                    historyItemChanges: historyItemChangesMap.set(`${element.id}/${historyItemParentId}`, historyItemChanges)
                });
            }
            if (this.viewMode() === "list" /* ViewMode.List */) {
                // List
                return historyItemChanges.map(change => ({
                    ...change,
                    historyItem: element,
                    type: 'historyItemChange'
                }));
            }
            // Tree
            const tree = new resourceTree_1.ResourceTree(element, repository.provider.rootUri ?? uri_1.URI.file('/'), this.uriIdentityService.extUri);
            for (const change of historyItemChanges) {
                tree.add(change.uri, {
                    ...change,
                    historyItem: element,
                    type: 'historyItemChange'
                });
            }
            const children = [];
            for (const node of tree.root.children) {
                children.push(node.element ?? node);
            }
            return children;
        }
        getParent(element) {
            if ((0, util_1.isSCMResourceNode)(element)) {
                if (element.parent === element.context.resourceTree.root) {
                    return element.context;
                }
                else if (element.parent) {
                    return element.parent;
                }
                else {
                    throw new Error('Invalid element passed to getParent');
                }
            }
            else if ((0, util_1.isSCMResource)(element)) {
                if (this.viewMode() === "list" /* ViewMode.List */) {
                    return element.resourceGroup;
                }
                const node = element.resourceGroup.resourceTree.getNode(element.sourceUri);
                const result = node?.parent;
                if (!result) {
                    throw new Error('Invalid element passed to getParent');
                }
                if (result === element.resourceGroup.resourceTree.root) {
                    return element.resourceGroup;
                }
                return result;
            }
            else {
                throw new Error('Unexpected call to getParent');
            }
        }
        getConfiguration() {
            return {
                alwaysShowRepositories: this.configurationService.getValue('scm.alwaysShowRepositories'),
                showActionButton: this.configurationService.getValue('scm.showActionButton'),
                showChangesSummary: this.configurationService.getValue('scm.showChangesSummary'),
                showIncomingChanges: this.configurationService.getValue('scm.showIncomingChanges'),
                showOutgoingChanges: this.configurationService.getValue('scm.showOutgoingChanges')
            };
        }
        onDidChangeVisibleRepositories({ added, removed }) {
            // Added repositories
            for (const repository of added) {
                const repositoryDisposables = new lifecycle_1.DisposableStore();
                repositoryDisposables.add(event_1.Event.runAndSubscribe(repository.provider.onDidChangeHistoryProvider, () => {
                    if (!repository.provider.historyProvider) {
                        this.logService.debug('SCMTreeDataSource:onDidChangeVisibleRepositories - no history provider present');
                        return;
                    }
                    repositoryDisposables.add(repository.provider.historyProvider.onDidChangeCurrentHistoryItemGroup(() => {
                        this.historyProviderCache.delete(repository);
                        this.logService.debug('SCMTreeDataSource:onDidChangeCurrentHistoryItemGroup - cache cleared');
                    }));
                    this.logService.debug('SCMTreeDataSource:onDidChangeVisibleRepositories - onDidChangeCurrentHistoryItemGroup listener added');
                }));
                this.repositoryDisposables.set(repository, repositoryDisposables);
            }
            // Removed repositories
            for (const repository of removed) {
                this.repositoryDisposables.deleteAndDispose(repository);
                this.historyProviderCache.delete(repository);
            }
        }
        getHistoryProviderCacheEntry(repository) {
            return this.historyProviderCache.get(repository) ?? {
                incomingHistoryItemGroup: undefined,
                outgoingHistoryItemGroup: undefined,
                historyItems: new Map(),
                historyItemChanges: new Map()
            };
        }
        dispose() {
            this.repositoryDisposables.dispose();
            this.disposables.dispose();
        }
    };
    SCMTreeDataSource = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService),
        __param(3, scm_1.ISCMViewService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], SCMTreeDataSource);
    class SCMActionButton {
        constructor(container, contextMenuService, commandService, notificationService) {
            this.container = container;
            this.contextMenuService = contextMenuService;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.disposables = new lifecycle_1.MutableDisposable();
        }
        dispose() {
            this.disposables?.dispose();
        }
        setButton(button) {
            // Clear old button
            this.clear();
            if (!button) {
                return;
            }
            if (button.secondaryCommands?.length) {
                const actions = [];
                for (let index = 0; index < button.secondaryCommands.length; index++) {
                    const commands = button.secondaryCommands[index];
                    for (const command of commands) {
                        actions.push(new actions_2.Action(command.id, command.title, undefined, true, async () => await this.executeCommand(command.id, ...(command.arguments || []))));
                    }
                    if (commands.length) {
                        actions.push(new actions_2.Separator());
                    }
                }
                // Remove last separator
                actions.pop();
                // ButtonWithDropdown
                this.button = new button_1.ButtonWithDropdown(this.container, {
                    actions: actions,
                    addPrimaryActionToDropdown: false,
                    contextMenuProvider: this.contextMenuService,
                    title: button.command.tooltip,
                    supportIcons: true,
                    ...defaultStyles_1.defaultButtonStyles
                });
            }
            else {
                // Button
                this.button = new button_1.Button(this.container, { supportIcons: true, supportShortLabel: !!button.description, title: button.command.tooltip, ...defaultStyles_1.defaultButtonStyles });
            }
            this.button.enabled = button.enabled;
            this.button.label = button.command.title;
            if (this.button instanceof button_1.Button && button.description) {
                this.button.labelShort = button.description;
            }
            this.button.onDidClick(async () => await this.executeCommand(button.command.id, ...(button.command.arguments || [])), null, this.disposables.value);
            this.disposables.value.add(this.button);
        }
        focus() {
            this.button?.focus();
        }
        clear() {
            this.disposables.value = new lifecycle_1.DisposableStore();
            this.button = undefined;
            (0, dom_1.clearNode)(this.container);
        }
        async executeCommand(commandId, ...args) {
            try {
                await this.commandService.executeCommand(commandId, ...args);
            }
            catch (ex) {
                this.notificationService.error(ex);
            }
        }
    }
    exports.SCMActionButton = SCMActionButton;
    let ScmInputContentProvider = class ScmInputContentProvider extends lifecycle_1.Disposable {
        constructor(textModelService, _modelService, _languageService) {
            super();
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._register(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeSourceControl, this));
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            return this._modelService.createModel('', this._languageService.createById('scminput'), resource);
        }
    };
    ScmInputContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService)
    ], ScmInputContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtVmlld1BhbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zY20vYnJvd3Nlci9zY21WaWV3UGFuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaUloRyxJQUFBLDZCQUFhLEVBQUMsb0NBQW9DLEVBQUU7UUFDbkQsSUFBSSxFQUFFLHVDQUF1QztRQUM3QyxLQUFLLEVBQUUsdUNBQXVDO1FBQzlDLE1BQU0sRUFBRSx1Q0FBdUM7UUFDL0MsT0FBTyxFQUFFLHVDQUF1QztLQUNoRCxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLDBDQUEwQyxDQUFDLENBQUMsQ0FBQztJQUUvRixJQUFBLDZCQUFhLEVBQUMsb0NBQW9DLEVBQUU7UUFDbkQsSUFBSSxFQUFFLHlDQUF5QztRQUMvQyxLQUFLLEVBQUUseUNBQXlDO1FBQ2hELE1BQU0sRUFBRSx5Q0FBeUM7UUFDakQsT0FBTyxFQUFFLHlDQUF5QztLQUNsRCxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLDBDQUEwQyxDQUFDLENBQUMsQ0FBQztJQUUvRixJQUFBLDZCQUFhLEVBQUMsaUNBQWlDLEVBQUU7UUFDaEQsSUFBSSxFQUFFLElBQUEsMkJBQVcsRUFBQywwQkFBVSxFQUFFLEdBQUcsQ0FBQztRQUNsQyxLQUFLLEVBQUUsSUFBQSwyQkFBVyxFQUFDLDBCQUFVLEVBQUUsR0FBRyxDQUFDO1FBQ25DLE1BQU0sRUFBRSxJQUFBLDJCQUFXLEVBQUMsMEJBQVUsRUFBRSxHQUFHLENBQUM7UUFDcEMsT0FBTyxFQUFFLElBQUEsMkJBQVcsRUFBQywwQkFBVSxFQUFFLEdBQUcsQ0FBQztLQUNyQyxFQUFFLElBQUEsY0FBUSxFQUFDLGlDQUFpQyxFQUFFLHVDQUF1QyxDQUFDLENBQUMs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