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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/glob", "vs/platform/progress/common/progress", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/layout/browser/layoutService", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/base/common/resources", "vs/base/browser/ui/inputbox/inputBox", "vs/nls", "vs/base/common/functional", "vs/base/common/objects", "vs/base/common/path", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/comparers", "vs/platform/dnd/browser/dnd", "vs/workbench/browser/dnd", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dnd", "vs/base/common/network", "vs/base/browser/ui/list/listView", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/files/browser/fileActions", "vs/base/common/filters", "vs/base/common/event", "vs/platform/label/common/label", "vs/base/common/types", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/browser/fileImportExport", "vs/base/common/errorMessage", "vs/platform/files/browser/webFileSystemAccess", "vs/workbench/services/search/common/ignoreFile", "vs/base/common/map", "vs/base/common/ternarySearchTree", "vs/platform/theme/browser/defaultStyles", "vs/base/common/async", "vs/platform/hover/browser/hover", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/browser/window", "vs/workbench/contrib/files/browser/explorerFileContrib"], function (require, exports, DOM, glob, progress_1, notification_1, files_1, layoutService_1, workspace_1, lifecycle_1, contextView_1, themeService_1, configuration_1, resources_1, inputBox_1, nls_1, functional_1, objects_1, path, explorerModel_1, comparers_1, dnd_1, dnd_2, instantiation_1, dnd_3, network_1, listView_1, platform_1, dialogs_1, workspaceEditing_1, editorService_1, fileActions_1, filters_1, event_1, label_1, types_1, uriIdentity_1, bulkEditService_1, files_2, fileImportExport_1, errorMessage_1, webFileSystemAccess_1, ignoreFile_1, map_1, ternarySearchTree_1, defaultStyles_1, async_1, hover_1, filesConfigurationService_1, window_1, explorerFileContrib_1) {
    "use strict";
    var FilesRenderer_1, FileDragAndDrop_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerCompressionDelegate = exports.FileDragAndDrop = exports.FileSorter = exports.FilesFilter = exports.FilesRenderer = exports.CompressedNavigationController = exports.ExplorerDataSource = exports.explorerRootErrorEmitter = exports.ExplorerDelegate = void 0;
    exports.isCompressedFolderName = isCompressedFolderName;
    class ExplorerDelegate {
        static { this.ITEM_HEIGHT = 22; }
        getHeight(element) {
            return ExplorerDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return FilesRenderer.ID;
        }
    }
    exports.ExplorerDelegate = ExplorerDelegate;
    exports.explorerRootErrorEmitter = new event_1.Emitter();
    let ExplorerDataSource = class ExplorerDataSource {
        constructor(fileFilter, progressService, configService, notificationService, layoutService, fileService, explorerService, contextService, filesConfigService) {
            this.fileFilter = fileFilter;
            this.progressService = progressService;
            this.configService = configService;
            this.notificationService = notificationService;
            this.layoutService = layoutService;
            this.fileService = fileService;
            this.explorerService = explorerService;
            this.contextService = contextService;
            this.filesConfigService = filesConfigService;
        }
        hasChildren(element) {
            // don't render nest parents as containing children when all the children are filtered out
            return Array.isArray(element) || element.hasChildren((stat) => this.fileFilter.filter(stat, 1 /* TreeVisibility.Visible */));
        }
        getChildren(element) {
            if (Array.isArray(element)) {
                return element;
            }
            const hasError = element.error;
            const sortOrder = this.explorerService.sortOrderConfiguration.sortOrder;
            const children = element.fetchChildren(sortOrder);
            if (Array.isArray(children)) {
                // fast path when children are known sync (i.e. nested children)
                return children;
            }
            const promise = children.then(children => {
                // Clear previous error decoration on root folder
                if (element instanceof explorerModel_1.ExplorerItem && element.isRoot && !element.error && hasError && this.contextService.getWorkbenchState() !== 2 /* WorkbenchState.FOLDER */) {
                    exports.explorerRootErrorEmitter.fire(element.resource);
                }
                return children;
            }, e => {
                if (element instanceof explorerModel_1.ExplorerItem && element.isRoot) {
                    if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                        // Single folder create a dummy explorer item to show error
                        const placeholder = new explorerModel_1.ExplorerItem(element.resource, this.fileService, this.configService, this.filesConfigService, undefined, undefined, false);
                        placeholder.error = e;
                        return [placeholder];
                    }
                    else {
                        exports.explorerRootErrorEmitter.fire(element.resource);
                    }
                }
                else {
                    // Do not show error for roots since we already use an explorer decoration to notify user
                    this.notificationService.error(e);
                }
                return []; // we could not resolve any children because of an error
            });
            this.progressService.withProgress({
                location: 1 /* ProgressLocation.Explorer */,
                delay: this.layoutService.isRestored() ? 800 : 1500 // reduce progress visibility when still restoring
            }, _progress => promise);
            return promise;
        }
    };
    exports.ExplorerDataSource = ExplorerDataSource;
    exports.ExplorerDataSource = ExplorerDataSource = __decorate([
        __param(1, progress_1.IProgressService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, files_1.IFileService),
        __param(6, files_2.IExplorerService),
        __param(7, workspace_1.IWorkspaceContextService),
        __param(8, filesConfigurationService_1.IFilesConfigurationService)
    ], ExplorerDataSource);
    class CompressedNavigationController {
        static { this.ID = 0; }
        get index() { return this._index; }
        get count() { return this.items.length; }
        get current() { return this.items[this._index]; }
        get currentId() { return `${this.id}_${this.index}`; }
        get labels() { return this._labels; }
        constructor(id, items, templateData, depth, collapsed) {
            this.id = id;
            this.items = items;
            this.depth = depth;
            this.collapsed = collapsed;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._index = items.length - 1;
            this.updateLabels(templateData);
            this._updateLabelDisposable = templateData.label.onDidRender(() => this.updateLabels(templateData));
        }
        updateLabels(templateData) {
            this._labels = Array.from(templateData.container.querySelectorAll('.label-name'));
            let parents = '';
            for (let i = 0; i < this.labels.length; i++) {
                const ariaLabel = parents.length ? `${this.items[i].name}, compact, ${parents}` : this.items[i].name;
                this.labels[i].setAttribute('aria-label', ariaLabel);
                this.labels[i].setAttribute('aria-level', `${this.depth + i}`);
                parents = parents.length ? `${this.items[i].name} ${parents}` : this.items[i].name;
            }
            this.updateCollapsed(this.collapsed);
            if (this._index < this.labels.length) {
                this.labels[this._index].classList.add('active');
            }
        }
        previous() {
            if (this._index <= 0) {
                return;
            }
            this.setIndex(this._index - 1);
        }
        next() {
            if (this._index >= this.items.length - 1) {
                return;
            }
            this.setIndex(this._index + 1);
        }
        first() {
            if (this._index === 0) {
                return;
            }
            this.setIndex(0);
        }
        last() {
            if (this._index === this.items.length - 1) {
                return;
            }
            this.setIndex(this.items.length - 1);
        }
        setIndex(index) {
            if (index < 0 || index >= this.items.length) {
                return;
            }
            this.labels[this._index].classList.remove('active');
            this._index = index;
            this.labels[this._index].classList.add('active');
            this._onDidChange.fire();
        }
        updateCollapsed(collapsed) {
            this.collapsed = collapsed;
            for (let i = 0; i < this.labels.length; i++) {
                this.labels[i].setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            }
        }
        dispose() {
            this._onDidChange.dispose();
            this._updateLabelDisposable.dispose();
        }
    }
    exports.CompressedNavigationController = CompressedNavigationController;
    let FilesRenderer = class FilesRenderer {
        static { FilesRenderer_1 = this; }
        static { this.ID = 'file'; }
        constructor(container, labels, updateWidth, contextViewService, themeService, configurationService, explorerService, labelService, contextService, contextMenuService, hoverService, instantiationService) {
            this.labels = labels;
            this.updateWidth = updateWidth;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.explorerService = explorerService;
            this.labelService = labelService;
            this.contextService = contextService;
            this.contextMenuService = contextMenuService;
            this.hoverService = hoverService;
            this.instantiationService = instantiationService;
            this.compressedNavigationControllers = new Map();
            this._onDidChangeActiveDescendant = new event_1.EventMultiplexer();
            this.onDidChangeActiveDescendant = this._onDidChangeActiveDescendant.event;
            this.hoverDelegate = new class {
                get delay() {
                    // Delay implementation borrowed froms src/vs/workbench/browser/parts/statusbar/statusbarPart.ts
                    if (Date.now() - this.lastHoverHideTime < 500) {
                        return 0; // show instantly when a hover was recently shown
                    }
                    return this.configurationService.getValue('workbench.hover.delay');
                }
                constructor(configurationService, hoverService) {
                    this.configurationService = configurationService;
                    this.hoverService = hoverService;
                    this.lastHoverHideTime = 0;
                    this.hiddenFromClick = false;
                    this.placement = 'element';
                }
                showHover(options, focus) {
                    let element;
                    if (options.target instanceof HTMLElement) {
                        element = options.target;
                    }
                    else {
                        element = options.target.targetElements[0];
                    }
                    const tlRow = element.closest('.monaco-tl-row');
                    const listRow = tlRow?.closest('.monaco-list-row');
                    const child = element.querySelector('div.monaco-icon-label-container');
                    const childOfChild = child?.querySelector('span.monaco-icon-name-container');
                    let overflowed = false;
                    if (childOfChild && child) {
                        const width = child.clientWidth;
                        const childWidth = childOfChild.offsetWidth;
                        // Check if element is overflowing its parent container
                        overflowed = width <= childWidth;
                    }
                    // Only count decorations that provide additional info, as hover overing decorations such as git excluded isn't helpful
                    const hasDecoration = options.content.toString().includes('•');
                    // If it's overflowing or has a decoration show the tooltip
                    overflowed = overflowed || hasDecoration;
                    const indentGuideElement = tlRow?.querySelector('.monaco-tl-indent');
                    if (!indentGuideElement) {
                        return;
                    }
                    return overflowed ? this.hoverService.showHover({
                        ...options,
                        target: indentGuideElement,
                        container: listRow,
                        additionalClasses: ['explorer-item-hover'],
                        position: {
                            hoverPosition: 1 /* HoverPosition.RIGHT */,
                        },
                        appearance: {
                            compact: true,
                            skipFadeInAnimation: true,
                            showPointer: false,
                        }
                    }, focus) : undefined;
                }
                onDidHideHover() {
                    if (!this.hiddenFromClick) {
                        this.lastHoverHideTime = Date.now();
                    }
                    this.hiddenFromClick = false;
                }
            }(this.configurationService, this.hoverService);
            this.config = this.configurationService.getValue();
            const updateOffsetStyles = () => {
                const indent = this.configurationService.getValue('workbench.tree.indent');
                const offset = Math.max(22 - indent, 0); // derived via inspection
                container.style.setProperty(`--vscode-explorer-align-offset-margin-left`, `${offset}px`);
            };
            this.configListener = this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('explorer')) {
                    this.config = this.configurationService.getValue();
                }
                if (e.affectsConfiguration('workbench.tree.indent')) {
                    updateOffsetStyles();
                }
            });
            updateOffsetStyles();
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('treeAriaLabel', "Files Explorer");
        }
        get templateId() {
            return FilesRenderer_1.ID;
        }
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            const experimentalHover = this.configurationService.getValue('explorer.experimental.hover');
            const label = templateDisposables.add(this.labels.create(container, { supportHighlights: true, hoverDelegate: experimentalHover ? this.hoverDelegate : undefined }));
            templateDisposables.add(label.onDidRender(() => {
                try {
                    if (templateData.currentContext) {
                        this.updateWidth(templateData.currentContext);
                    }
                }
                catch (e) {
                    // noop since the element might no longer be in the tree, no update of width necessary
                }
            }));
            const contribs = explorerFileContrib_1.explorerFileContribRegistry.create(this.instantiationService, container, templateDisposables);
            const templateData = { templateDisposables, elementDisposables: templateDisposables.add(new lifecycle_1.DisposableStore()), label, container, contribs };
            return templateData;
        }
        renderElement(node, index, templateData) {
            const stat = node.element;
            templateData.currentContext = stat;
            const editableData = this.explorerService.getEditableData(stat);
            templateData.label.element.classList.remove('compressed');
            // File Label
            if (!editableData) {
                templateData.label.element.style.display = 'flex';
                this.renderStat(stat, stat.name, undefined, node.filterData, templateData);
            }
            // Input Box
            else {
                templateData.label.element.style.display = 'none';
                templateData.contribs.forEach(c => c.setResource(undefined));
                templateData.elementDisposables.add(this.renderInputBox(templateData.container, stat, editableData));
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            const stat = node.element.elements[node.element.elements.length - 1];
            templateData.currentContext = stat;
            const editable = node.element.elements.filter(e => this.explorerService.isEditable(e));
            const editableData = editable.length === 0 ? undefined : this.explorerService.getEditableData(editable[0]);
            // File Label
            if (!editableData) {
                templateData.label.element.classList.add('compressed');
                templateData.label.element.style.display = 'flex';
                const id = `compressed-explorer_${CompressedNavigationController.ID++}`;
                const label = node.element.elements.map(e => e.name);
                this.renderStat(stat, label, id, node.filterData, templateData);
                const compressedNavigationController = new CompressedNavigationController(id, node.element.elements, templateData, node.depth, node.collapsed);
                templateData.elementDisposables.add(compressedNavigationController);
                const nodeControllers = this.compressedNavigationControllers.get(stat) ?? [];
                this.compressedNavigationControllers.set(stat, [...nodeControllers, compressedNavigationController]);
                // accessibility
                templateData.elementDisposables.add(this._onDidChangeActiveDescendant.add(compressedNavigationController.onDidChange));
                templateData.elementDisposables.add(DOM.addDisposableListener(templateData.container, 'mousedown', e => {
                    const result = getIconLabelNameFromHTMLElement(e.target);
                    if (result) {
                        compressedNavigationController.setIndex(result.index);
                    }
                }));
                templateData.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                    const nodeControllers = this.compressedNavigationControllers.get(stat) ?? [];
                    const renderedIndex = nodeControllers.findIndex(controller => controller === compressedNavigationController);
                    if (renderedIndex < 0) {
                        throw new Error('Disposing unknown navigation controller');
                    }
                    if (nodeControllers.length === 1) {
                        this.compressedNavigationControllers.delete(stat);
                    }
                    else {
                        nodeControllers.splice(renderedIndex, 1);
                    }
                }));
            }
            // Input Box
            else {
                templateData.label.element.classList.remove('compressed');
                templateData.label.element.style.display = 'none';
                templateData.contribs.forEach(c => c.setResource(undefined));
                templateData.elementDisposables.add(this.renderInputBox(templateData.container, editable[0], editableData));
            }
        }
        renderStat(stat, label, domId, filterData, templateData) {
            templateData.label.element.style.display = 'flex';
            const extraClasses = ['explorer-item'];
            if (this.explorerService.isCut(stat)) {
                extraClasses.push('cut');
            }
            // Offset nested children unless folders have both chevrons and icons, otherwise alignment breaks
            const theme = this.themeService.getFileIconTheme();
            // Hack to always render chevrons for file nests, or else may not be able to identify them.
            const twistieContainer = templateData.container.parentElement?.parentElement?.querySelector('.monaco-tl-twistie');
            twistieContainer?.classList.toggle('force-twistie', stat.hasNests && theme.hidesExplorerArrows);
            // when explorer arrows are hidden or there are no folder icons, nests get misaligned as they are forced to have arrows and files typically have icons
            // Apply some CSS magic to get things looking as reasonable as possible.
            const themeIsUnhappyWithNesting = theme.hasFileIcons && (theme.hidesExplorerArrows || !theme.hasFolderIcons);
            const realignNestedChildren = stat.nestedParent && themeIsUnhappyWithNesting;
            const experimentalHover = this.configurationService.getValue('explorer.experimental.hover');
            templateData.contribs.forEach(c => c.setResource(stat.resource));
            templateData.label.setResource({ resource: stat.resource, name: label }, {
                title: experimentalHover ? (0, types_1.isStringArray)(label) ? label[0] : label : undefined,
                fileKind: stat.isRoot ? files_1.FileKind.ROOT_FOLDER : stat.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE,
                extraClasses: realignNestedChildren ? [...extraClasses, 'align-nest-icon-with-parent-icon'] : extraClasses,
                fileDecorations: this.config.explorer.decorations,
                matches: (0, filters_1.createMatches)(filterData),
                separator: this.labelService.getSeparator(stat.resource.scheme, stat.resource.authority),
                domId
            });
        }
        renderInputBox(container, stat, editableData) {
            // Use a file label only for the icon next to the input box
            const label = this.labels.create(container);
            const extraClasses = ['explorer-item', 'explorer-item-edited'];
            const fileKind = stat.isRoot ? files_1.FileKind.ROOT_FOLDER : stat.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const theme = this.themeService.getFileIconTheme();
            const themeIsUnhappyWithNesting = theme.hasFileIcons && (theme.hidesExplorerArrows || !theme.hasFolderIcons);
            const realignNestedChildren = stat.nestedParent && themeIsUnhappyWithNesting;
            const labelOptions = {
                hidePath: true,
                hideLabel: true,
                fileKind,
                extraClasses: realignNestedChildren ? [...extraClasses, 'align-nest-icon-with-parent-icon'] : extraClasses,
            };
            const parent = stat.name ? (0, resources_1.dirname)(stat.resource) : stat.resource;
            const value = stat.name || '';
            label.setFile((0, resources_1.joinPath)(parent, value || ' '), labelOptions); // Use icon for ' ' if name is empty.
            // hack: hide label
            label.element.firstElementChild.style.display = 'none';
            // Input field for name
            const inputBox = new inputBox_1.InputBox(label.element, this.contextViewService, {
                validationOptions: {
                    validation: (value) => {
                        const message = editableData.validationMessage(value);
                        if (!message || message.severity !== notification_1.Severity.Error) {
                            return null;
                        }
                        return {
                            content: message.content,
                            formatContent: true,
                            type: 3 /* MessageType.ERROR */
                        };
                    }
                },
                ariaLabel: (0, nls_1.localize)('fileInputAriaLabel', "Type file name. Press Enter to confirm or Escape to cancel."),
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            });
            const lastDot = value.lastIndexOf('.');
            let currentSelectionState = 'prefix';
            inputBox.value = value;
            inputBox.focus();
            inputBox.select({ start: 0, end: lastDot > 0 && !stat.isDirectory ? lastDot : value.length });
            const done = (0, functional_1.createSingleCallFunction)((success, finishEditing) => {
                label.element.style.display = 'none';
                const value = inputBox.value;
                (0, lifecycle_1.dispose)(toDispose);
                label.element.remove();
                if (finishEditing) {
                    editableData.onFinish(value, success);
                }
            });
            const showInputBoxNotification = () => {
                if (inputBox.isInputValid()) {
                    const message = editableData.validationMessage(inputBox.value);
                    if (message) {
                        inputBox.showMessage({
                            content: message.content,
                            formatContent: true,
                            type: message.severity === notification_1.Severity.Info ? 1 /* MessageType.INFO */ : message.severity === notification_1.Severity.Warning ? 2 /* MessageType.WARNING */ : 3 /* MessageType.ERROR */
                        });
                    }
                    else {
                        inputBox.hideMessage();
                    }
                }
            };
            showInputBoxNotification();
            const toDispose = [
                inputBox,
                inputBox.onDidChange(value => {
                    label.setFile((0, resources_1.joinPath)(parent, value || ' '), labelOptions); // update label icon while typing!
                }),
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => {
                    if (e.equals(60 /* KeyCode.F2 */)) {
                        const dotIndex = inputBox.value.lastIndexOf('.');
                        if (stat.isDirectory || dotIndex === -1) {
                            return;
                        }
                        if (currentSelectionState === 'prefix') {
                            currentSelectionState = 'all';
                            inputBox.select({ start: 0, end: inputBox.value.length });
                        }
                        else if (currentSelectionState === 'all') {
                            currentSelectionState = 'suffix';
                            inputBox.select({ start: dotIndex + 1, end: inputBox.value.length });
                        }
                        else {
                            currentSelectionState = 'prefix';
                            inputBox.select({ start: 0, end: dotIndex });
                        }
                    }
                    else if (e.equals(3 /* KeyCode.Enter */)) {
                        if (!inputBox.validate()) {
                            done(true, true);
                        }
                    }
                    else if (e.equals(9 /* KeyCode.Escape */)) {
                        done(false, true);
                    }
                }),
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_UP, (e) => {
                    showInputBoxNotification();
                }),
                DOM.addDisposableListener(inputBox.inputElement, DOM.EventType.BLUR, async () => {
                    while (true) {
                        await (0, async_1.timeout)(0);
                        const ownerDocument = inputBox.inputElement.ownerDocument;
                        if (!ownerDocument.hasFocus()) {
                            break;
                        }
                        if (DOM.isActiveElement(inputBox.inputElement)) {
                            return;
                        }
                        else if (ownerDocument.activeElement instanceof HTMLElement && DOM.hasParentWithClass(ownerDocument.activeElement, 'context-view')) {
                            await event_1.Event.toPromise(this.contextMenuService.onDidHideContextMenu);
                        }
                        else {
                            break;
                        }
                    }
                    done(inputBox.isInputValid(), true);
                }),
                label
            ];
            return (0, lifecycle_1.toDisposable)(() => {
                done(false, false);
            });
        }
        disposeElement(element, index, templateData) {
            templateData.currentContext = undefined;
            templateData.elementDisposables.clear();
        }
        disposeCompressedElements(node, index, templateData) {
            templateData.currentContext = undefined;
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
        getCompressedNavigationController(stat) {
            return this.compressedNavigationControllers.get(stat);
        }
        // IAccessibilityProvider
        getAriaLabel(element) {
            return element.name;
        }
        getAriaLevel(element) {
            // We need to comput aria level on our own since children of compact folders will otherwise have an incorrect level	#107235
            let depth = 0;
            let parent = element.parent;
            while (parent) {
                parent = parent.parent;
                depth++;
            }
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                depth = depth + 1;
            }
            return depth;
        }
        getActiveDescendantId(stat) {
            return this.compressedNavigationControllers.get(stat)?.[0]?.currentId ?? undefined;
        }
        dispose() {
            this.configListener.dispose();
        }
    };
    exports.FilesRenderer = FilesRenderer;
    exports.FilesRenderer = FilesRenderer = FilesRenderer_1 = __decorate([
        __param(3, contextView_1.IContextViewService),
        __param(4, themeService_1.IThemeService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, files_2.IExplorerService),
        __param(7, label_1.ILabelService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, hover_1.IHoverService),
        __param(11, instantiation_1.IInstantiationService)
    ], FilesRenderer);
    /**
     * Respects files.exclude setting in filtering out content from the explorer.
     * Makes sure that visible editors are always shown in the explorer even if they are filtered out by settings.
     */
    let FilesFilter = class FilesFilter {
        constructor(contextService, configurationService, explorerService, editorService, uriIdentityService, fileService) {
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.hiddenExpressionPerRoot = new Map();
            this.editorsAffectingFilter = new Set();
            this._onDidChange = new event_1.Emitter();
            this.toDispose = [];
            // List of ignoreFile resources. Used to detect changes to the ignoreFiles.
            this.ignoreFileResourcesPerRoot = new Map();
            // Ignore tree per root. Similar to `hiddenExpressionPerRoot`
            // Note: URI in the ternary search tree is the URI of the folder containing the ignore file
            // It is not the ignore file itself. This is because of the way the IgnoreFile works and nested paths
            this.ignoreTreesPerRoot = new Map();
            this.toDispose.push(this.contextService.onDidChangeWorkspaceFolders(() => this.updateConfiguration()));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('files.exclude') || e.affectsConfiguration('explorer.excludeGitIgnore')) {
                    this.updateConfiguration();
                }
            }));
            this.toDispose.push(this.fileService.onDidFilesChange(e => {
                // Check to see if the update contains any of the ignoreFileResources
                for (const [root, ignoreFileResourceSet] of this.ignoreFileResourcesPerRoot.entries()) {
                    ignoreFileResourceSet.forEach(async (ignoreResource) => {
                        if (e.contains(ignoreResource, 0 /* FileChangeType.UPDATED */)) {
                            await this.processIgnoreFile(root, ignoreResource, true);
                        }
                        if (e.contains(ignoreResource, 2 /* FileChangeType.DELETED */)) {
                            this.ignoreTreesPerRoot.get(root)?.delete((0, resources_1.dirname)(ignoreResource));
                            ignoreFileResourceSet.delete(ignoreResource);
                            this._onDidChange.fire();
                        }
                    });
                }
            }));
            this.toDispose.push(this.editorService.onDidVisibleEditorsChange(() => {
                const editors = this.editorService.visibleEditors;
                let shouldFire = false;
                for (const e of editors) {
                    if (!e.resource) {
                        continue;
                    }
                    const stat = this.explorerService.findClosest(e.resource);
                    if (stat && stat.isExcluded) {
                        // A filtered resource suddenly became visible since user opened an editor
                        shouldFire = true;
                        break;
                    }
                }
                for (const e of this.editorsAffectingFilter) {
                    if (!editors.includes(e)) {
                        // Editor that was affecting filtering is no longer visible
                        shouldFire = true;
                        break;
                    }
                }
                if (shouldFire) {
                    this.editorsAffectingFilter.clear();
                    this._onDidChange.fire();
                }
            }));
            this.updateConfiguration();
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        updateConfiguration() {
            let shouldFire = false;
            let updatedGitIgnoreSetting = false;
            this.contextService.getWorkspace().folders.forEach(folder => {
                const configuration = this.configurationService.getValue({ resource: folder.uri });
                const excludesConfig = configuration?.files?.exclude || Object.create(null);
                const parseIgnoreFile = configuration.explorer.excludeGitIgnore;
                // If we should be parsing ignoreFiles for this workspace and don't have an ignore tree initialize one
                if (parseIgnoreFile && !this.ignoreTreesPerRoot.has(folder.uri.toString())) {
                    updatedGitIgnoreSetting = true;
                    this.ignoreFileResourcesPerRoot.set(folder.uri.toString(), new map_1.ResourceSet());
                    this.ignoreTreesPerRoot.set(folder.uri.toString(), ternarySearchTree_1.TernarySearchTree.forUris((uri) => this.uriIdentityService.extUri.ignorePathCasing(uri)));
                }
                // If we shouldn't be parsing ignore files but have an ignore tree, clear the ignore tree
                if (!parseIgnoreFile && this.ignoreTreesPerRoot.has(folder.uri.toString())) {
                    updatedGitIgnoreSetting = true;
                    this.ignoreFileResourcesPerRoot.delete(folder.uri.toString());
                    this.ignoreTreesPerRoot.delete(folder.uri.toString());
                }
                if (!shouldFire) {
                    const cached = this.hiddenExpressionPerRoot.get(folder.uri.toString());
                    shouldFire = !cached || !(0, objects_1.equals)(cached.original, excludesConfig);
                }
                const excludesConfigCopy = (0, objects_1.deepClone)(excludesConfig); // do not keep the config, as it gets mutated under our hoods
                this.hiddenExpressionPerRoot.set(folder.uri.toString(), { original: excludesConfigCopy, parsed: glob.parse(excludesConfigCopy) });
            });
            if (shouldFire || updatedGitIgnoreSetting) {
                this.editorsAffectingFilter.clear();
                this._onDidChange.fire();
            }
        }
        /**
         * Given a .gitignore file resource, processes the resource and adds it to the ignore tree which hides explorer items
         * @param root The root folder of the workspace as a string. Used for lookup key for ignore tree and resource list
         * @param ignoreFileResource The resource of the .gitignore file
         * @param update Whether or not we're updating an existing ignore file. If true it deletes the old entry
         */
        async processIgnoreFile(root, ignoreFileResource, update) {
            // Get the name of the directory which the ignore file is in
            const dirUri = (0, resources_1.dirname)(ignoreFileResource);
            const ignoreTree = this.ignoreTreesPerRoot.get(root);
            if (!ignoreTree) {
                return;
            }
            // Don't process a directory if we already have it in the tree
            if (!update && ignoreTree.has(dirUri)) {
                return;
            }
            // Maybe we need a cancellation token here in case it's super long?
            const content = await this.fileService.readFile(ignoreFileResource);
            // If it's just an update we update the contents keeping all references the same
            if (update) {
                const ignoreFile = ignoreTree.get(dirUri);
                ignoreFile?.updateContents(content.value.toString());
            }
            else {
                // Otherwise we create a new ignorefile and add it to the tree
                const ignoreParent = ignoreTree.findSubstr(dirUri);
                const ignoreFile = new ignoreFile_1.IgnoreFile(content.value.toString(), dirUri.path, ignoreParent);
                ignoreTree.set(dirUri, ignoreFile);
                // If we haven't seen this resource before then we need to add it to the list of resources we're tracking
                if (!this.ignoreFileResourcesPerRoot.get(root)?.has(ignoreFileResource)) {
                    this.ignoreFileResourcesPerRoot.get(root)?.add(ignoreFileResource);
                }
            }
            // Notify the explorer of the change so we may ignore these files
            this._onDidChange.fire();
        }
        filter(stat, parentVisibility) {
            // Add newly visited .gitignore files to the ignore tree
            if (stat.name === '.gitignore' && this.ignoreTreesPerRoot.has(stat.root.resource.toString())) {
                this.processIgnoreFile(stat.root.resource.toString(), stat.resource, false);
                return true;
            }
            return this.isVisible(stat, parentVisibility);
        }
        isVisible(stat, parentVisibility) {
            stat.isExcluded = false;
            if (parentVisibility === 0 /* TreeVisibility.Hidden */) {
                stat.isExcluded = true;
                return false;
            }
            if (this.explorerService.getEditableData(stat)) {
                return true; // always visible
            }
            // Hide those that match Hidden Patterns
            const cached = this.hiddenExpressionPerRoot.get(stat.root.resource.toString());
            const globMatch = cached?.parsed(path.relative(stat.root.resource.path, stat.resource.path), stat.name, name => !!(stat.parent && stat.parent.getChild(name)));
            // Small optimization to only traverse gitIgnore if the globMatch from fileExclude returned nothing
            const ignoreFile = globMatch ? undefined : this.ignoreTreesPerRoot.get(stat.root.resource.toString())?.findSubstr(stat.resource);
            const isIncludedInTraversal = ignoreFile?.isPathIncludedInTraversal(stat.resource.path, stat.isDirectory);
            // Doing !undefined returns true and we want it to be false when undefined because that means it's not included in the ignore file
            const isIgnoredByIgnoreFile = isIncludedInTraversal === undefined ? false : !isIncludedInTraversal;
            if (isIgnoredByIgnoreFile || globMatch || stat.parent?.isExcluded) {
                stat.isExcluded = true;
                const editors = this.editorService.visibleEditors;
                const editor = editors.find(e => e.resource && this.uriIdentityService.extUri.isEqualOrParent(e.resource, stat.resource));
                if (editor && stat.root === this.explorerService.findClosestRoot(stat.resource)) {
                    this.editorsAffectingFilter.add(editor);
                    return true; // Show all opened files and their parents
                }
                return false; // hidden through pattern
            }
            return true;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.FilesFilter = FilesFilter;
    exports.FilesFilter = FilesFilter = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, files_2.IExplorerService),
        __param(3, editorService_1.IEditorService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, files_1.IFileService)
    ], FilesFilter);
    // Explorer Sorter
    let FileSorter = class FileSorter {
        constructor(explorerService, contextService) {
            this.explorerService = explorerService;
            this.contextService = contextService;
        }
        compare(statA, statB) {
            // Do not sort roots
            if (statA.isRoot) {
                if (statB.isRoot) {
                    const workspaceA = this.contextService.getWorkspaceFolder(statA.resource);
                    const workspaceB = this.contextService.getWorkspaceFolder(statB.resource);
                    return workspaceA && workspaceB ? (workspaceA.index - workspaceB.index) : -1;
                }
                return -1;
            }
            if (statB.isRoot) {
                return 1;
            }
            const sortOrder = this.explorerService.sortOrderConfiguration.sortOrder;
            const lexicographicOptions = this.explorerService.sortOrderConfiguration.lexicographicOptions;
            let compareFileNames;
            let compareFileExtensions;
            switch (lexicographicOptions) {
                case 'upper':
                    compareFileNames = comparers_1.compareFileNamesUpper;
                    compareFileExtensions = comparers_1.compareFileExtensionsUpper;
                    break;
                case 'lower':
                    compareFileNames = comparers_1.compareFileNamesLower;
                    compareFileExtensions = comparers_1.compareFileExtensionsLower;
                    break;
                case 'unicode':
                    compareFileNames = comparers_1.compareFileNamesUnicode;
                    compareFileExtensions = comparers_1.compareFileExtensionsUnicode;
                    break;
                default:
                    // 'default'
                    compareFileNames = comparers_1.compareFileNamesDefault;
                    compareFileExtensions = comparers_1.compareFileExtensionsDefault;
            }
            // Sort Directories
            switch (sortOrder) {
                case 'type':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    if (statA.isDirectory && statB.isDirectory) {
                        return compareFileNames(statA.name, statB.name);
                    }
                    break;
                case 'filesFirst':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return 1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return -1;
                    }
                    break;
                case 'foldersNestsFiles':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    if (statA.hasNests && !statB.hasNests) {
                        return -1;
                    }
                    if (statB.hasNests && !statA.hasNests) {
                        return 1;
                    }
                    break;
                case 'mixed':
                    break; // not sorting when "mixed" is on
                default: /* 'default', 'modified' */
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    break;
            }
            // Sort Files
            switch (sortOrder) {
                case 'type':
                    return compareFileExtensions(statA.name, statB.name);
                case 'modified':
                    if (statA.mtime !== statB.mtime) {
                        return (statA.mtime && statB.mtime && statA.mtime < statB.mtime) ? 1 : -1;
                    }
                    return compareFileNames(statA.name, statB.name);
                default: /* 'default', 'mixed', 'filesFirst' */
                    return compareFileNames(statA.name, statB.name);
            }
        }
    };
    exports.FileSorter = FileSorter;
    exports.FileSorter = FileSorter = __decorate([
        __param(0, files_2.IExplorerService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], FileSorter);
    let FileDragAndDrop = class FileDragAndDrop {
        static { FileDragAndDrop_1 = this; }
        static { this.CONFIRM_DND_SETTING_KEY = 'explorer.confirmDragAndDrop'; }
        constructor(isCollapsed, explorerService, editorService, dialogService, contextService, fileService, configurationService, instantiationService, workspaceEditingService, uriIdentityService) {
            this.isCollapsed = isCollapsed;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.dialogService = dialogService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.workspaceEditingService = workspaceEditingService;
            this.uriIdentityService = uriIdentityService;
            this.compressedDropTargetDisposable = lifecycle_1.Disposable.None;
            this.disposables = new lifecycle_1.DisposableStore();
            this.dropEnabled = false;
            const updateDropEnablement = (e) => {
                if (!e || e.affectsConfiguration('explorer.enableDragAndDrop')) {
                    this.dropEnabled = this.configurationService.getValue('explorer.enableDragAndDrop');
                }
            };
            updateDropEnablement(undefined);
            this.disposables.add(this.configurationService.onDidChangeConfiguration(e => updateDropEnablement(e)));
        }
        onDragOver(data, target, targetIndex, targetSector, originalEvent) {
            if (!this.dropEnabled) {
                return false;
            }
            // Compressed folders
            if (target) {
                const compressedTarget = FileDragAndDrop_1.getCompressedStatFromDragEvent(target, originalEvent);
                if (compressedTarget) {
                    const iconLabelName = getIconLabelNameFromHTMLElement(originalEvent.target);
                    if (iconLabelName && iconLabelName.index < iconLabelName.count - 1) {
                        const result = this.handleDragOver(data, compressedTarget, targetIndex, targetSector, originalEvent);
                        if (result) {
                            if (iconLabelName.element !== this.compressedDragOverElement) {
                                this.compressedDragOverElement = iconLabelName.element;
                                this.compressedDropTargetDisposable.dispose();
                                this.compressedDropTargetDisposable = (0, lifecycle_1.toDisposable)(() => {
                                    iconLabelName.element.classList.remove('drop-target');
                                    this.compressedDragOverElement = undefined;
                                });
                                iconLabelName.element.classList.add('drop-target');
                            }
                            return typeof result === 'boolean' ? result : { ...result, feedback: [] };
                        }
                        this.compressedDropTargetDisposable.dispose();
                        return false;
                    }
                }
            }
            this.compressedDropTargetDisposable.dispose();
            return this.handleDragOver(data, target, targetIndex, targetSector, originalEvent);
        }
        handleDragOver(data, target, targetIndex, targetSector, originalEvent) {
            const isCopy = originalEvent && ((originalEvent.ctrlKey && !platform_1.isMacintosh) || (originalEvent.altKey && platform_1.isMacintosh));
            const isNative = data instanceof listView_1.NativeDragAndDropData;
            const effectType = (isNative || isCopy) ? 0 /* ListDragOverEffectType.Copy */ : 1 /* ListDragOverEffectType.Move */;
            const effect = { type: effectType, position: "drop-target" /* ListDragOverEffectPosition.Over */ };
            // Native DND
            if (isNative) {
                if (!(0, dnd_1.containsDragType)(originalEvent, dnd_3.DataTransfers.FILES, dnd_1.CodeDataTransfers.FILES, dnd_3.DataTransfers.RESOURCES)) {
                    return false;
                }
            }
            // Other-Tree DND
            else if (data instanceof listView_1.ExternalElementsDragAndDropData) {
                return false;
            }
            // In-Explorer DND
            else {
                const items = FileDragAndDrop_1.getStatsFromDragAndDropData(data);
                const isRootsReorder = items.every(item => item.isRoot);
                if (!target) {
                    // Dropping onto the empty area. Do not accept if items dragged are already
                    // children of the root unless we are copying the file
                    if (!isCopy && items.every(i => !!i.parent && i.parent.isRoot)) {
                        return false;
                    }
                    // root is added after last root folder when hovering on empty background
                    if (isRootsReorder) {
                        return { accept: true, effect: { type: 1 /* ListDragOverEffectType.Move */, position: "drop-target-after" /* ListDragOverEffectPosition.After */ } };
                    }
                    return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect, autoExpand: false };
                }
                if (!Array.isArray(items)) {
                    return false;
                }
                if (!isCopy && items.every((source) => source.isReadonly)) {
                    return false; // Cannot move readonly items unless we copy
                }
                if (items.some((source) => {
                    if (source.isRoot) {
                        return false; // Root folders are handled seperately
                    }
                    if (this.uriIdentityService.extUri.isEqual(source.resource, target.resource)) {
                        return true; // Can not move anything onto itself excpet for root folders
                    }
                    if (!isCopy && this.uriIdentityService.extUri.isEqual((0, resources_1.dirname)(source.resource), target.resource)) {
                        return true; // Can not move a file to the same parent unless we copy
                    }
                    if (this.uriIdentityService.extUri.isEqualOrParent(target.resource, source.resource)) {
                        return true; // Can not move a parent folder into one of its children
                    }
                    return false;
                })) {
                    return false;
                }
                // reordering roots
                if (isRootsReorder) {
                    if (!target.isRoot) {
                        return false;
                    }
                    let dropEffectPosition = undefined;
                    switch (targetSector) {
                        case 0 /* ListViewTargetSector.TOP */:
                        case 1 /* ListViewTargetSector.CENTER_TOP */:
                            dropEffectPosition = "drop-target-before" /* ListDragOverEffectPosition.Before */;
                            break;
                        case 2 /* ListViewTargetSector.CENTER_BOTTOM */:
                        case 3 /* ListViewTargetSector.BOTTOM */:
                            dropEffectPosition = "drop-target-after" /* ListDragOverEffectPosition.After */;
                            break;
                    }
                    return { accept: true, effect: { type: 1 /* ListDragOverEffectType.Move */, position: dropEffectPosition } };
                }
            }
            // All (target = model)
            if (!target) {
                return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect };
            }
            // All (target = file/folder)
            else {
                if (target.isDirectory) {
                    if (target.isReadonly) {
                        return false;
                    }
                    return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect, autoExpand: true };
                }
                if (this.contextService.getWorkspace().folders.every(folder => folder.uri.toString() !== target.resource.toString())) {
                    return { accept: true, bubble: 1 /* TreeDragOverBubble.Up */, effect };
                }
            }
            return false;
        }
        getDragURI(element) {
            if (this.explorerService.isEditable(element)) {
                return null;
            }
            return element.resource.toString();
        }
        getDragLabel(elements, originalEvent) {
            if (elements.length === 1) {
                const stat = FileDragAndDrop_1.getCompressedStatFromDragEvent(elements[0], originalEvent);
                return stat.name;
            }
            return String(elements.length);
        }
        onDragStart(data, originalEvent) {
            const items = FileDragAndDrop_1.getStatsFromDragAndDropData(data, originalEvent);
            if (items && items.length && originalEvent.dataTransfer) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(accessor => (0, dnd_2.fillEditorsDragData)(accessor, items, originalEvent));
                // The only custom data transfer we set from the explorer is a file transfer
                // to be able to DND between multiple code file explorers across windows
                const fileResources = items.filter(s => s.resource.scheme === network_1.Schemas.file).map(r => r.resource.fsPath);
                if (fileResources.length) {
                    originalEvent.dataTransfer.setData(dnd_1.CodeDataTransfers.FILES, JSON.stringify(fileResources));
                }
            }
        }
        async drop(data, target, targetIndex, targetSector, originalEvent) {
            this.compressedDropTargetDisposable.dispose();
            // Find compressed target
            if (target) {
                const compressedTarget = FileDragAndDrop_1.getCompressedStatFromDragEvent(target, originalEvent);
                if (compressedTarget) {
                    target = compressedTarget;
                }
            }
            // Find parent to add to
            if (!target) {
                target = this.explorerService.roots[this.explorerService.roots.length - 1];
                targetSector = 3 /* ListViewTargetSector.BOTTOM */;
            }
            if (!target.isDirectory && target.parent) {
                target = target.parent;
            }
            if (target.isReadonly) {
                return;
            }
            const resolvedTarget = target;
            if (!resolvedTarget) {
                return;
            }
            try {
                // External file DND (Import/Upload file)
                if (data instanceof listView_1.NativeDragAndDropData) {
                    // Use local file import when supported
                    if (!platform_1.isWeb || ((0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace()) && webFileSystemAccess_1.WebFileSystemAccess.supported(window_1.mainWindow))) {
                        const fileImport = this.instantiationService.createInstance(fileImportExport_1.ExternalFileImport);
                        await fileImport.import(resolvedTarget, originalEvent, window_1.mainWindow);
                    }
                    // Otherwise fallback to browser based file upload
                    else {
                        const browserUpload = this.instantiationService.createInstance(fileImportExport_1.BrowserFileUpload);
                        await browserUpload.upload(target, originalEvent);
                    }
                }
                // In-Explorer DND (Move/Copy file)
                else {
                    await this.handleExplorerDrop(data, resolvedTarget, targetIndex, targetSector, originalEvent);
                }
            }
            catch (error) {
                this.dialogService.error((0, errorMessage_1.toErrorMessage)(error));
            }
        }
        async handleExplorerDrop(data, target, targetIndex, targetSector, originalEvent) {
            const elementsData = FileDragAndDrop_1.getStatsFromDragAndDropData(data);
            const distinctItems = new Map(elementsData.map(element => [element, this.isCollapsed(element)]));
            for (const [item, collapsed] of distinctItems) {
                if (collapsed) {
                    const nestedChildren = item.nestedChildren;
                    if (nestedChildren) {
                        for (const child of nestedChildren) {
                            // if parent is collapsed, then the nested children is considered collapsed to operate as a group
                            // and skip collapsed state check since they're not in the tree
                            distinctItems.set(child, true);
                        }
                    }
                }
            }
            const items = (0, resources_1.distinctParents)([...distinctItems.keys()], s => s.resource);
            const isCopy = (originalEvent.ctrlKey && !platform_1.isMacintosh) || (originalEvent.altKey && platform_1.isMacintosh);
            // Handle confirm setting
            const confirmDragAndDrop = !isCopy && this.configurationService.getValue(FileDragAndDrop_1.CONFIRM_DND_SETTING_KEY);
            if (confirmDragAndDrop) {
                const message = items.length > 1 && items.every(s => s.isRoot) ? (0, nls_1.localize)('confirmRootsMove', "Are you sure you want to change the order of multiple root folders in your workspace?")
                    : items.length > 1 ? (0, nls_1.localize)('confirmMultiMove', "Are you sure you want to move the following {0} files into '{1}'?", items.length, target.name)
                        : items[0].isRoot ? (0, nls_1.localize)('confirmRootMove', "Are you sure you want to change the order of root folder '{0}' in your workspace?", items[0].name)
                            : (0, nls_1.localize)('confirmMove', "Are you sure you want to move '{0}' into '{1}'?", items[0].name, target.name);
                const detail = items.length > 1 && !items.every(s => s.isRoot) ? (0, dialogs_1.getFileNamesMessage)(items.map(i => i.resource)) : undefined;
                const confirmation = await this.dialogService.confirm({
                    message,
                    detail,
                    checkbox: {
                        label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
                    },
                    primaryButton: (0, nls_1.localize)({ key: 'moveButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Move")
                });
                if (!confirmation.confirmed) {
                    return;
                }
                // Check for confirmation checkbox
                if (confirmation.checkboxChecked === true) {
                    await this.configurationService.updateValue(FileDragAndDrop_1.CONFIRM_DND_SETTING_KEY, false);
                }
            }
            await this.doHandleRootDrop(items.filter(s => s.isRoot), target, targetSector);
            const sources = items.filter(s => !s.isRoot);
            if (isCopy) {
                return this.doHandleExplorerDropOnCopy(sources, target);
            }
            return this.doHandleExplorerDropOnMove(sources, target);
        }
        async doHandleRootDrop(roots, target, targetSector) {
            if (roots.length === 0) {
                return;
            }
            const folders = this.contextService.getWorkspace().folders;
            let targetIndex;
            const sourceIndices = [];
            const workspaceCreationData = [];
            const rootsToMove = [];
            for (let index = 0; index < folders.length; index++) {
                const data = {
                    uri: folders[index].uri,
                    name: folders[index].name
                };
                // Is current target
                if (target instanceof explorerModel_1.ExplorerItem && this.uriIdentityService.extUri.isEqual(folders[index].uri, target.resource)) {
                    targetIndex = index;
                }
                // Is current source
                for (const root of roots) {
                    if (this.uriIdentityService.extUri.isEqual(folders[index].uri, root.resource)) {
                        sourceIndices.push(index);
                        break;
                    }
                }
                if (roots.every(r => r.resource.toString() !== folders[index].uri.toString())) {
                    workspaceCreationData.push(data);
                }
                else {
                    rootsToMove.push(data);
                }
            }
            if (targetIndex === undefined) {
                targetIndex = workspaceCreationData.length;
            }
            else {
                switch (targetSector) {
                    case 3 /* ListViewTargetSector.BOTTOM */:
                    case 2 /* ListViewTargetSector.CENTER_BOTTOM */:
                        targetIndex++;
                        break;
                }
                // Adjust target index if source was located before target.
                // The move will cause the index to change
                for (const sourceIndex of sourceIndices) {
                    if (sourceIndex < targetIndex) {
                        targetIndex--;
                    }
                }
            }
            workspaceCreationData.splice(targetIndex, 0, ...rootsToMove);
            return this.workspaceEditingService.updateFolders(0, workspaceCreationData.length, workspaceCreationData);
        }
        async doHandleExplorerDropOnCopy(sources, target) {
            // Reuse duplicate action when user copies
            const explorerConfig = this.configurationService.getValue().explorer;
            const resourceFileEdits = [];
            for (const { resource, isDirectory } of sources) {
                const allowOverwrite = explorerConfig.incrementalNaming === 'disabled';
                const newResource = await (0, fileActions_1.findValidPasteFileTarget)(this.explorerService, this.fileService, this.dialogService, target, { resource, isDirectory, allowOverwrite }, explorerConfig.incrementalNaming);
                if (!newResource) {
                    continue;
                }
                const resourceEdit = new bulkEditService_1.ResourceFileEdit(resource, newResource, { copy: true, overwrite: allowOverwrite });
                resourceFileEdits.push(resourceEdit);
            }
            const labelSuffix = getFileOrFolderLabelSuffix(sources);
            await this.explorerService.applyBulkEdit(resourceFileEdits, {
                confirmBeforeUndo: explorerConfig.confirmUndo === "default" /* UndoConfirmLevel.Default */ || explorerConfig.confirmUndo === "verbose" /* UndoConfirmLevel.Verbose */,
                undoLabel: (0, nls_1.localize)('copy', "Copy {0}", labelSuffix),
                progressLabel: (0, nls_1.localize)('copying', "Copying {0}", labelSuffix),
            });
            const editors = resourceFileEdits.filter(edit => {
                const item = edit.newResource ? this.explorerService.findClosest(edit.newResource) : undefined;
                return item && !item.isDirectory;
            }).map(edit => ({ resource: edit.newResource, options: { pinned: true } }));
            await this.editorService.openEditors(editors);
        }
        async doHandleExplorerDropOnMove(sources, target) {
            // Do not allow moving readonly items
            const resourceFileEdits = sources.filter(source => !source.isReadonly).map(source => new bulkEditService_1.ResourceFileEdit(source.resource, (0, resources_1.joinPath)(target.resource, source.name)));
            const labelSuffix = getFileOrFolderLabelSuffix(sources);
            const options = {
                confirmBeforeUndo: this.configurationService.getValue().explorer.confirmUndo === "verbose" /* UndoConfirmLevel.Verbose */,
                undoLabel: (0, nls_1.localize)('move', "Move {0}", labelSuffix),
                progressLabel: (0, nls_1.localize)('moving', "Moving {0}", labelSuffix)
            };
            try {
                await this.explorerService.applyBulkEdit(resourceFileEdits, options);
            }
            catch (error) {
                // Conflict
                if (error.fileOperationResult === 4 /* FileOperationResult.FILE_MOVE_CONFLICT */) {
                    const overwrites = [];
                    for (const edit of resourceFileEdits) {
                        if (edit.newResource && await this.fileService.exists(edit.newResource)) {
                            overwrites.push(edit.newResource);
                        }
                    }
                    // Move with overwrite if the user confirms
                    const confirm = (0, fileImportExport_1.getMultipleFilesOverwriteConfirm)(overwrites);
                    const { confirmed } = await this.dialogService.confirm(confirm);
                    if (confirmed) {
                        await this.explorerService.applyBulkEdit(resourceFileEdits.map(re => new bulkEditService_1.ResourceFileEdit(re.oldResource, re.newResource, { overwrite: true })), options);
                    }
                }
                // Any other error: bubble up
                else {
                    throw error;
                }
            }
        }
        static getStatsFromDragAndDropData(data, dragStartEvent) {
            if (data.context) {
                return data.context;
            }
            // Detect compressed folder dragging
            if (dragStartEvent && data.elements.length === 1) {
                data.context = [FileDragAndDrop_1.getCompressedStatFromDragEvent(data.elements[0], dragStartEvent)];
                return data.context;
            }
            return data.elements;
        }
        static getCompressedStatFromDragEvent(stat, dragEvent) {
            const target = DOM.getWindow(dragEvent).document.elementFromPoint(dragEvent.clientX, dragEvent.clientY);
            const iconLabelName = getIconLabelNameFromHTMLElement(target);
            if (iconLabelName) {
                const { count, index } = iconLabelName;
                let i = count - 1;
                while (i > index && stat.parent) {
                    stat = stat.parent;
                    i--;
                }
                return stat;
            }
            return stat;
        }
        onDragEnd() {
            this.compressedDropTargetDisposable.dispose();
        }
        dispose() {
            this.compressedDropTargetDisposable.dispose();
        }
    };
    exports.FileDragAndDrop = FileDragAndDrop;
    exports.FileDragAndDrop = FileDragAndDrop = FileDragAndDrop_1 = __decorate([
        __param(1, files_2.IExplorerService),
        __param(2, editorService_1.IEditorService),
        __param(3, dialogs_1.IDialogService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, files_1.IFileService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, workspaceEditing_1.IWorkspaceEditingService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], FileDragAndDrop);
    function getIconLabelNameFromHTMLElement(target) {
        if (!(target instanceof HTMLElement)) {
            return null;
        }
        let element = target;
        while (element && !element.classList.contains('monaco-list-row')) {
            if (element.classList.contains('label-name') && element.hasAttribute('data-icon-label-count')) {
                const count = Number(element.getAttribute('data-icon-label-count'));
                const index = Number(element.getAttribute('data-icon-label-index'));
                if ((0, types_1.isNumber)(count) && (0, types_1.isNumber)(index)) {
                    return { element: element, count, index };
                }
            }
            element = element.parentElement;
        }
        return null;
    }
    function isCompressedFolderName(target) {
        return !!getIconLabelNameFromHTMLElement(target);
    }
    class ExplorerCompressionDelegate {
        isIncompressible(stat) {
            return stat.isRoot || !stat.isDirectory || stat instanceof explorerModel_1.NewExplorerItem || (!stat.parent || stat.parent.isRoot);
        }
    }
    exports.ExplorerCompressionDelegate = ExplorerCompressionDelegate;
    function getFileOrFolderLabelSuffix(items) {
        if (items.length === 1) {
            return items[0].name;
        }
        if (items.every(i => i.isDirectory)) {
            return (0, nls_1.localize)('numberOfFolders', "{0} folders", items.length);
        }
        if (items.every(i => !i.isDirectory)) {
            return (0, nls_1.localize)('numberOfFiles', "{0} files", items.length);
        }
        return `${items.length} files and folders`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJWaWV3ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL3ZpZXdzL2V4cGxvcmVyVmlld2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4aURoRyx3REFFQztJQTMrQ0QsTUFBYSxnQkFBZ0I7aUJBRVosZ0JBQVcsR0FBRyxFQUFFLENBQUM7UUFFakMsU0FBUyxDQUFDLE9BQXFCO1lBQzlCLE9BQU8sZ0JBQWdCLENBQUMsV0FBVyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBcUI7WUFDbEMsT0FBTyxhQUFhLENBQUMsRUFBRSxDQUFDO1FBQ3pCLENBQUM7O0lBVkYsNENBV0M7SUFFWSxRQUFBLHdCQUF3QixHQUFHLElBQUksZUFBTyxFQUFPLENBQUM7SUFDcEQsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7UUFFOUIsWUFDUyxVQUF1QixFQUNJLGVBQWlDLEVBQzVCLGFBQW9DLEVBQ3JDLG1CQUF5QyxFQUN0QyxhQUFzQyxFQUNqRCxXQUF5QixFQUNyQixlQUFpQyxFQUN6QixjQUF3QyxFQUN0QyxrQkFBOEM7WUFSbkYsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNJLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUM1QixrQkFBYSxHQUFiLGFBQWEsQ0FBdUI7WUFDckMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN0QyxrQkFBYSxHQUFiLGFBQWEsQ0FBeUI7WUFDakQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDckIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3pCLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUN0Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQTRCO1FBQ3hGLENBQUM7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