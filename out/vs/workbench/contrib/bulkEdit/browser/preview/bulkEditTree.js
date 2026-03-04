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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/base/common/filters", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/editor/common/core/range", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/editor/common/model/textModel", "vs/workbench/contrib/bulkEdit/browser/preview/bulkEditPreview", "vs/platform/files/common/files", "vs/nls", "vs/platform/label/common/label", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/resources", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/undoRedo/common/undoRedo", "vs/editor/browser/services/bulkEditService", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/language", "vs/editor/common/languages/modesRegistry", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, resolverService_1, filters_1, highlightedLabel_1, range_1, dom, lifecycle_1, textModel_1, bulkEditPreview_1, files_1, nls_1, label_1, iconLabel_1, resources_1, themeService_1, themables_1, strings_1, uri_1, undoRedo_1, bulkEditService_1, languageConfigurationRegistry_1, language_1, modesRegistry_1, snippetParser_1) {
    "use strict";
    var CategoryElementRenderer_1, FileElementRenderer_1, TextEditElementRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditNaviLabelProvider = exports.BulkEditDelegate = exports.TextEditElementRenderer = exports.FileElementRenderer = exports.CategoryElementRenderer = exports.BulkEditIdentityProvider = exports.BulkEditAccessibilityProvider = exports.BulkEditSorter = exports.BulkEditDataSource = exports.TextEditElement = exports.FileElement = exports.CategoryElement = void 0;
    exports.compareBulkFileOperations = compareBulkFileOperations;
    class CategoryElement {
        constructor(parent, category) {
            this.parent = parent;
            this.category = category;
        }
        isChecked() {
            const model = this.parent;
            let checked = true;
            for (const file of this.category.fileOperations) {
                for (const edit of file.originalEdits.values()) {
                    checked = checked && model.checked.isChecked(edit);
                }
            }
            return checked;
        }
        setChecked(value) {
            const model = this.parent;
            for (const file of this.category.fileOperations) {
                for (const edit of file.originalEdits.values()) {
                    model.checked.updateChecked(edit, value);
                }
            }
        }
    }
    exports.CategoryElement = CategoryElement;
    class FileElement {
        constructor(parent, edit) {
            this.parent = parent;
            this.edit = edit;
        }
        isChecked() {
            const model = this.parent instanceof CategoryElement ? this.parent.parent : this.parent;
            let checked = true;
            // only text edit children -> reflect children state
            if (this.edit.type === 1 /* BulkFileOperationType.TextEdit */) {
                checked = !this.edit.textEdits.every(edit => !model.checked.isChecked(edit.textEdit));
            }
            // multiple file edits -> reflect single state
            for (const edit of this.edit.originalEdits.values()) {
                if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    checked = checked && model.checked.isChecked(edit);
                }
            }
            // multiple categories and text change -> read all elements
            if (this.parent instanceof CategoryElement && this.edit.type === 1 /* BulkFileOperationType.TextEdit */) {
                for (const category of model.categories) {
                    for (const file of category.fileOperations) {
                        if (file.uri.toString() === this.edit.uri.toString()) {
                            for (const edit of file.originalEdits.values()) {
                                if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                                    checked = checked && model.checked.isChecked(edit);
                                }
                            }
                        }
                    }
                }
            }
            return checked;
        }
        setChecked(value) {
            const model = this.parent instanceof CategoryElement ? this.parent.parent : this.parent;
            for (const edit of this.edit.originalEdits.values()) {
                model.checked.updateChecked(edit, value);
            }
            // multiple categories and file change -> update all elements
            if (this.parent instanceof CategoryElement && this.edit.type !== 1 /* BulkFileOperationType.TextEdit */) {
                for (const category of model.categories) {
                    for (const file of category.fileOperations) {
                        if (file.uri.toString() === this.edit.uri.toString()) {
                            for (const edit of file.originalEdits.values()) {
                                model.checked.updateChecked(edit, value);
                            }
                        }
                    }
                }
            }
        }
        isDisabled() {
            if (this.parent instanceof CategoryElement && this.edit.type === 1 /* BulkFileOperationType.TextEdit */) {
                const model = this.parent.parent;
                let checked = true;
                for (const category of model.categories) {
                    for (const file of category.fileOperations) {
                        if (file.uri.toString() === this.edit.uri.toString()) {
                            for (const edit of file.originalEdits.values()) {
                                if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                                    checked = checked && model.checked.isChecked(edit);
                                }
                            }
                        }
                    }
                }
                return !checked;
            }
            return false;
        }
    }
    exports.FileElement = FileElement;
    class TextEditElement {
        constructor(parent, idx, edit, prefix, selecting, inserting, suffix) {
            this.parent = parent;
            this.idx = idx;
            this.edit = edit;
            this.prefix = prefix;
            this.selecting = selecting;
            this.inserting = inserting;
            this.suffix = suffix;
        }
        isChecked() {
            let model = this.parent.parent;
            if (model instanceof CategoryElement) {
                model = model.parent;
            }
            return model.checked.isChecked(this.edit.textEdit);
        }
        setChecked(value) {
            let model = this.parent.parent;
            if (model instanceof CategoryElement) {
                model = model.parent;
            }
            // check/uncheck this element
            model.checked.updateChecked(this.edit.textEdit, value);
            // make sure parent is checked when this element is checked...
            if (value) {
                for (const edit of this.parent.edit.originalEdits.values()) {
                    if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                        model.checked.updateChecked(edit, value);
                    }
                }
            }
        }
        isDisabled() {
            return this.parent.isDisabled();
        }
    }
    exports.TextEditElement = TextEditElement;
    // --- DATA SOURCE
    let BulkEditDataSource = class BulkEditDataSource {
        constructor(_textModelService, _undoRedoService, _languageService, _languageConfigurationService) {
            this._textModelService = _textModelService;
            this._undoRedoService = _undoRedoService;
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this.groupByFile = true;
        }
        hasChildren(element) {
            if (element instanceof FileElement) {
                return element.edit.textEdits.length > 0;
            }
            if (element instanceof TextEditElement) {
                return false;
            }
            return true;
        }
        async getChildren(element) {
            // root -> file/text edits
            if (element instanceof bulkEditPreview_1.BulkFileOperations) {
                return this.groupByFile
                    ? element.fileOperations.map(op => new FileElement(element, op))
                    : element.categories.map(cat => new CategoryElement(element, cat));
            }
            // category
            if (element instanceof CategoryElement) {
                return Array.from(element.category.fileOperations, op => new FileElement(element, op));
            }
            // file: text edit
            if (element instanceof FileElement && element.edit.textEdits.length > 0) {
                // const previewUri = BulkEditPreviewProvider.asPreviewUri(element.edit.resource);
                let textModel;
                let textModelDisposable;
                try {
                    const ref = await this._textModelService.createModelReference(element.edit.uri);
                    textModel = ref.object.textEditorModel;
                    textModelDisposable = ref;
                }
                catch {
                    textModel = new textModel_1.TextModel('', modesRegistry_1.PLAINTEXT_LANGUAGE_ID, textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, null, this._undoRedoService, this._languageService, this._languageConfigurationService);
                    textModelDisposable = textModel;
                }
                const result = element.edit.textEdits.map((edit, idx) => {
                    const range = textModel.validateRange(edit.textEdit.textEdit.range);
                    //prefix-math
                    const startTokens = textModel.tokenization.getLineTokens(range.startLineNumber);
                    let prefixLen = 23; // default value for the no tokens/grammar case
                    for (let idx = startTokens.findTokenIndexAtOffset(range.startColumn - 1) - 1; prefixLen < 50 && idx >= 0; idx--) {
                        prefixLen = range.startColumn - startTokens.getStartOffset(idx);
                    }
                    //suffix-math
                    const endTokens = textModel.tokenization.getLineTokens(range.endLineNumber);
                    let suffixLen = 0;
                    for (let idx = endTokens.findTokenIndexAtOffset(range.endColumn - 1); suffixLen < 50 && idx < endTokens.getCount(); idx++) {
                        suffixLen += endTokens.getEndOffset(idx) - endTokens.getStartOffset(idx);
                    }
                    return new TextEditElement(element, idx, edit, textModel.getValueInRange(new range_1.Range(range.startLineNumber, range.startColumn - prefixLen, range.startLineNumber, range.startColumn)), textModel.getValueInRange(range), !edit.textEdit.textEdit.insertAsSnippet ? edit.textEdit.textEdit.text : snippetParser_1.SnippetParser.asInsertText(edit.textEdit.textEdit.text), textModel.getValueInRange(new range_1.Range(range.endLineNumber, range.endColumn, range.endLineNumber, range.endColumn + suffixLen)));
                });
                textModelDisposable.dispose();
                return result;
            }
            return [];
        }
    };
    exports.BulkEditDataSource = BulkEditDataSource;
    exports.BulkEditDataSource = BulkEditDataSource = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, undoRedo_1.IUndoRedoService),
        __param(2, language_1.ILanguageService),
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], BulkEditDataSource);
    class BulkEditSorter {
        compare(a, b) {
            if (a instanceof FileElement && b instanceof FileElement) {
                return compareBulkFileOperations(a.edit, b.edit);
            }
            if (a instanceof TextEditElement && b instanceof TextEditElement) {
                return range_1.Range.compareRangesUsingStarts(a.edit.textEdit.textEdit.range, b.edit.textEdit.textEdit.range);
            }
            return 0;
        }
    }
    exports.BulkEditSorter = BulkEditSorter;
    function compareBulkFileOperations(a, b) {
        return (0, strings_1.compare)(a.uri.toString(), b.uri.toString());
    }
    // --- ACCESSI
    let BulkEditAccessibilityProvider = class BulkEditAccessibilityProvider {
        constructor(_labelService) {
            this._labelService = _labelService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('bulkEdit', "Bulk Edit");
        }
        getRole(_element) {
            return 'checkbox';
        }
        getAriaLabel(element) {
            if (element instanceof FileElement) {
                if (element.edit.textEdits.length > 0) {
                    if (element.edit.type & 8 /* BulkFileOperationType.Rename */ && element.edit.newUri) {
                        return (0, nls_1.localize)('aria.renameAndEdit', "Renaming {0} to {1}, also making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }), this._labelService.getUriLabel(element.edit.newUri, { relative: true }));
                    }
                    else if (element.edit.type & 2 /* BulkFileOperationType.Create */) {
                        return (0, nls_1.localize)('aria.createAndEdit', "Creating {0}, also making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                    else if (element.edit.type & 4 /* BulkFileOperationType.Delete */) {
                        return (0, nls_1.localize)('aria.deleteAndEdit', "Deleting {0}, also making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                    else {
                        return (0, nls_1.localize)('aria.editOnly', "{0}, making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                }
                else {
                    if (element.edit.type & 8 /* BulkFileOperationType.Rename */ && element.edit.newUri) {
                        return (0, nls_1.localize)('aria.rename', "Renaming {0} to {1}", this._labelService.getUriLabel(element.edit.uri, { relative: true }), this._labelService.getUriLabel(element.edit.newUri, { relative: true }));
                    }
                    else if (element.edit.type & 2 /* BulkFileOperationType.Create */) {
                        return (0, nls_1.localize)('aria.create', "Creating {0}", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                    else if (element.edit.type & 4 /* BulkFileOperationType.Delete */) {
                        return (0, nls_1.localize)('aria.delete', "Deleting {0}", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                }
            }
            if (element instanceof TextEditElement) {
                if (element.selecting.length > 0 && element.inserting.length > 0) {
                    // edit: replace
                    return (0, nls_1.localize)('aria.replace', "line {0}, replacing {1} with {2}", element.edit.textEdit.textEdit.range.startLineNumber, element.selecting, element.inserting);
                }
                else if (element.selecting.length > 0 && element.inserting.length === 0) {
                    // edit: delete
                    return (0, nls_1.localize)('aria.del', "line {0}, removing {1}", element.edit.textEdit.textEdit.range.startLineNumber, element.selecting);
                }
                else if (element.selecting.length === 0 && element.inserting.length > 0) {
                    // edit: insert
                    return (0, nls_1.localize)('aria.insert', "line {0}, inserting {1}", element.edit.textEdit.textEdit.range.startLineNumber, element.selecting);
                }
            }
            return null;
        }
    };
    exports.BulkEditAccessibilityProvider = BulkEditAccessibilityProvider;
    exports.BulkEditAccessibilityProvider = BulkEditAccessibilityProvider = __decorate([
        __param(0, label_1.ILabelService)
    ], BulkEditAccessibilityProvider);
    // --- IDENT
    class BulkEditIdentityProvider {
        getId(element) {
            if (element instanceof FileElement) {
                return element.edit.uri + (element.parent instanceof CategoryElement ? JSON.stringify(element.parent.category.metadata) : '');
            }
            else if (element instanceof TextEditElement) {
                return element.parent.edit.uri.toString() + element.idx;
            }
            else {
                return JSON.stringify(element.category.metadata);
            }
        }
    }
    exports.BulkEditIdentityProvider = BulkEditIdentityProvider;
    // --- RENDERER
    class CategoryElementTemplate {
        constructor(container) {
            container.classList.add('category');
            this.icon = document.createElement('div');
            container.appendChild(this.icon);
            this.label = new iconLabel_1.IconLabel(container);
        }
    }
    let CategoryElementRenderer = class CategoryElementRenderer {
        static { CategoryElementRenderer_1 = this; }
        static { this.id = 'CategoryElementRenderer'; }
        constructor(_themeService) {
            this._themeService = _themeService;
            this.templateId = CategoryElementRenderer_1.id;
        }
        renderTemplate(container) {
            return new CategoryElementTemplate(container);
        }
        renderElement(node, _index, template) {
            template.icon.style.setProperty('--background-dark', null);
            template.icon.style.setProperty('--background-light', null);
            template.icon.style.color = '';
            const { metadata } = node.element.category;
            if (themables_1.ThemeIcon.isThemeIcon(metadata.iconPath)) {
                // css
                const className = themables_1.ThemeIcon.asClassName(metadata.iconPath);
                template.icon.className = className ? `theme-icon ${className}` : '';
                template.icon.style.color = metadata.iconPath.color ? this._themeService.getColorTheme().getColor(metadata.iconPath.color.id)?.toString() ?? '' : '';
            }
            else if (uri_1.URI.isUri(metadata.iconPath)) {
                // background-image
                template.icon.className = 'uri-icon';
                template.icon.style.setProperty('--background-dark', dom.asCSSUrl(metadata.iconPath));
                template.icon.style.setProperty('--background-light', dom.asCSSUrl(metadata.iconPath));
            }
            else if (metadata.iconPath) {
                // background-image
                template.icon.className = 'uri-icon';
                template.icon.style.setProperty('--background-dark', dom.asCSSUrl(metadata.iconPath.dark));
                template.icon.style.setProperty('--background-light', dom.asCSSUrl(metadata.iconPath.light));
            }
            template.label.setLabel(metadata.label, metadata.description, {
                descriptionMatches: (0, filters_1.createMatches)(node.filterData),
            });
        }
        disposeTemplate(template) {
            template.label.dispose();
        }
    };
    exports.CategoryElementRenderer = CategoryElementRenderer;
    exports.CategoryElementRenderer = CategoryElementRenderer = CategoryElementRenderer_1 = __decorate([
        __param(0, themeService_1.IThemeService)
    ], CategoryElementRenderer);
    let FileElementTemplate = class FileElementTemplate {
        constructor(container, resourceLabels, _labelService) {
            this._labelService = _labelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._localDisposables = new lifecycle_1.DisposableStore();
            this._checkbox = document.createElement('input');
            this._checkbox.className = 'edit-checkbox';
            this._checkbox.type = 'checkbox';
            this._checkbox.setAttribute('role', 'checkbox');
            container.appendChild(this._checkbox);
            this._label = resourceLabels.create(container, { supportHighlights: true });
            this._details = document.createElement('span');
            this._details.className = 'details';
            container.appendChild(this._details);
        }
        dispose() {
            this._localDisposables.dispose();
            this._disposables.dispose();
            this._label.dispose();
        }
        set(element, score) {
            this._localDisposables.clear();
            this._checkbox.checked = element.isChecked();
            this._checkbox.disabled = element.isDisabled();
            this._localDisposables.add(dom.addDisposableListener(this._checkbox, 'change', () => {
                element.setChecked(this._checkbox.checked);
            }));
            if (element.edit.type & 8 /* BulkFileOperationType.Rename */ && element.edit.newUri) {
                // rename: oldName → newName
                this._label.setResource({
                    resource: element.edit.uri,
                    name: (0, nls_1.localize)('rename.label', "{0} → {1}", this._labelService.getUriLabel(element.edit.uri, { relative: true }), this._labelService.getUriLabel(element.edit.newUri, { relative: true })),
                }, {
                    fileDecorations: { colors: true, badges: false }
                });
                this._details.innerText = (0, nls_1.localize)('detail.rename', "(renaming)");
            }
            else {
                // create, delete, edit: NAME
                const options = {
                    matches: (0, filters_1.createMatches)(score),
                    fileKind: files_1.FileKind.FILE,
                    fileDecorations: { colors: true, badges: false },
                    extraClasses: []
                };
                if (element.edit.type & 2 /* BulkFileOperationType.Create */) {
                    this._details.innerText = (0, nls_1.localize)('detail.create', "(creating)");
                }
                else if (element.edit.type & 4 /* BulkFileOperationType.Delete */) {
                    this._details.innerText = (0, nls_1.localize)('detail.del', "(deleting)");
                    options.extraClasses.push('delete');
                }
                else {
                    this._details.innerText = '';
                }
                this._label.setFile(element.edit.uri, options);
            }
        }
    };
    FileElementTemplate = __decorate([
        __param(2, label_1.ILabelService)
    ], FileElementTemplate);
    let FileElementRenderer = class FileElementRenderer {
        static { FileElementRenderer_1 = this; }
        static { this.id = 'FileElementRenderer'; }
        constructor(_resourceLabels, _labelService) {
            this._resourceLabels = _resourceLabels;
            this._labelService = _labelService;
            this.templateId = FileElementRenderer_1.id;
        }
        renderTemplate(container) {
            return new FileElementTemplate(container, this._resourceLabels, this._labelService);
        }
        renderElement(node, _index, template) {
            template.set(node.element, node.filterData);
        }
        disposeTemplate(template) {
            template.dispose();
        }
    };
    exports.FileElementRenderer = FileElementRenderer;
    exports.FileElementRenderer = FileElementRenderer = FileElementRenderer_1 = __decorate([
        __param(1, label_1.ILabelService)
    ], FileElementRenderer);
    let TextEditElementTemplate = class TextEditElementTemplate {
        constructor(container, _themeService) {
            this._themeService = _themeService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._localDisposables = new lifecycle_1.DisposableStore();
            container.classList.add('textedit');
            this._checkbox = document.createElement('input');
            this._checkbox.className = 'edit-checkbox';
            this._checkbox.type = 'checkbox';
            this._checkbox.setAttribute('role', 'checkbox');
            container.appendChild(this._checkbox);
            this._icon = document.createElement('div');
            container.appendChild(this._icon);
            this._label = this._disposables.add(new highlightedLabel_1.HighlightedLabel(container));
        }
        dispose() {
            this._localDisposables.dispose();
            this._disposables.dispose();
        }
        set(element) {
            this._localDisposables.clear();
            this._localDisposables.add(dom.addDisposableListener(this._checkbox, 'change', e => {
                element.setChecked(this._checkbox.checked);
                e.preventDefault();
            }));
            if (element.parent.isChecked()) {
                this._checkbox.checked = element.isChecked();
                this._checkbox.disabled = element.isDisabled();
            }
            else {
                this._checkbox.checked = element.isChecked();
                this._checkbox.disabled = element.isDisabled();
            }
            let value = '';
            value += element.prefix;
            value += element.selecting;
            value += element.inserting;
            value += element.suffix;
            const selectHighlight = { start: element.prefix.length, end: element.prefix.length + element.selecting.length, extraClasses: ['remove'] };
            const insertHighlight = { start: selectHighlight.end, end: selectHighlight.end + element.inserting.length, extraClasses: ['insert'] };
            let title;
            const { metadata } = element.edit.textEdit;
            if (metadata && metadata.description) {
                title = (0, nls_1.localize)('title', "{0} - {1}", metadata.label, metadata.description);
            }
            else if (metadata) {
                title = metadata.label;
            }
            const iconPath = metadata?.iconPath;
            if (!iconPath) {
                this._icon.style.display = 'none';
            }
            else {
                this._icon.style.display = 'block';
                this._icon.style.setProperty('--background-dark', null);
                this._icon.style.setProperty('--background-light', null);
                if (themables_1.ThemeIcon.isThemeIcon(iconPath)) {
                    // css
                    const className = themables_1.ThemeIcon.asClassName(iconPath);
                    this._icon.className = className ? `theme-icon ${className}` : '';
                    this._icon.style.color = iconPath.color ? this._themeService.getColorTheme().getColor(iconPath.color.id)?.toString() ?? '' : '';
                }
                else if (uri_1.URI.isUri(iconPath)) {
                    // background-image
                    this._icon.className = 'uri-icon';
                    this._icon.style.setProperty('--background-dark', dom.asCSSUrl(iconPath));
                    this._icon.style.setProperty('--background-light', dom.asCSSUrl(iconPath));
                }
                else {
                    // background-image
                    this._icon.className = 'uri-icon';
                    this._icon.style.setProperty('--background-dark', dom.asCSSUrl(iconPath.dark));
                    this._icon.style.setProperty('--background-light', dom.asCSSUrl(iconPath.light));
                }
            }
            this._label.set(value, [selectHighlight, insertHighlight], title, true);
            this._icon.title = title || '';
        }
    };
    TextEditElementTemplate = __decorate([
        __param(1, themeService_1.IThemeService)
    ], TextEditElementTemplate);
    let TextEditElementRenderer = class TextEditElementRenderer {
        static { TextEditElementRenderer_1 = this; }
        static { this.id = 'TextEditElementRenderer'; }
        constructor(_themeService) {
            this._themeService = _themeService;
            this.templateId = TextEditElementRenderer_1.id;
        }
        renderTemplate(container) {
            return new TextEditElementTemplate(container, this._themeService);
        }
        renderElement({ element }, _index, template) {
            template.set(element);
        }
        disposeTemplate(_template) { }
    };
    exports.TextEditElementRenderer = TextEditElementRenderer;
    exports.TextEditElementRenderer = TextEditElementRenderer = TextEditElementRenderer_1 = __decorate([
        __param(0, themeService_1.IThemeService)
    ], TextEditElementRenderer);
    class BulkEditDelegate {
        getHeight() {
            return 23;
        }
        getTemplateId(element) {
            if (element instanceof FileElement) {
                return FileElementRenderer.id;
            }
            else if (element instanceof TextEditElement) {
                return TextEditElementRenderer.id;
            }
            else {
                return CategoryElementRenderer.id;
            }
        }
    }
    exports.BulkEditDelegate = BulkEditDelegate;
    class BulkEditNaviLabelProvider {
        getKeyboardNavigationLabel(element) {
            if (element instanceof FileElement) {
                return (0, resources_1.basename)(element.edit.uri);
            }
            else if (element instanceof CategoryElement) {
                return element.category.metadata.label;
            }
            return undefined;
        }
    }
    exports.BulkEditNaviLabelProvider = BulkEditNaviLabelProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRUcmVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYnVsa0VkaXQvYnJvd3Nlci9wcmV2aWV3L2J1bGtFZGl0VHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd1NoRyw4REFFQztJQW5RRCxNQUFhLGVBQWU7UUFFM0IsWUFDVSxNQUEwQixFQUMxQixRQUFzQjtZQUR0QixXQUFNLEdBQU4sTUFBTSxDQUFvQjtZQUMxQixhQUFRLEdBQVIsUUFBUSxDQUFjO1FBQzVCLENBQUM7UUFFTCxTQUFTO1lBQ1IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUMxQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDbkIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNqRCxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztvQkFDaEQsT0FBTyxHQUFHLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEQsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRUQsVUFBVSxDQUFDLEtBQWM7WUFDeEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUMxQixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ2pELEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUNoRCxLQUFLLENB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