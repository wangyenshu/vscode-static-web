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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/resources", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/languages/language", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/editor/common/services/model", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/decorations/common/decorations", "vs/base/common/network", "vs/platform/files/common/files", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/platform/label/common/label", "vs/editor/common/services/getIconClasses", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/labels", "vs/workbench/services/notebook/common/notebookDocumentService"], function (require, exports, nls_1, uri_1, resources_1, iconLabel_1, language_1, workspace_1, configuration_1, model_1, textfiles_1, decorations_1, network_1, files_1, themeService_1, event_1, label_1, getIconClasses_1, lifecycle_1, instantiation_1, labels_1, notebookDocumentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceLabel = exports.ResourceLabels = exports.DEFAULT_LABELS_CONTAINER = void 0;
    function toResource(props) {
        if (!props || !props.resource) {
            return undefined;
        }
        if (uri_1.URI.isUri(props.resource)) {
            return props.resource;
        }
        return props.resource.primary;
    }
    exports.DEFAULT_LABELS_CONTAINER = {
        onDidChangeVisibility: event_1.Event.None
    };
    let ResourceLabels = class ResourceLabels extends lifecycle_1.Disposable {
        constructor(container, instantiationService, configurationService, modelService, workspaceService, languageService, decorationsService, themeService, labelService, textFileService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.workspaceService = workspaceService;
            this.languageService = languageService;
            this.decorationsService = decorationsService;
            this.themeService = themeService;
            this.labelService = labelService;
            this.textFileService = textFileService;
            this._onDidChangeDecorations = this._register(new event_1.Emitter());
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this.widgets = [];
            this.labels = [];
            this.registerListeners(container);
        }
        registerListeners(container) {
            // notify when visibility changes
            this._register(container.onDidChangeVisibility(visible => {
                this.widgets.forEach(widget => widget.notifyVisibilityChanged(visible));
            }));
            // notify when extensions are registered with potentially new languages
            this._register(this.languageService.onDidChange(() => this.widgets.forEach(widget => widget.notifyExtensionsRegistered())));
            // notify when model language changes
            this._register(this.modelService.onModelLanguageChanged(e => {
                if (!e.model.uri) {
                    return; // we need the resource to compare
                }
                this.widgets.forEach(widget => widget.notifyModelLanguageChanged(e.model));
            }));
            // notify when model is added
            this._register(this.modelService.onModelAdded(model => {
                if (!model.uri) {
                    return; // we need the resource to compare
                }
                this.widgets.forEach(widget => widget.notifyModelAdded(model));
            }));
            // notify when workspace folders changes
            this._register(this.workspaceService.onDidChangeWorkspaceFolders(() => {
                this.widgets.forEach(widget => widget.notifyWorkspaceFoldersChange());
            }));
            // notify when file decoration changes
            this._register(this.decorationsService.onDidChangeDecorations(e => {
                let notifyDidChangeDecorations = false;
                this.widgets.forEach(widget => {
                    if (widget.notifyFileDecorationsChanges(e)) {
                        notifyDidChangeDecorations = true;
                    }
                });
                if (notifyDidChangeDecorations) {
                    this._onDidChangeDecorations.fire();
                }
            }));
            // notify when theme changes
            this._register(this.themeService.onDidColorThemeChange(() => this.widgets.forEach(widget => widget.notifyThemeChange())));
            // notify when files.associations changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(files_1.FILES_ASSOCIATIONS_CONFIG)) {
                    this.widgets.forEach(widget => widget.notifyFileAssociationsChange());
                }
            }));
            // notify when label formatters change
            this._register(this.labelService.onDidChangeFormatters(e => {
                this.widgets.forEach(widget => widget.notifyFormattersChange(e.scheme));
            }));
            // notify when untitled labels change
            this._register(this.textFileService.untitled.onDidChangeLabel(model => {
                this.widgets.forEach(widget => widget.notifyUntitledLabelChange(model.resource));
            }));
        }
        get(index) {
            return this.labels[index];
        }
        create(container, options) {
            const widget = this.instantiationService.createInstance(ResourceLabelWidget, container, options);
            // Only expose a handle to the outside
            const label = {
                element: widget.element,
                onDidRender: widget.onDidRender,
                setLabel: (label, description, options) => widget.setLabel(label, description, options),
                setResource: (label, options) => widget.setResource(label, options),
                setFile: (resource, options) => widget.setFile(resource, options),
                clear: () => widget.clear(),
                dispose: () => this.disposeWidget(widget)
            };
            // Store
            this.labels.push(label);
            this.widgets.push(widget);
            return label;
        }
        disposeWidget(widget) {
            const index = this.widgets.indexOf(widget);
            if (index > -1) {
                this.widgets.splice(index, 1);
                this.labels.splice(index, 1);
            }
            (0, lifecycle_1.dispose)(widget);
        }
        clear() {
            this.widgets = (0, lifecycle_1.dispose)(this.widgets);
            this.labels = [];
        }
        dispose() {
            super.dispose();
            this.clear();
        }
    };
    exports.ResourceLabels = ResourceLabels;
    exports.ResourceLabels = ResourceLabels = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, model_1.IModelService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, language_1.ILanguageService),
        __param(6, decorations_1.IDecorationsService),
        __param(7, themeService_1.IThemeService),
        __param(8, label_1.ILabelService),
        __param(9, textfiles_1.ITextFileService)
    ], ResourceLabels);
    /**
     * Note: please consider to use `ResourceLabels` if you are in need
     * of more than one label for your widget.
     */
    let ResourceLabel = class ResourceLabel extends ResourceLabels {
        get element() { return this.label; }
        constructor(container, options, instantiationService, configurationService, modelService, workspaceService, languageService, decorationsService, themeService, labelService, textFileService) {
            super(exports.DEFAULT_LABELS_CONTAINER, instantiationService, configurationService, modelService, workspaceService, languageService, decorationsService, themeService, labelService, textFileService);
            this.label = this._register(this.create(container, options));
        }
    };
    exports.ResourceLabel = ResourceLabel;
    exports.ResourceLabel = ResourceLabel = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, model_1.IModelService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, language_1.ILanguageService),
        __param(7, decorations_1.IDecorationsService),
        __param(8, themeService_1.IThemeService),
        __param(9, label_1.ILabelService),
        __param(10, textfiles_1.ITextFileService)
    ], ResourceLabel);
    var Redraw;
    (function (Redraw) {
        Redraw[Redraw["Basic"] = 1] = "Basic";
        Redraw[Redraw["Full"] = 2] = "Full";
    })(Redraw || (Redraw = {}));
    let ResourceLabelWidget = class ResourceLabelWidget extends iconLabel_1.IconLabel {
        constructor(container, options, languageService, modelService, decorationsService, labelService, textFileService, contextService, notebookDocumentService) {
            super(container, options);
            this.languageService = languageService;
            this.modelService = modelService;
            this.decorationsService = decorationsService;
            this.labelService = labelService;
            this.textFileService = textFileService;
            this.contextService = contextService;
            this.notebookDocumentService = notebookDocumentService;
            this._onDidRender = this._register(new event_1.Emitter());
            this.onDidRender = this._onDidRender.event;
            this.label = undefined;
            this.decoration = this._register(new lifecycle_1.MutableDisposable());
            this.options = undefined;
            this.computedIconClasses = undefined;
            this.computedLanguageId = undefined;
            this.computedPathLabel = undefined;
            this.computedWorkspaceFolderLabel = undefined;
            this.needsRedraw = undefined;
            this.isHidden = false;
        }
        notifyVisibilityChanged(visible) {
            if (visible === this.isHidden) {
                this.isHidden = !visible;
                if (visible && this.needsRedraw) {
                    this.render({
                        updateIcon: this.needsRedraw === Redraw.Full,
                        updateDecoration: this.needsRedraw === Redraw.Full
                    });
                    this.needsRedraw = undefined;
                }
            }
        }
        notifyModelLanguageChanged(model) {
            this.handleModelEvent(model);
        }
        notifyModelAdded(model) {
            this.handleModelEvent(model);
        }
        handleModelEvent(model) {
            const resource = toResource(this.label);
            if (!resource) {
                return; // only update if resource exists
            }
            if ((0, resources_1.isEqual)(model.uri, resource)) {
                if (this.computedLanguageId !== model.getLanguageId()) {
                    this.computedLanguageId = model.getLanguageId();
                    this.render({ updateIcon: true, updateDecoration: false }); // update if the language id of the model has changed from our last known state
                }
            }
        }
        notifyFileDecorationsChanges(e) {
            if (!this.options) {
                return false;
            }
            const resource = toResource(this.label);
            if (!resource) {
                return false;
            }
            if (this.options.fileDecorations && e.affectsResource(resource)) {
                return this.render({ updateIcon: false, updateDecoration: true });
            }
            return false;
        }
        notifyExtensionsRegistered() {
            this.render({ updateIcon: true, updateDecoration: false });
        }
        notifyThemeChange() {
            this.render({ updateIcon: false, updateDecoration: false });
        }
        notifyFileAssociationsChange() {
            this.render({ updateIcon: true, updateDecoration: false });
        }
        notifyFormattersChange(scheme) {
            if (toResource(this.label)?.scheme === scheme) {
                this.render({ updateIcon: false, updateDecoration: false });
            }
        }
        notifyUntitledLabelChange(resource) {
            if ((0, resources_1.isEqual)(resource, toResource(this.label))) {
                this.render({ updateIcon: false, updateDecoration: false });
            }
        }
        notifyWorkspaceFoldersChange() {
            if (typeof this.computedWorkspaceFolderLabel === 'string') {
                const resource = toResource(this.label);
                if (uri_1.URI.isUri(resource) && this.label?.name === this.computedWorkspaceFolderLabel) {
                    this.setFile(resource, this.options);
                }
            }
        }
        setFile(resource, options) {
            const hideLabel = options?.hideLabel;
            let name;
            if (!hideLabel) {
                if (options?.fileKind === files_1.FileKind.ROOT_FOLDER) {
                    const workspaceFolder = this.contextService.getWorkspaceFolder(resource);
                    if (workspaceFolder) {
                        name = workspaceFolder.name;
                        this.computedWorkspaceFolderLabel = name;
                    }
                }
                if (!name) {
                    name = (0, labels_1.normalizeDriveLetter)((0, resources_1.basenameOrAuthority)(resource));
                }
            }
            let description;
            if (!options?.hidePath) {
                const descriptionCandidate = this.labelService.getUriLabel((0, resources_1.dirname)(resource), { relative: true });
                if (descriptionCandidate && descriptionCandidate !== '.') {
                    // omit description if its not significant: a relative path
                    // of '.' just indicates that there is no parent to the path
                    // https://github.com/microsoft/vscode/issues/208692
                    description = descriptionCandidate;
                }
            }
            this.setResource({ resource, name, description, range: options?.range }, options);
        }
        setResource(label, options = Object.create(null)) {
            const resource = toResource(label);
            const isSideBySideEditor = label?.resource && !uri_1.URI.isUri(label.resource);
            if (!options.forceLabel && !isSideBySideEditor && resource?.scheme === network_1.Schemas.untitled) {
                // Untitled labels are very dynamic because they may change
                // whenever the content changes (unless a path is associated).
                // As such we always ask the actual editor for it's name and
                // description to get latest in case name/description are
                // provided. If they are not provided from the label we got
                // we assume that the client does not want to display them
                // and as such do not override.
                //
                // We do not touch the label if it represents a primary-secondary
                // because in that case we expect it to carry a proper label
                // and description.
                const untitledModel = this.textFileService.untitled.get(resource);
                if (untitledModel && !untitledModel.hasAssociatedFilePath) {
                    if (typeof label.name === 'string') {
                        label.name = untitledModel.name;
                    }
                    if (typeof label.description === 'string') {
                        const untitledDescription = untitledModel.resource.path;
                        if (label.name !== untitledDescription) {
                            label.description = untitledDescription;
                        }
                        else {
                            label.description = undefined;
                        }
                    }
                    const untitledTitle = untitledModel.resource.path;
                    if (untitledModel.name !== untitledTitle) {
                        options.title = `${untitledModel.name} • ${untitledTitle}`;
                    }
                    else {
                        options.title = untitledTitle;
                    }
                }
            }
            if (!options.forceLabel && !isSideBySideEditor && resource?.scheme === network_1.Schemas.vscodeNotebookCell) {
                // Notebook cells are embeded in a notebook document
                // As such we always ask the actual notebook document
                // for its position in the document.
                const notebookDocument = this.notebookDocumentService.getNotebook(resource);
                const cellIndex = notebookDocument?.getCellIndex(resource);
                if (notebookDocument && cellIndex !== undefined && typeof label.name === 'string') {
                    options.title = (0, nls_1.localize)('notebookCellLabel', "{0} • Cell {1}", label.name, `${cellIndex + 1}`);
                }
                if (typeof label.name === 'string' && notebookDocument && cellIndex !== undefined && typeof label.name === 'string') {
                    label.name = (0, nls_1.localize)('notebookCellLabel', "{0} • Cell {1}", label.name, `${cellIndex + 1}`);
                }
            }
            const hasResourceChanged = this.hasResourceChanged(label);
            const hasPathLabelChanged = hasResourceChanged || this.hasPathLabelChanged(label);
            const hasFileKindChanged = this.hasFileKindChanged(options);
            const hasIconChanged = this.hasIconChanged(options);
            this.label = label;
            this.options = options;
            if (hasResourceChanged) {
                this.computedLanguageId = undefined; // reset computed language since resource changed
            }
            if (hasPathLabelChanged) {
                this.computedPathLabel = undefined; // reset path label due to resource/path-label change
            }
            this.render({
                updateIcon: hasResourceChanged || hasFileKindChanged || hasIconChanged,
                updateDecoration: hasResourceChanged || hasFileKindChanged
            });
        }
        hasFileKindChanged(newOptions) {
            const newFileKind = newOptions?.fileKind;
            const oldFileKind = this.options?.fileKind;
            return newFileKind !== oldFileKind; // same resource but different kind (file, folder)
        }
        hasResourceChanged(newLabel) {
            const newResource = toResource(newLabel);
            const oldResource = toResource(this.label);
            if (newResource && oldResource) {
                return newResource.toString() !== oldResource.toString();
            }
            if (!newResource && !oldResource) {
                return false;
            }
            return true;
        }
        hasPathLabelChanged(newLabel) {
            const newResource = toResource(newLabel);
            return !!newResource && this.computedPathLabel !== this.labelService.getUriLabel(newResource);
        }
        hasIconChanged(newOptions) {
            return this.options?.icon !== newOptions?.icon;
        }
        clear() {
            this.label = undefined;
            this.options = undefined;
            this.computedLanguageId = undefined;
            this.computedIconClasses = undefined;
            this.computedPathLabel = undefined;
            this.setLabel('');
        }
        render(options) {
            if (this.isHidden) {
                if (this.needsRedraw !== Redraw.Full) {
                    this.needsRedraw = (options.updateIcon || options.updateDecoration) ? Redraw.Full : Redraw.Basic;
                }
                return false;
            }
            if (options.updateIcon) {
                this.computedIconClasses = undefined;
            }
            if (!this.label) {
                return false;
            }
            const iconLabelOptions = {
                title: '',
                italic: this.options?.italic,
                strikethrough: this.options?.strikethrough,
                matches: this.options?.matches,
                descriptionMatches: this.options?.descriptionMatches,
                extraClasses: [],
                separator: this.options?.separator,
                domId: this.options?.domId,
                disabledCommand: this.options?.disabledCommand,
                labelEscapeNewLines: this.options?.labelEscapeNewLines,
                descriptionTitle: this.options?.descriptionTitle,
            };
            const resource = toResource(this.label);
            if (this.options?.title !== undefined) {
                iconLabelOptions.title = this.options.title;
            }
            if (resource && resource.scheme !== network_1.Schemas.data /* do not accidentally inline Data URIs */
                && ((!this.options?.title)
                    || ((typeof this.options.title !== 'string') && !this.options.title.markdownNotSupportedFallback))) {
                if (!this.computedPathLabel) {
                    this.computedPathLabel = this.labelService.getUriLabel(resource);
                }
                if (!iconLabelOptions.title || (typeof iconLabelOptions.title === 'string')) {
                    iconLabelOptions.title = this.computedPathLabel;
                }
                else if (!iconLabelOptions.title.markdownNotSupportedFallback) {
                    iconLabelOptions.title.markdownNotSupportedFallback = this.computedPathLabel;
                }
            }
            if (this.options && !this.options.hideIcon) {
                if (!this.computedIconClasses) {
                    this.computedIconClasses = (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, resource, this.options.fileKind, this.options.icon);
                }
                iconLabelOptions.extraClasses = this.computedIconClasses.slice(0);
            }
            if (this.options?.extraClasses) {
                iconLabelOptions.extraClasses.push(...this.options.extraClasses);
            }
            if (this.options?.fileDecorations && resource) {
                if (options.updateDecoration) {
                    this.decoration.value = this.decorationsService.getDecoration(resource, this.options.fileKind !== files_1.FileKind.FILE);
                }
                const decoration = this.decoration.value;
                if (decoration) {
                    if (decoration.tooltip) {
                        if (typeof iconLabelOptions.title === 'string') {
                            iconLabelOptions.title = `${iconLabelOptions.title} • ${decoration.tooltip}`;
                        }
                        else if (typeof iconLabelOptions.title?.markdown === 'string') {
                            const title = `${iconLabelOptions.title.markdown} • ${decoration.tooltip}`;
                            iconLabelOptions.title = { markdown: title, markdownNotSupportedFallback: title };
                        }
                    }
                    if (decoration.strikethrough) {
                        iconLabelOptions.strikethrough = true;
                    }
                    if (this.options.fileDecorations.colors) {
                        iconLabelOptions.extraClasses.push(decoration.labelClassName);
                    }
                    if (this.options.fileDecorations.badges) {
                        iconLabelOptions.extraClasses.push(decoration.badgeClassName);
                        iconLabelOptions.extraClasses.push(decoration.iconClassName);
                    }
                }
            }
            if (this.label.range) {
                iconLabelOptions.suffix = this.label.range.startLineNumber !== this.label.range.endLineNumber ?
                    `:${this.label.range.startLineNumber}-${this.label.range.endLineNumber}` :
                    `:${this.label.range.startLineNumber}`;
            }
            this.setLabel(this.label.name ?? '', this.label.description, iconLabelOptions);
            this._onDidRender.fire();
            return true;
        }
        dispose() {
            super.dispose();
            this.label = undefined;
            this.options = undefined;
            this.computedLanguageId = undefined;
            this.computedIconClasses = undefined;
            this.computedPathLabel = undefined;
            this.computedWorkspaceFolderLabel = undefined;
        }
    };
    ResourceLabelWidget = __decorate([
        __param(2, language_1.ILanguageService),
        __param(3, model_1.IModelService),
        __param(4, decorations_1.IDecorationsService),
        __param(5, label_1.ILabelService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, workspace_1.IWorkspaceContextService),
        __param(8, notebookDocumentService_1.INotebookDocumentService)
    ], ResourceLabelWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFiZWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvbGFiZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlDaEcsU0FBUyxVQUFVLENBQUMsS0FBc0M7UUFDekQsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMvQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQy9CLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUN2QixDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztJQUMvQixDQUFDO0lBZ0VZLFFBQUEsd0JBQXdCLEdBQTZCO1FBQ2pFLHFCQUFxQixFQUFFLGFBQUssQ0FBQyxJQUFJO0tBQ2pDLENBQUM7SUFFSyxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsc0JBQVU7UUFRN0MsWUFDQyxTQUFtQyxFQUNaLG9CQUE0RCxFQUM1RCxvQkFBNEQsRUFDcEUsWUFBNEMsRUFDakMsZ0JBQTJELEVBQ25FLGVBQWtELEVBQy9DLGtCQUF3RCxFQUM5RCxZQUE0QyxFQUM1QyxZQUE0QyxFQUN6QyxlQUFrRDtZQUVwRSxLQUFLLEVBQUUsQ0FBQztZQVZnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDaEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUEwQjtZQUNsRCxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDOUIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM3QyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUMzQixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN4QixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFoQnBELDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3RFLDJCQUFzQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUM7WUFFN0QsWUFBTyxHQUEwQixFQUFFLENBQUM7WUFDcEMsV0FBTSxHQUFxQixFQUFFLENBQUM7WUFnQnJDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRU8saUJBQWlCLENBQUMsU0FBbUM7WUFFNUQsaUNBQWlDO1lBQ2pDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUN4RCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSix1RUFBdUU7WUFDdkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTVILHFDQUFxQztZQUNyQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzNELElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNsQixPQUFPLENBQUMsa0NBQWtDO2dCQUMzQyxDQUFDO2dCQUVELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzVFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiw2QkFBNkI7WUFDN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDckQsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDaEIsT0FBTyxDQUFDLGtDQUFrQztnQkFDM0MsQ0FBQztnQkFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSix3Q0FBd0M7WUFDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsMkJBQTJCLENBQUMsR0FBRyxFQUFFO2dCQUNyRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUM7WUFDdkUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLHNDQUFzQztZQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakUsSUFBSSwwQkFBMEIsR0FBRyxLQUFLLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUM3QixJQUFJLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM1QywwQkFBMEIsR0FBRyxJQUFJLENBQUM7b0JBQ25DLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSwwQkFBMEIsRUFBRSxDQUFDO29CQUNoQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosNEJBQTRCO1lBQzVCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTFILHlDQUF5QztZQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDckUsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMsaUNBQXlCLENBQUMsRUFBRSxDQUFDO29CQUN2RCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZFLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosc0NBQXNDO1lBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDekUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLHFDQUFxQztZQUNyQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNyRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNsRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELEdBQUcsQ0FBQyxLQUFhO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRUQsTUFBTSxDQUFDLFNBQXNCLEVBQUUsT0FBbUM7WUFDakUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFakcsc0NBQXNDO1lBQ3RDLE1BQU0sS0FBSyxHQUFtQjtnQkFDN0IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO2dCQUN2QixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7Z0JBQy9CLFFBQVEsRUFBRSxDQUFDLEtBQWEsRUFBRSxXQUFvQixFQUFFLE9BQWdDLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUM7Z0JBQ2pJLFdBQVcsRUFBRSxDQUFDLEtBQTBCLEVBQUUsT0FBK0IsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDO2dCQUNoSCxPQUFPLEVBQUUsQ0FBQyxRQUFhLEVBQUUsT0FBMkIsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDO2dCQUMxRixLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtnQkFDM0IsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDO2FBQ3pDLENBQUM7WUFFRixRQUFRO1lBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFMUIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sYUFBYSxDQUFDLE1BQTJCO1lBQ2hELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlCLENBQUM7WUFFRCxJQUFBLG1CQUFPLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDakIsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDbEIsQ0FBQztRQUVRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFaEIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2QsQ0FBQztLQUNELENBQUE7SUExSVksd0NBQWM7NkJBQWQsY0FBYztRQVV4QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxvQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSw0QkFBZ0IsQ0FBQTtPQWxCTixjQUFjLENBMEkxQjtJQUVEOzs7T0FHRztJQUNJLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSxjQUFjO1FBR2hELElBQUksT0FBTyxLQUFxQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXBELFlBQ0MsU0FBc0IsRUFDdEIsT0FBOEMsRUFDdkIsb0JBQTJDLEVBQzNDLG9CQUEyQyxFQUNuRCxZQUEyQixFQUNoQixnQkFBMEMsRUFDbEQsZUFBaUMsRUFDOUIsa0JBQXVDLEVBQzdDLFlBQTJCLEVBQzNCLFlBQTJCLEVBQ3hCLGVBQWlDO1lBRW5ELEtBQUssQ0FBQyxnQ0FBd0IsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFOUwsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQztLQUNELENBQUE7SUF0Qlksc0NBQWE7NEJBQWIsYUFBYTtRQVF2QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxvQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsWUFBQSw0QkFBZ0IsQ0FBQTtPQWhCTixhQUFhLENBc0J6QjtJQUVELElBQUssTUFHSjtJQUhELFdBQUssTUFBTTtRQUNWLHFDQUFTLENBQUE7UUFDVCxtQ0FBUSxDQUFBO0lBQ1QsQ0FBQyxFQUhJLE1BQU0sS0FBTixNQUFNLFFBR1Y7SUFFRCxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHFCQUFTO1FBaUIxQyxZQUNDLFNBQXNCLEVBQ3RCLE9BQThDLEVBQzVCLGVBQWtELEVBQ3JELFlBQTRDLEVBQ3RDLGtCQUF3RCxFQUM5RCxZQUE0QyxFQUN6QyxlQUFrRCxFQUMxQyxjQUF5RCxFQUN6RCx1QkFBa0U7WUFFNUYsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQVJTLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNwQyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNyQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzdDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3hCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUN6QixtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDeEMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQXhCNUUsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMzRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBRXZDLFVBQUssR0FBb0MsU0FBUyxDQUFDO1lBQzFDLGVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQWUsQ0FBQyxDQUFDO1lBQzNFLFlBQU8sR0FBc0MsU0FBUyxDQUFDO1lBRXZELHdCQUFtQixHQUF5QixTQUFTLENBQUM7WUFDdEQsdUJBQWtCLEdBQXVCLFNBQVMsQ0FBQztZQUNuRCxzQkFBaUIsR0FBdUIsU0FBUyxDQUFDO1lBQ2xELGlDQUE0QixHQUF1QixTQUFTLENBQUM7WUFFN0QsZ0JBQVcsR0FBdUIsU0FBUyxDQUFDO1lBQzVDLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFjbEMsQ0FBQztRQUVELHVCQUF1QixDQUFDLE9BQWdCO1lBQ3ZDLElBQUksT0FBTyxLQUFLLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLE9BQU8sQ0FBQztnQkFFekIsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDO3dCQUNYLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxLQUFLLE1BQU0sQ0FBQyxJQUFJO3dCQUM1QyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsV0FBVyxLQUFLLE1BQU0sQ0FBQyxJQUFJO3FCQUNsRCxDQUFDLENBQUM7b0JBRUgsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7Z0JBQzlCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELDBCQUEwQixDQUFDLEtBQWlCO1lBQzNDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsZ0JBQWdCLENBQUMsS0FBaUI7WUFDakMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxLQUFpQjtZQUN6QyxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPLENBQUMsaUNBQWlDO1lBQzFDLENBQUM7WUFFRCxJQUFJLElBQUEsbUJBQU8sRUFBQyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksSUFBSSxDQUFDLGtCQUFrQixLQUFLLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO29CQUN2RCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsK0VBQStFO2dCQUM1SSxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCw0QkFBNEIsQ0FBQyxDQUFpQztZQUM3RCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCwwQkFBMEI7WUFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsaUJBQWlCO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELDRCQUE0QjtZQUMzQixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxzQkFBc0IsQ0FBQyxNQUFjO1lBQ3BDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxNQUFNLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDN0QsQ0FBQztRQUNGLENBQUM7UUFFRCx5QkFBeUIsQ0FBQyxRQUFhO1lBQ3RDLElBQUksSUFBQSxtQkFBTyxFQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUM3RCxDQUFDO1FBQ0YsQ0FBQztRQUVELDRCQUE0QjtZQUMzQixJQUFJLE9BQU8sSUFBSSxDQUFDLDRCQUE0QixLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMzRCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEtBQUssSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7b0JBQ25GLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxDQUFDLFFBQWEsRUFBRSxPQUEyQjtZQUNqRCxNQUFNLFNBQVMsR0FBRyxPQUFPLEVBQUUsU0FBUyxDQUFDO1lBQ3JDLElBQUksSUFBd0IsQ0FBQztZQUM3QixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksT0FBTyxFQUFFLFFBQVEsS0FBSyxnQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNoRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN6RSxJQUFJLGVBQWUsRUFBRSxDQUFDO3dCQUNyQixJQUFJLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQzt3QkFDNUIsSUFBSSxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQztvQkFDMUMsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxJQUFJLEdBQUcsSUFBQSw2QkFBb0IsRUFBQyxJQUFBLCtCQUFtQixFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxXQUErQixDQUFDO1lBQ3BDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBQSxtQkFBTyxFQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2xHLElBQUksb0JBQW9CLElBQUksb0JBQW9CLEtBQUssR0FBRyxFQUFFLENBQUM7b0JBQzFELDJEQUEyRDtvQkFDM0QsNERBQTREO29CQUM1RCxvREFBb0Q7b0JBQ3BELFdBQVcsR0FBRyxvQkFBb0IsQ0FBQztnQkFDcEMsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBRUQsV0FBVyxDQUFDLEtBQTBCLEVBQUUsVUFBaUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDM0YsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLE1BQU0sa0JBQWtCLEdBQUcsS0FBSyxFQUFFLFFBQVEsSUFBSSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXpFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsa0JBQWtCLElBQUksUUFBUSxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN6RiwyREFBMkQ7Z0JBQzNELDhEQUE4RDtnQkFDOUQsNERBQTREO2dCQUM1RCx5REFBeUQ7Z0JBQ3pELDJEQUEyRDtnQkFDM0QsMERBQTBEO2dCQUMxRCwrQkFBK0I7Z0JBQy9CLEVBQUU7Z0JBQ0YsaUVBQWlFO2dCQUNqRSw0REFBNEQ7Z0JBQzVELG1CQUFtQjtnQkFDbkIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLGFBQWEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUMzRCxJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDcEMsS0FBSyxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDO29CQUNqQyxDQUFDO29CQUVELElBQUksT0FBTyxLQUFLLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUMzQyxNQUFNLG1CQUFtQixHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO3dCQUN4RCxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssbUJBQW1CLEVBQUUsQ0FBQzs0QkFDeEMsS0FBSyxDQUFDLFdBQVcsR0FBRyxtQkFBbUIsQ0FBQzt3QkFDekMsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLEtBQUssQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO3dCQUMvQixDQUFDO29CQUNGLENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7b0JBQ2xELElBQUksYUFBYSxDQUFDLElBQUksS0FBSyxhQUFhLEVBQUUsQ0FBQzt3QkFDMUMsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLGFBQWEsQ0FBQyxJQUFJLE1BQU0sYUFBYSxFQUFFLENBQUM7b0JBQzVELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxPQUFPLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQztvQkFDL0IsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsa0JBQWtCLElBQUksUUFBUSxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ25HLG9EQUFvRDtnQkFDcEQscURBQXFEO2dCQUNyRCxvQ0FBb0M7Z0JBQ3BDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLGdCQUFnQixJQUFJLFNBQVMsS0FBSyxTQUFTLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNuRixPQUFPLENBQUMsS0FBSyxHQUFHLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDakcsQ0FBQztnQkFFRCxJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksZ0JBQWdCLElBQUksU0FBUyxLQUFLLFNBQVMsSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3JILEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM5RixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFELE1BQU0sbUJBQW1CLEdBQUcsa0JBQWtCLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzVELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFcEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFFdkIsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDLENBQUMsaURBQWlEO1lBQ3ZGLENBQUM7WUFFRCxJQUFJLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUMsQ0FBQyxxREFBcUQ7WUFDMUYsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ1gsVUFBVSxFQUFFLGtCQUFrQixJQUFJLGtCQUFrQixJQUFJLGNBQWM7Z0JBQ3RFLGdCQUFnQixFQUFFLGtCQUFrQixJQUFJLGtCQUFrQjthQUMxRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sa0JBQWtCLENBQUMsVUFBa0M7WUFDNUQsTUFBTSxXQUFXLEdBQUcsVUFBVSxFQUFFLFFBQVEsQ0FBQztZQUN6QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztZQUUzQyxPQUFPLFdBQVcsS0FBSyxXQUFXLENBQUMsQ0FBQyxrREFBa0Q7UUFDdkYsQ0FBQztRQUVPLGtCQUFrQixDQUFDLFFBQTZCO1lBQ3ZELE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QyxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTNDLElBQUksV0FBVyxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDMUQsQ0FBQztZQUVELElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU8sbUJBQW1CLENBQUMsUUFBNkI7WUFDeEQsTUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXpDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0YsQ0FBQztRQUVPLGNBQWMsQ0FBQyxVQUFrQztZQUN4RCxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxLQUFLLFVBQVUsRUFBRSxJQUFJLENBQUM7UUFDaEQsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztZQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQztZQUN6QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxTQUFTLENBQUM7WUFDckMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztZQUVuQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ25CLENBQUM7UUFFTyxNQUFNLENBQUMsT0FBMkQ7WUFDekUsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25CLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNsRyxDQUFDO2dCQUVELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDO1lBQ3RDLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUF3RDtnQkFDN0UsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTTtnQkFDNUIsYUFBYSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsYUFBYTtnQkFDMUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTztnQkFDOUIsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxrQkFBa0I7Z0JBQ3BELFlBQVksRUFBRSxFQUFFO2dCQUNoQixTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTO2dCQUNsQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLO2dCQUMxQixlQUFlLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxlQUFlO2dCQUM5QyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLG1CQUFtQjtnQkFDdEQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0I7YUFDaEQsQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFeEMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdkMsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQzdDLENBQUM7WUFFRCxJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxDQUFDLDBDQUEwQzttQkFDdkYsQ0FDRixDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUM7dUJBQ25CLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FDakcsRUFBRSxDQUFDO2dCQUVKLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRSxDQUFDO2dCQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLGdCQUFnQixDQUFDLEtBQUssS0FBSyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUM3RSxnQkFBZ0IsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO2dCQUNqRCxDQUFDO3FCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztvQkFDakUsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztnQkFDOUUsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQy9CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFBLCtCQUFjLEVBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4SSxDQUFDO2dCQUVELGdCQUFnQixDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUM7Z0JBQ2hDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsZUFBZSxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsS0FBSyxnQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsSCxDQUFDO2dCQUVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2dCQUN6QyxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxPQUFPLGdCQUFnQixDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDaEQsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxNQUFNLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDOUUsQ0FBQzs2QkFBTSxJQUFJLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDakUsTUFBTSxLQUFLLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxNQUFNLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDM0UsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw0QkFBNEIsRUFBRSxLQUFLLEVBQUUsQ0FBQzt3QkFDbkYsQ0FBQztvQkFDRixDQUFDO29CQUVELElBQUksVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUM5QixnQkFBZ0IsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO29CQUN2QyxDQUFDO29CQUVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3pDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUMvRCxDQUFDO29CQUVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3pDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO3dCQUM5RCxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDOUQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdEIsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDOUYsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztvQkFDMUUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN6QyxDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUUvRSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFDdkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7WUFDekIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztZQUNwQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7WUFDbkMsSUFBSSxDQUFDLDRCQUE0QixHQUFHLFNBQVMsQ0FBQztRQUMvQyxDQUFDO0tBQ0QsQ0FBQTtJQXBZSyxtQkFBbUI7UUFvQnRCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDRCQUFnQixDQUFBO1FBQ2hCLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxrREFBd0IsQ0FBQTtPQTFCckIsbUJBQW1CLENBb1l4QiJ9