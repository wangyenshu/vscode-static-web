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
define(["require", "exports", "vs/base/common/comparers", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/theme/common/colorRegistry", "vs/platform/workspace/common/workspace", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/platform/theme/common/themeService", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/textResourceConfiguration", "vs/css!./media/breadcrumbscontrol"], function (require, exports, comparers_1, errors_1, event_1, filters_1, glob, lifecycle_1, path_1, resources_1, uri_1, configuration_1, files_1, instantiation_1, listService_1, colorRegistry_1, workspace_1, labels_1, breadcrumbs_1, themeService_1, nls_1, editorService_1, textResourceConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsOutlinePicker = exports.BreadcrumbsFilePicker = exports.FileSorter = exports.BreadcrumbsPicker = void 0;
    let BreadcrumbsPicker = class BreadcrumbsPicker {
        constructor(parent, resource, _instantiationService, _themeService, _configurationService) {
            this.resource = resource;
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._fakeEvent = new UIEvent('fakeEvent');
            this._onWillPickElement = new event_1.Emitter();
            this.onWillPickElement = this._onWillPickElement.event;
            this._previewDispoables = new lifecycle_1.MutableDisposable();
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-breadcrumbs-picker show-file-icons';
            parent.appendChild(this._domNode);
        }
        dispose() {
            this._disposables.dispose();
            this._previewDispoables.dispose();
            this._onWillPickElement.dispose();
            this._domNode.remove();
            setTimeout(() => this._tree.dispose(), 0); // tree cannot be disposed while being opened...
        }
        async show(input, maxHeight, width, arrowSize, arrowOffset) {
            const theme = this._themeService.getColorTheme();
            const color = theme.getColor(colorRegistry_1.breadcrumbsPickerBackground);
            this._arrow = document.createElement('div');
            this._arrow.className = 'arrow';
            this._arrow.style.borderColor = `transparent transparent ${color ? color.toString() : ''}`;
            this._domNode.appendChild(this._arrow);
            this._treeContainer = document.createElement('div');
            this._treeContainer.style.background = color ? color.toString() : '';
            this._treeContainer.style.paddingTop = '2px';
            this._treeContainer.style.borderRadius = '3px';
            this._treeContainer.style.boxShadow = `0 0 8px 2px ${this._themeService.getColorTheme().getColor(colorRegistry_1.widgetShadow)}`;
            this._treeContainer.style.border = `1px solid ${this._themeService.getColorTheme().getColor(colorRegistry_1.widgetBorder)}`;
            this._domNode.appendChild(this._treeContainer);
            this._layoutInfo = { maxHeight, width, arrowSize, arrowOffset, inputHeight: 0 };
            this._tree = this._createTree(this._treeContainer, input);
            this._disposables.add(this._tree.onDidOpen(async (e) => {
                const { element, editorOptions, sideBySide } = e;
                const didReveal = await this._revealElement(element, { ...editorOptions, preserveFocus: false }, sideBySide);
                if (!didReveal) {
                    return;
                }
            }));
            this._disposables.add(this._tree.onDidChangeFocus(e => {
                this._previewDispoables.value = this._previewElement(e.elements[0]);
            }));
            this._disposables.add(this._tree.onDidChangeContentHeight(() => {
                this._layout();
            }));
            this._domNode.focus();
            try {
                await this._setInput(input);
                this._layout();
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        _layout() {
            const headerHeight = 2 * this._layoutInfo.arrowSize;
            const treeHeight = Math.min(this._layoutInfo.maxHeight - headerHeight, this._tree.contentHeight);
            const totalHeight = treeHeight + headerHeight;
            this._domNode.style.height = `${totalHeight}px`;
            this._domNode.style.width = `${this._layoutInfo.width}px`;
            this._arrow.style.top = `-${2 * this._layoutInfo.arrowSize}px`;
            this._arrow.style.borderWidth = `${this._layoutInfo.arrowSize}px`;
            this._arrow.style.marginLeft = `${this._layoutInfo.arrowOffset}px`;
            this._treeContainer.style.height = `${treeHeight}px`;
            this._treeContainer.style.width = `${this._layoutInfo.width}px`;
            this._tree.layout(treeHeight, this._layoutInfo.width);
        }
        restoreViewState() { }
    };
    exports.BreadcrumbsPicker = BreadcrumbsPicker;
    exports.BreadcrumbsPicker = BreadcrumbsPicker = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService)
    ], BreadcrumbsPicker);
    //#region - Files
    class FileVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return 'FileStat';
        }
    }
    class FileIdentityProvider {
        getId(element) {
            if (uri_1.URI.isUri(element)) {
                return element.toString();
            }
            else if ((0, workspace_1.isWorkspace)(element)) {
                return element.id;
            }
            else if ((0, workspace_1.isWorkspaceFolder)(element)) {
                return element.uri.toString();
            }
            else {
                return element.resource.toString();
            }
        }
    }
    let FileDataSource = class FileDataSource {
        constructor(_fileService) {
            this._fileService = _fileService;
        }
        hasChildren(element) {
            return uri_1.URI.isUri(element)
                || (0, workspace_1.isWorkspace)(element)
                || (0, workspace_1.isWorkspaceFolder)(element)
                || element.isDirectory;
        }
        async getChildren(element) {
            if ((0, workspace_1.isWorkspace)(element)) {
                return element.folders;
            }
            let uri;
            if ((0, workspace_1.isWorkspaceFolder)(element)) {
                uri = element.uri;
            }
            else if (uri_1.URI.isUri(element)) {
                uri = element;
            }
            else {
                uri = element.resource;
            }
            const stat = await this._fileService.resolve(uri);
            return stat.children ?? [];
        }
    };
    FileDataSource = __decorate([
        __param(0, files_1.IFileService)
    ], FileDataSource);
    let FileRenderer = class FileRenderer {
        constructor(_labels, _configService) {
            this._labels = _labels;
            this._configService = _configService;
            this.templateId = 'FileStat';
        }
        renderTemplate(container) {
            return this._labels.create(container, { supportHighlights: true });
        }
        renderElement(node, index, templateData) {
            const fileDecorations = this._configService.getValue('explorer.decorations');
            const { element } = node;
            let resource;
            let fileKind;
            if ((0, workspace_1.isWorkspaceFolder)(element)) {
                resource = element.uri;
                fileKind = files_1.FileKind.ROOT_FOLDER;
            }
            else {
                resource = element.resource;
                fileKind = element.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            }
            templateData.setFile(resource, {
                fileKind,
                hidePath: true,
                fileDecorations: fileDecorations,
                matches: (0, filters_1.createMatches)(node.filterData),
                extraClasses: ['picker-item']
            });
        }
        disposeTemplate(templateData) {
            templateData.dispose();
        }
    };
    FileRenderer = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], FileRenderer);
    class FileNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element.name;
        }
    }
    class FileAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('breadcrumbs', "Breadcrumbs");
        }
        getAriaLabel(element) {
            return element.name;
        }
    }
    let FileFilter = class FileFilter {
        constructor(_workspaceService, configService) {
            this._workspaceService = _workspaceService;
            this._cachedExpressions = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            const config = breadcrumbs_1.BreadcrumbsConfig.FileExcludes.bindTo(configService);
            const update = () => {
                _workspaceService.getWorkspace().folders.forEach(folder => {
                    const excludesConfig = config.getValue({ resource: folder.uri });
                    if (!excludesConfig) {
                        return;
                    }
                    // adjust patterns to be absolute in case they aren't
                    // free floating (**/)
                    const adjustedConfig = {};
                    for (const pattern in excludesConfig) {
                        if (typeof excludesConfig[pattern] !== 'boolean') {
                            continue;
                        }
                        const patternAbs = pattern.indexOf('**/') !== 0
                            ? path_1.posix.join(folder.uri.path, pattern)
                            : pattern;
                        adjustedConfig[patternAbs] = excludesConfig[pattern];
                    }
                    this._cachedExpressions.set(folder.uri.toString(), glob.parse(adjustedConfig));
                });
            };
            update();
            this._disposables.add(config);
            this._disposables.add(config.onDidChange(update));
            this._disposables.add(_workspaceService.onDidChangeWorkspaceFolders(update));
        }
        dispose() {
            this._disposables.dispose();
        }
        filter(element, _parentVisibility) {
            if ((0, workspace_1.isWorkspaceFolder)(element)) {
                // not a file
                return true;
            }
            const folder = this._workspaceService.getWorkspaceFolder(element.resource);
            if (!folder || !this._cachedExpressions.has(folder.uri.toString())) {
                // no folder or no filer
                return true;
            }
            const expression = this._cachedExpressions.get(folder.uri.toString());
            return !expression((0, path_1.relative)(folder.uri.path, element.resource.path), (0, resources_1.basename)(element.resource));
        }
    };
    FileFilter = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, configuration_1.IConfigurationService)
    ], FileFilter);
    class FileSorter {
        compare(a, b) {
            if ((0, workspace_1.isWorkspaceFolder)(a) && (0, workspace_1.isWorkspaceFolder)(b)) {
                return a.index - b.index;
            }
            if (a.isDirectory === b.isDirectory) {
                // same type -> compare on names
                return (0, comparers_1.compareFileNames)(a.name, b.name);
            }
            else if (a.isDirectory) {
                return -1;
            }
            else {
                return 1;
            }
        }
    }
    exports.FileSorter = FileSorter;
    let BreadcrumbsFilePicker = class BreadcrumbsFilePicker extends BreadcrumbsPicker {
        constructor(parent, resource, instantiationService, themeService, configService, _workspaceService, _editorService) {
            super(parent, resource, instantiationService, themeService, configService);
            this._workspaceService = _workspaceService;
            this._editorService = _editorService;
        }
        _createTree(container) {
            // tree icon theme specials
            this._treeContainer.classList.add('file-icon-themable-tree');
            this._treeContainer.classList.add('show-file-icons');
            const onFileIconThemeChange = (fileIconTheme) => {
                this._treeContainer.classList.toggle('align-icons-and-twisties', fileIconTheme.hasFileIcons && !fileIconTheme.hasFolderIcons);
                this._treeContainer.classList.toggle('hide-arrows', fileIconTheme.hidesExplorerArrows === true);
            };
            this._disposables.add(this._themeService.onDidFileIconThemeChange(onFileIconThemeChange));
            onFileIconThemeChange(this._themeService.getFileIconTheme());
            const labels = this._instantiationService.createInstance(labels_1.ResourceLabels, labels_1.DEFAULT_LABELS_CONTAINER /* TODO@Jo visibility propagation */);
            this._disposables.add(labels);
            return this._instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'BreadcrumbsFilePicker', container, new FileVirtualDelegate(), [this._instantiationService.createInstance(FileRenderer, labels)], this._instantiationService.createInstance(FileDataSource), {
                multipleSelectionSupport: false,
                sorter: new FileSorter(),
                filter: this._instantiationService.createInstance(FileFilter),
                identityProvider: new FileIdentityProvider(),
                keyboardNavigationLabelProvider: new FileNavigationLabelProvider(),
                accessibilityProvider: this._instantiationService.createInstance(FileAccessibilityProvider),
                showNotFoundMessage: false,
                overrideStyles: {
                    listBackground: colorRegistry_1.breadcrumbsPickerBackground
                },
            });
        }
        async _setInput(element) {
            const { uri, kind } = element;
            let input;
            if (kind === files_1.FileKind.ROOT_FOLDER) {
                input = this._workspaceService.getWorkspace();
            }
            else {
                input = (0, resources_1.dirname)(uri);
            }
            const tree = this._tree;
            await tree.setInput(input);
            let focusElement;
            for (const { element } of tree.getNode().children) {
                if ((0, workspace_1.isWorkspaceFolder)(element) && (0, resources_1.isEqual)(element.uri, uri)) {
                    focusElement = element;
                    break;
                }
                else if ((0, resources_1.isEqual)(element.resource, uri)) {
                    focusElement = element;
                    break;
                }
            }
            if (focusElement) {
                tree.reveal(focusElement, 0.5);
                tree.setFocus([focusElement], this._fakeEvent);
            }
            tree.domFocus();
        }
        _previewElement(_element) {
            return lifecycle_1.Disposable.None;
        }
        async _revealElement(element, options, sideBySide) {
            if (!(0, workspace_1.isWorkspaceFolder)(element) && element.isFile) {
                this._onWillPickElement.fire();
                await this._editorService.openEditor({ resource: element.resource, options }, sideBySide ? editorService_1.SIDE_GROUP : undefined);
                return true;
            }
            return false;
        }
    };
    exports.BreadcrumbsFilePicker = BreadcrumbsFilePicker;
    exports.BreadcrumbsFilePicker = BreadcrumbsFilePicker = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, editorService_1.IEditorService)
    ], BreadcrumbsFilePicker);
    //#endregion
    //#region - Outline
    let OutlineTreeSorter = class OutlineTreeSorter {
        constructor(comparator, uri, configService) {
            this.comparator = comparator;
            this._order = configService.getValue(uri, 'breadcrumbs.symbolSortOrder');
        }
        compare(a, b) {
            if (this._order === 'name') {
                return this.comparator.compareByName(a, b);
            }
            else if (this._order === 'type') {
                return this.comparator.compareByType(a, b);
            }
            else {
                return this.comparator.compareByPosition(a, b);
            }
        }
    };
    OutlineTreeSorter = __decorate([
        __param(2, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], OutlineTreeSorter);
    class BreadcrumbsOutlinePicker extends BreadcrumbsPicker {
        _createTree(container, input) {
            const { config } = input.outline;
            return this._instantiationService.createInstance(listService_1.WorkbenchDataTree, 'BreadcrumbsOutlinePicker', container, config.delegate, config.renderers, config.treeDataSource, {
                ...config.options,
                sorter: this._instantiationService.createInstance(OutlineTreeSorter, config.comparator, undefined),
                collapseByDefault: true,
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                showNotFoundMessage: false
            });
        }
        _setInput(input) {
            const viewState = input.outline.captureViewState();
            this.restoreViewState = () => { viewState.dispose(); };
            const tree = this._tree;
            tree.setInput(input.outline);
            if (input.element !== input.outline) {
                tree.reveal(input.element, 0.5);
                tree.setFocus([input.element], this._fakeEvent);
            }
            tree.domFocus();
            return Promise.resolve();
        }
        _previewElement(element) {
            const outline = this._tree.getInput();
            return outline.preview(element);
        }
        async _revealElement(element, options, sideBySide) {
            this._onWillPickElement.fire();
            const outline = this._tree.getInput();
            await outline.reveal(element, options, sideBySide, false);
            return true;
        }
    }
    exports.BreadcrumbsOutlinePicker = BreadcrumbsOutlinePicker;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWRjcnVtYnNQaWNrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvYnJlYWRjcnVtYnNQaWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEN6RixJQUFlLGlCQUFpQixHQUFoQyxNQUFlLGlCQUFpQjtRQWV0QyxZQUNDLE1BQW1CLEVBQ1QsUUFBYSxFQUNBLHFCQUErRCxFQUN2RSxhQUErQyxFQUN2QyxxQkFBK0Q7WUFINUUsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNtQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3BELGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ3BCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFsQnBFLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFLOUMsZUFBVSxHQUFHLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRzdCLHVCQUFrQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDbkQsc0JBQWlCLEdBQWdCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFFdkQsdUJBQWtCLEdBQUcsSUFBSSw2QkFBaUIsRUFBRSxDQUFDO1lBUzdELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRywyQ0FBMkMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDNUIsSUFB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