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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/linkedText", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/opener/browser/link", "vs/platform/registry/common/platform", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/debug/browser/debugColors", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/path", "vs/base/common/extpath", "vs/base/browser/keyboardEvent", "vs/platform/product/common/productService", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/browser/defaultStyles", "vs/base/common/platform", "vs/platform/keybinding/common/keybinding", "vs/base/common/resources"], function (require, exports, dom_1, actionbar_1, button_1, inputBox_1, scrollableElement_1, actions_1, codicons_1, decorators_1, event_1, labels_1, lifecycle_1, linkedText_1, network_1, uri_1, nls_1, configurationRegistry_1, contextView_1, dialogs_1, instantiation_1, label_1, listService_1, link_1, platform_1, virtualWorkspace_1, storage_1, telemetry_1, colorRegistry_1, workspace_1, themeService_1, themables_1, workspaceTrust_1, editorPane_1, debugColors_1, extensions_1, configuration_1, extensionManifestPropertiesService_1, uriIdentity_1, extensionManagementUtil_1, extensionManagement_1, path_1, extpath_1, keyboardEvent_1, productService_1, iconRegistry_1, defaultStyles_1, platform_2, keybinding_1, resources_1) {
    "use strict";
    var TrustedUriActionsColumnRenderer_1, TrustedUriPathColumnRenderer_1, TrustedUriHostColumnRenderer_1, WorkspaceTrustEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTrustEditor = exports.shieldIcon = void 0;
    exports.shieldIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-banner', codicons_1.Codicon.shield, (0, nls_1.localize)('shieldIcon', 'Icon for workspace trust ion the banner.'));
    const checkListIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-check', codicons_1.Codicon.check, (0, nls_1.localize)('checkListIcon', 'Icon for the checkmark in the workspace trust editor.'));
    const xListIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-cross', codicons_1.Codicon.x, (0, nls_1.localize)('xListIcon', 'Icon for the cross in the workspace trust editor.'));
    const folderPickerIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-folder-picker', codicons_1.Codicon.folder, (0, nls_1.localize)('folderPickerIcon', 'Icon for the pick folder icon in the workspace trust editor.'));
    const editIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-edit-folder', codicons_1.Codicon.edit, (0, nls_1.localize)('editIcon', 'Icon for the edit folder icon in the workspace trust editor.'));
    const removeIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-remove-folder', codicons_1.Codicon.close, (0, nls_1.localize)('removeIcon', 'Icon for the remove folder icon in the workspace trust editor.'));
    let WorkspaceTrustedUrisTable = class WorkspaceTrustedUrisTable extends lifecycle_1.Disposable {
        constructor(container, instantiationService, workspaceService, workspaceTrustManagementService, uriService, labelService, fileDialogService) {
            super();
            this.container = container;
            this.instantiationService = instantiationService;
            this.workspaceService = workspaceService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.uriService = uriService;
            this.labelService = labelService;
            this.fileDialogService = fileDialogService;
            this._onDidAcceptEdit = this._register(new event_1.Emitter());
            this.onDidAcceptEdit = this._onDidAcceptEdit.event;
            this._onDidRejectEdit = this._register(new event_1.Emitter());
            this.onDidRejectEdit = this._onDidRejectEdit.event;
            this._onEdit = this._register(new event_1.Emitter());
            this.onEdit = this._onEdit.event;
            this._onDelete = this._register(new event_1.Emitter());
            this.onDelete = this._onDelete.event;
            this.descriptionElement = container.appendChild((0, dom_1.$)('.workspace-trusted-folders-description'));
            const tableElement = container.appendChild((0, dom_1.$)('.trusted-uris-table'));
            const addButtonBarElement = container.appendChild((0, dom_1.$)('.trusted-uris-button-bar'));
            this.table = this.instantiationService.createInstance(listService_1.WorkbenchTable, 'WorkspaceTrust', tableElement, new TrustedUriTableVirtualDelegate(), [
                {
                    label: (0, nls_1.localize)('hostColumnLabel', "Host"),
                    tooltip: '',
                    weight: 1,
                    templateId: TrustedUriHostColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('pathColumnLabel', "Path"),
                    tooltip: '',
                    weight: 8,
                    templateId: TrustedUriPathColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: '',
                    tooltip: '',
                    weight: 1,
                    minimumWidth: 75,
                    maximumWidth: 75,
                    templateId: TrustedUriActionsColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
            ], [
                this.instantiationService.createInstance(TrustedUriHostColumnRenderer),
                this.instantiationService.createInstance(TrustedUriPathColumnRenderer, this),
                this.instantiationService.createInstance(TrustedUriActionsColumnRenderer, this, this.currentWorkspaceUri),
            ], {
                horizontalScrolling: false,
                alwaysConsumeMouseWheel: false,
                openOnSingleClick: false,
                multipleSelectionSupport: false,
                accessibilityProvider: {
                    getAriaLabel: (item) => {
                        const hostLabel = getHostLabel(this.labelService, item);
                        if (hostLabel === undefined || hostLabel.length === 0) {
                            return (0, nls_1.localize)('trustedFolderAriaLabel', "{0}, trusted", this.labelService.getUriLabel(item.uri));
                        }
                        return (0, nls_1.localize)('trustedFolderWithHostAriaLabel', "{0} on {1}, trusted", this.labelService.getUriLabel(item.uri), hostLabel);
                    },
                    getWidgetAriaLabel: () => (0, nls_1.localize)('trustedFoldersAndWorkspaces', "Trusted Folders & Workspaces")
                },
                identityProvider: {
                    getId(element) {
                        return element.uri.toString();
                    },
                }
            });
            this._register(this.table.onDidOpen(item => {
                // default prevented when input box is double clicked #125052
                if (item && item.element && !item.browserEvent?.defaultPrevented) {
                    this.edit(item.element, true);
                }
            }));
            const buttonBar = this._register(new button_1.ButtonBar(addButtonBarElement));
            const addButton = this._register(buttonBar.addButton({ title: (0, nls_1.localize)('addButton', "Add Folder"), ...defaultStyles_1.defaultButtonStyles }));
            addButton.label = (0, nls_1.localize)('addButton', "Add Folder");
            this._register(addButton.onDidClick(async () => {
                const uri = await this.fileDialogService.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    defaultUri: this.currentWorkspaceUri,
                    openLabel: (0, nls_1.localize)('trustUri', "Trust Folder"),
                    title: (0, nls_1.localize)('selectTrustedUri', "Select Folder To Trust")
                });
                if (uri) {
                    this.workspaceTrustManagementService.setUrisTrust(uri, true);
                }
            }));
            this._register(this.workspaceTrustManagementService.onDidChangeTrustedFolders(() => {
                this.updateTable();
            }));
        }
        getIndexOfTrustedUriEntry(item) {
            const index = this.trustedUriEntries.indexOf(item);
            if (index === -1) {
                for (let i = 0; i < this.trustedUriEntries.length; i++) {
                    if (this.trustedUriEntries[i].uri === item.uri) {
                        return i;
                    }
                }
            }
            return index;
        }
        selectTrustedUriEntry(item, focus = true) {
            const index = this.getIndexOfTrustedUriEntry(item);
            if (index !== -1) {
                if (focus) {
                    this.table.domFocus();
                    this.table.setFocus([index]);
                }
                this.table.setSelection([index]);
            }
        }
        get currentWorkspaceUri() {
            return this.workspaceService.getWorkspace().folders[0]?.uri || uri_1.URI.file('/');
        }
        get trustedUriEntries() {
            const currentWorkspace = this.workspaceService.getWorkspace();
            const currentWorkspaceUris = currentWorkspace.folders.map(folder => folder.uri);
            if (currentWorkspace.configuration) {
                currentWorkspaceUris.push(currentWorkspace.configuration);
            }
            const entries = this.workspaceTrustManagementService.getTrustedUris().map(uri => {
                let relatedToCurrentWorkspace = false;
                for (const workspaceUri of currentWorkspaceUris) {
                    relatedToCurrentWorkspace = relatedToCurrentWorkspace || this.uriService.extUri.isEqualOrParent(workspaceUri, uri);
                }
                return {
                    uri,
                    parentOfWorkspaceItem: relatedToCurrentWorkspace
                };
            });
            // Sort entries
            const sortedEntries = entries.sort((a, b) => {
                if (a.uri.scheme !== b.uri.scheme) {
                    if (a.uri.scheme === network_1.Schemas.file) {
                        return -1;
                    }
                    if (b.uri.scheme === network_1.Schemas.file) {
                        return 1;
                    }
                }
                const aIsWorkspace = a.uri.path.endsWith('.code-workspace');
                const bIsWorkspace = b.uri.path.endsWith('.code-workspace');
                if (aIsWorkspace !== bIsWorkspace) {
                    if (aIsWorkspace) {
                        return 1;
                    }
                    if (bIsWorkspace) {
                        return -1;
                    }
                }
                return a.uri.fsPath.localeCompare(b.uri.fsPath);
            });
            return sortedEntries;
        }
        layout() {
            this.table.layout((this.trustedUriEntries.length * TrustedUriTableVirtualDelegate.ROW_HEIGHT) + TrustedUriTableVirtualDelegate.HEADER_ROW_HEIGHT, undefined);
        }
        updateTable() {
            const entries = this.trustedUriEntries;
            this.container.classList.toggle('empty', entries.length === 0);
            this.descriptionElement.innerText = entries.length ?
                (0, nls_1.localize)('trustedFoldersDescription', "You trust the following folders, their subfolders, and workspace files.") :
                (0, nls_1.localize)('noTrustedFoldersDescriptions', "You haven't trusted any folders or workspace files yet.");
            this.table.splice(0, Number.POSITIVE_INFINITY, this.trustedUriEntries);
            this.layout();
        }
        validateUri(path, item) {
            if (!item) {
                return null;
            }
            if (item.uri.scheme === 'vscode-vfs') {
                const segments = path.split(path_1.posix.sep).filter(s => s.length);
                if (segments.length === 0 && path.startsWith(path_1.posix.sep)) {
                    return {
                        type: 2 /* MessageType.WARNING */,
                        content: (0, nls_1.localize)({ key: 'trustAll', comment: ['The {0} will be a host name where repositories are hosted.'] }, "You will trust all repositories on {0}.", getHostLabel(this.labelService, item))
                    };
                }
                if (segments.length === 1) {
                    return {
                        type: 2 /* MessageType.WARNING */,
                        content: (0, nls_1.localize)({ key: 'trustOrg', comment: ['The {0} will be an organization or user name.', 'The {1} will be a host name where repositories are hosted.'] }, "You will trust all repositories and forks under '{0}' on {1}.", segments[0], getHostLabel(this.labelService, item))
                    };
                }
                if (segments.length > 2) {
                    return {
                        type: 3 /* MessageType.ERROR */,
                        content: (0, nls_1.localize)('invalidTrust', "You cannot trust individual folders within a repository.", path)
                    };
                }
            }
            return null;
        }
        acceptEdit(item, uri) {
            const trustedFolders = this.workspaceTrustManagementService.getTrustedUris();
            const index = trustedFolders.findIndex(u => this.uriService.extUri.isEqual(u, item.uri));
            if (index >= trustedFolders.length || index === -1) {
                trustedFolders.push(uri);
            }
            else {
                trustedFolders[index] = uri;
            }
            this.workspaceTrustManagementService.setTrustedUris(trustedFolders);
            this._onDidAcceptEdit.fire(item);
        }
        rejectEdit(item) {
            this._onDidRejectEdit.fire(item);
        }
        async delete(item) {
            this.table.focusNext();
            await this.workspaceTrustManagementService.setUrisTrust([item.uri], false);
            if (this.table.getFocus().length === 0) {
                this.table.focusLast();
            }
            this._onDelete.fire(item);
            this.table.domFocus();
        }
        async edit(item, usePickerIfPossible) {
            const canUseOpenDialog = item.uri.scheme === network_1.Schemas.file ||
                (item.uri.scheme === this.currentWorkspaceUri.scheme &&
                    this.uriService.extUri.isEqualAuthority(this.currentWorkspaceUri.authority, item.uri.authority) &&
                    !(0, virtualWorkspace_1.isVirtualResource)(item.uri));
            if (canUseOpenDialog && usePickerIfPossible) {
                const uri = await this.fileDialogService.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    defaultUri: item.uri,
                    openLabel: (0, nls_1.localize)('trustUri', "Trust Folder"),
                    title: (0, nls_1.localize)('selectTrustedUri', "Select Folder To Trust")
                });
                if (uri) {
                    this.acceptEdit(item, uri[0]);
                }
                else {
                    this.rejectEdit(item);
                }
            }
            else {
                this.selectTrustedUriEntry(item);
                this._onEdit.fire(item);
            }
        }
    };
    WorkspaceTrustedUrisTable = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, label_1.ILabelService),
        __param(6, dialogs_1.IFileDialogService)
    ], WorkspaceTrustedUrisTable);
    class TrustedUriTableVirtualDelegate {
        constructor() {
            this.headerRowHeight = TrustedUriTableVirtualDelegate.HEADER_ROW_HEIGHT;
        }
        static { this.HEADER_ROW_HEIGHT = 30; }
        static { this.ROW_HEIGHT = 24; }
        getHeight(item) {
            return TrustedUriTableVirtualDelegate.ROW_HEIGHT;
        }
    }
    let TrustedUriActionsColumnRenderer = class TrustedUriActionsColumnRenderer {
        static { TrustedUriActionsColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'actions'; }
        constructor(table, currentWorkspaceUri, uriService) {
            this.table = table;
            this.currentWorkspaceUri = currentWorkspaceUri;
            this.uriService = uriService;
            this.templateId = TrustedUriActionsColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = container.appendChild((0, dom_1.$)('.actions'));
            const actionBar = new actionbar_1.ActionBar(element);
            return { actionBar };
        }
        renderElement(item, index, templateData, height) {
            templateData.actionBar.clear();
            const canUseOpenDialog = item.uri.scheme === network_1.Schemas.file ||
                (item.uri.scheme === this.currentWorkspaceUri.scheme &&
                    this.uriService.extUri.isEqualAuthority(this.currentWorkspaceUri.authority, item.uri.authority) &&
                    !(0, virtualWorkspace_1.isVirtualResource)(item.uri));
            const actions = [];
            if (canUseOpenDialog) {
                actions.push(this.createPickerAction(item));
            }
            actions.push(this.createEditAction(item));
            actions.push(this.createDeleteAction(item));
            templateData.actionBar.push(actions, { icon: true });
        }
        createEditAction(item) {
            return {
                class: themables_1.ThemeIcon.asClassName(editIcon),
                enabled: true,
                id: 'editTrustedUri',
                tooltip: (0, nls_1.localize)('editTrustedUri', "Edit Path"),
                run: () => {
                    this.table.edit(item, false);
                }
            };
        }
        createPickerAction(item) {
            return {
                class: themables_1.ThemeIcon.asClassName(folderPickerIcon),
                enabled: true,
                id: 'pickerTrustedUri',
                tooltip: (0, nls_1.localize)('pickerTrustedUri', "Open File Picker"),
                run: () => {
                    this.table.edit(item, true);
                }
            };
        }
        createDeleteAction(item) {
            return {
                class: themables_1.ThemeIcon.asClassName(removeIcon),
                enabled: true,
                id: 'deleteTrustedUri',
                tooltip: (0, nls_1.localize)('deleteTrustedUri', "Delete Path"),
                run: async () => {
                    await this.table.delete(item);
                }
            };
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    };
    TrustedUriActionsColumnRenderer = TrustedUriActionsColumnRenderer_1 = __decorate([
        __param(2, uriIdentity_1.IUriIdentityService)
    ], TrustedUriActionsColumnRenderer);
    let TrustedUriPathColumnRenderer = class TrustedUriPathColumnRenderer {
        static { TrustedUriPathColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'path'; }
        constructor(table, contextViewService) {
            this.table = table;
            this.contextViewService = contextViewService;
            this.templateId = TrustedUriPathColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = container.appendChild((0, dom_1.$)('.path'));
            const pathLabel = element.appendChild((0, dom_1.$)('div.path-label'));
            const pathInput = new inputBox_1.InputBox(element, this.contextViewService, {
                validationOptions: {
                    validation: value => this.table.validateUri(value, this.currentItem)
                },
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            });
            const disposables = new lifecycle_1.DisposableStore();
            const renderDisposables = disposables.add(new lifecycle_1.DisposableStore());
            return {
                element,
                pathLabel,
                pathInput,
                disposables,
                renderDisposables
            };
        }
        renderElement(item, index, templateData, height) {
            templateData.renderDisposables.clear();
            this.currentItem = item;
            templateData.renderDisposables.add(this.table.onEdit(async (e) => {
                if (item === e) {
                    templateData.element.classList.add('input-mode');
                    templateData.pathInput.focus();
                    templateData.pathInput.select();
                    templateData.element.parentElement.style.paddingLeft = '0px';
                }
            }));
            // stop double click action from re-rendering the element on the table #125052
            templateData.renderDisposables.add((0, dom_1.addDisposableListener)(templateData.pathInput.element, dom_1.EventType.DBLCLICK, e => {
                dom_1.EventHelper.stop(e);
            }));
            const hideInputBox = () => {
                templateData.element.classList.remove('input-mode');
                templateData.element.parentElement.style.paddingLeft = '5px';
            };
            const accept = () => {
                hideInputBox();
                const pathToUse = templateData.pathInput.value;
                const uri = (0, extpath_1.hasDriveLetter)(pathToUse) ? item.uri.with({ path: path_1.posix.sep + (0, extpath_1.toSlashes)(pathToUse) }) : item.uri.with({ path: pathToUse });
                templateData.pathLabel.innerText = this.formatPath(uri);
                if (uri) {
                    this.table.acceptEdit(item, uri);
                }
            };
            const reject = () => {
                hideInputBox();
                templateData.pathInput.value = stringValue;
                this.table.rejectEdit(item);
            };
            templateData.renderDisposables.add((0, dom_1.addStandardDisposableListener)(templateData.pathInput.inputElement, dom_1.EventType.KEY_DOWN, e => {
                let handled = false;
                if (e.equals(3 /* KeyCode.Enter */)) {
                    accept();
                    handled = true;
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    reject();
                    handled = true;
                }
                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }));
            templateData.renderDisposables.add(((0, dom_1.addDisposableListener)(templateData.pathInput.inputElement, dom_1.EventType.BLUR, () => {
                reject();
            })));
            const stringValue = this.formatPath(item.uri);
            templateData.pathInput.value = stringValue;
            templateData.pathLabel.innerText = stringValue;
            templateData.element.classList.toggle('current-workspace-parent', item.parentOfWorkspaceItem);
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
            templateData.renderDisposables.dispose();
        }
        formatPath(uri) {
            if (uri.scheme === network_1.Schemas.file) {
                return (0, labels_1.normalizeDriveLetter)(uri.fsPath);
            }
            // If the path is not a file uri, but points to a windows remote, we should create windows fs path
            // e.g. /c:/user/directory => C:\user\directory
            if (uri.path.startsWith(path_1.posix.sep)) {
                const pathWithoutLeadingSeparator = uri.path.substring(1);
                const isWindowsPath = (0, extpath_1.hasDriveLetter)(pathWithoutLeadingSeparator, true);
                if (isWindowsPath) {
                    return (0, labels_1.normalizeDriveLetter)(path_1.win32.normalize(pathWithoutLeadingSeparator), true);
                }
            }
            return uri.path;
        }
    };
    TrustedUriPathColumnRenderer = TrustedUriPathColumnRenderer_1 = __decorate([
        __param(1, contextView_1.IContextViewService)
    ], TrustedUriPathColumnRenderer);
    function getHostLabel(labelService, item) {
        return item.uri.authority ? labelService.getHostLabel(item.uri.scheme, item.uri.authority) : (0, nls_1.localize)('localAuthority', "Local");
    }
    let TrustedUriHostColumnRenderer = class TrustedUriHostColumnRenderer {
        static { TrustedUriHostColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'host'; }
        constructor(labelService) {
            this.labelService = labelService;
            this.templateId = TrustedUriHostColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const disposables = new lifecycle_1.DisposableStore();
            const renderDisposables = disposables.add(new lifecycle_1.DisposableStore());
            const element = container.appendChild((0, dom_1.$)('.host'));
            const hostContainer = element.appendChild((0, dom_1.$)('div.host-label'));
            const buttonBarContainer = element.appendChild((0, dom_1.$)('div.button-bar'));
            return {
                element,
                hostContainer,
                buttonBarContainer,
                disposables,
                renderDisposables
            };
        }
        renderElement(item, index, templateData, height) {
            templateData.renderDisposables.clear();
            templateData.renderDisposables.add({ dispose: () => { (0, dom_1.clearNode)(templateData.buttonBarContainer); } });
            templateData.hostContainer.innerText = getHostLabel(this.labelService, item);
            templateData.element.classList.toggle('current-workspace-parent', item.parentOfWorkspaceItem);
            templateData.hostContainer.style.display = '';
            templateData.buttonBarContainer.style.display = 'none';
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    TrustedUriHostColumnRenderer = TrustedUriHostColumnRenderer_1 = __decorate([
        __param(0, label_1.ILabelService)
    ], TrustedUriHostColumnRenderer);
    let WorkspaceTrustEditor = class WorkspaceTrustEditor extends editorPane_1.EditorPane {
        static { WorkspaceTrustEditor_1 = this; }
        static { this.ID = 'workbench.editor.workspaceTrust'; }
        constructor(group, telemetryService, themeService, storageService, workspaceService, extensionWorkbenchService, extensionManifestPropertiesService, instantiationService, workspaceTrustManagementService, configurationService, extensionEnablementService, productService, keybindingService) {
            super(WorkspaceTrustEditor_1.ID, group, telemetryService, themeService, storageService);
            this.workspaceService = workspaceService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.instantiationService = instantiationService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.configurationService = configurationService;
            this.extensionEnablementService = extensionEnablementService;
            this.productService = productService;
            this.keybindingService = keybindingService;
            this.rendering = false;
            this.rerenderDisposables = this._register(new lifecycle_1.DisposableStore());
            this.layoutParticipants = [];
        }
        createEditor(parent) {
            this.rootElement = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-editor', { tabindex: '0' }));
            this.createHeaderElement(this.rootElement);
            const scrollableContent = (0, dom_1.$)('.workspace-trust-editor-body');
            this.bodyScrollBar = this._register(new scrollableElement_1.DomScrollableElement(scrollableContent, {
                horizontal: 2 /* ScrollbarVisibility.Hidden */,
                vertical: 1 /* ScrollbarVisibility.Auto */,
            }));
            (0, dom_1.append)(this.rootElement, this.bodyScrollBar.getDomNode());
            this.createAffectedFeaturesElement(scrollableContent);
            this.createConfigurationElement(scrollableContent);
            this.rootElement.style.setProperty('--workspace-trust-selected-color', (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonBackground));
            this.rootElement.style.setProperty('--workspace-trust-unselected-color', (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSecondaryBackground));
            this.rootElement.style.setProperty('--workspace-trust-check-color', (0, colorRegistry_1.asCssVariable)(debugColors_1.debugIconStartForeground));
            this.rootElement.style.setProperty('--workspace-trust-x-color', (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorErrorForeground));
            // Navigate page with keyboard
            this._register((0, dom_1.addDisposableListener)(this.rootElement, dom_1.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(16 /* KeyCode.UpArrow */) || event.equals(18 /* KeyCode.DownArrow */)) {
                    const navOrder = [this.headerContainer, this.trustedContainer, this.untrustedContainer, this.configurationContainer];
                    const currentIndex = navOrder.findIndex(element => {
                        return (0, dom_1.isAncestorOfActiveElement)(element);
                    });
                    let newIndex = currentIndex;
                    if (event.equals(18 /* KeyCode.DownArrow */)) {
                        newIndex++;
                    }
                    else if (event.equals(16 /* KeyCode.UpArrow */)) {
                        newIndex = Math.max(0, newIndex);
                        newIndex--;
                    }
                    newIndex += navOrder.length;
                    newIndex %= navOrder.length;
                    navOrder[newIndex].focus();
                }
                else if (event.equals(9 /* KeyCode.Escape */)) {
                    this.rootElement.focus();
                }
                else if (event.equals(2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */)) {
                    if (this.workspaceTrustManagementService.canSetWorkspaceTrust()) {
                        this.workspaceTrustManagementService.setWorkspaceTrust(!this.workspaceTrustManagementService.isWorkspaceTrusted());
                    }
                }
                else if (event.equals(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */)) {
                    if (this.workspaceTrustManagementService.canSetParentFolderTrust()) {
                        this.workspaceTrustManagementService.setParentFolderTrust(true);
                    }
                }
            }));
        }
        focus() {
            super.focus();
            this.rootElement.focus();
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            if (token.isCancellationRequested) {
                return;
            }
            await this.workspaceTrustManagementService.workspaceTrustInitialized;
            this.registerListeners();
            await this.render();
        }
        registerListeners() {
            this._register(this.extensionWorkbenchService.onChange(() => this.render()));
            this._register(this.configurationService.onDidChangeRestrictedSettings(() => this.render()));
            this._register(this.workspaceTrustManagementService.onDidChangeTrust(() => this.render()));
            this._register(this.workspaceTrustManagementService.onDidChangeTrustedFolders(() => this.render()));
        }
        getHeaderContainerClass(trusted) {
            if (trusted) {
                return 'workspace-trust-header workspace-trust-trusted';
            }
            return 'workspace-trust-header workspace-trust-untrusted';
        }
        getHeaderTitleText(trusted) {
            if (trusted) {
                if (this.workspaceTrustManagementService.isWorkspaceTrustForced()) {
                    return (0, nls_1.localize)('trustedUnsettableWindow', "This window is trusted");
                }
                switch (this.workspaceService.getWorkbenchState()) {
                    case 1 /* WorkbenchState.EMPTY */:
                        return (0, nls_1.localize)('trustedHeaderWindow', "You trust this window");
                    case 2 /* WorkbenchState.FOLDER */:
                        return (0, nls_1.localize)('trustedHeaderFolder', "You trust this folder");
                    case 3 /* WorkbenchState.WORKSPACE */:
                        return (0, nls_1.localize)('trustedHeaderWorkspace', "You trust this workspace");
                }
            }
            return (0, nls_1.localize)('untrustedHeader', "You are in Restricted Mode");
        }
        getHeaderTitleIconClassNames(trusted) {
            return themables_1.ThemeIcon.asClassNameArray(exports.shieldIcon);
        }
        getFeaturesHeaderText(trusted) {
            let title = '';
            let subTitle = '';
            switch (this.workspaceService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */: {
                    title = trusted ? (0, nls_1.localize)('trustedWindow', "In a Trusted Window") : (0, nls_1.localize)('untrustedWorkspace', "In Restricted Mode");
                    subTitle = trusted ? (0, nls_1.localize)('trustedWindowSubtitle', "You trust the authors of the files in the current window. All features are enabled:") :
                        (0, nls_1.localize)('untrustedWindowSubtitle', "You do not trust the authors of the files in the current window. The following features are disabled:");
                    break;
                }
                case 2 /* WorkbenchState.FOLDER */: {
                    title = trusted ? (0, nls_1.localize)('trustedFolder', "In a Trusted Folder") : (0, nls_1.localize)('untrustedWorkspace', "In Restricted Mode");
                    subTitle = trusted ? (0, nls_1.localize)('trustedFolderSubtitle', "You trust the authors of the files in the current folder. All features are enabled:") :
                        (0, nls_1.localize)('untrustedFolderSubtitle', "You do not trust the authors of the files in the current folder. The following features are disabled:");
                    break;
                }
                case 3 /* WorkbenchState.WORKSPACE */: {
                    title = trusted ? (0, nls_1.localize)('trustedWorkspace', "In a Trusted Workspace") : (0, nls_1.localize)('untrustedWorkspace', "In Restricted Mode");
                    subTitle = trusted ? (0, nls_1.localize)('trustedWorkspaceSubtitle', "You trust the authors of the files in the current workspace. All features are enabled:") :
                        (0, nls_1.localize)('untrustedWorkspaceSubtitle', "You do not trust the authors of the files in the current workspace. The following features are disabled:");
                    break;
                }
            }
            return [title, subTitle];
        }
        async render() {
            if (this.rendering) {
                return;
            }
            this.rendering = true;
            this.rerenderDisposables.clear();
            const isWorkspaceTrusted = this.workspaceTrustManagementService.isWorkspaceTrusted();
            this.rootElement.classList.toggle('trusted', isWorkspaceTrusted);
            this.rootElement.classList.toggle('untrusted', !isWorkspaceTrusted);
            // Header Section
            this.headerTitleText.innerText = this.getHeaderTitleText(isWorkspaceTrusted);
            this.headerTitleIcon.className = 'workspace-trust-title-icon';
            this.headerTitleIcon.classList.add(...this.getHeaderTitleIconClassNames(isWorkspaceTrusted));
            this.headerDescription.innerText = '';
            const headerDescriptionText = (0, dom_1.append)(this.headerDescription, (0, dom_1.$)('div'));
            headerDescriptionText.innerText = isWorkspaceTrusted ?
                (0, nls_1.localize)('trustedDescription', "All features are enabled because trust has been granted to the workspace.") :
                (0, nls_1.localize)('untrustedDescription', "{0} is in a restricted mode intended for safe code browsing.", this.productService.nameShort);
            const headerDescriptionActions = (0, dom_1.append)(this.headerDescription, (0, dom_1.$)('div'));
            const headerDescriptionActionsText = (0, nls_1.localize)({ key: 'workspaceTrustEditorHeaderActions', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[Configure your settings]({0}) or [learn more](https://aka.ms/vscode-workspace-trust).", `command:workbench.trust.configure`);
            for (const node of (0, linkedText_1.parseLinkedText)(headerDescriptionActionsText).nodes) {
                if (typeof node === 'string') {
                    (0, dom_1.append)(headerDescriptionActions, document.createTextNode(node));
                }
                else {
                    this.rerenderDisposables.add(this.instantiationService.createInstance(link_1.Link, headerDescriptionActions, { ...node, tabIndex: -1 }, {}));
                }
            }
            this.headerContainer.className = this.getHeaderContainerClass(isWorkspaceTrusted);
            this.rootElement.setAttribute('aria-label', `${(0, nls_1.localize)('root element label', "Manage Workspace Trust")}:  ${this.headerContainer.innerText}`);
            // Settings
            const restrictedSettings = this.configurationService.restrictedSettings;
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            const settingsRequiringTrustedWorkspaceCount = restrictedSettings.default.filter(key => {
                const property = configurationRegistry.getConfigurationProperties()[key];
                // cannot be configured in workspace
                if (property.scope === 1 /* ConfigurationScope.APPLICATION */ || property.scope === 2 /* ConfigurationScope.MACHINE */) {
                    return false;
                }
                // If deprecated include only those configured in the workspace
                if (property.deprecationMessage || property.markdownDeprecationMessage) {
                    if (restrictedSettings.workspace?.includes(key)) {
                        return true;
                    }
                    if (restrictedSettings.workspaceFolder) {
                        for (const workspaceFolderSettings of restrictedSettings.workspaceFolder.values()) {
                            if (workspaceFolderSettings.includes(key)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
                return true;
            }).length;
            // Features List
            this.renderAffectedFeatures(settingsRequiringTrustedWorkspaceCount, this.getExtensionCount());
            // Configuration Tree
            this.workspaceTrustedUrisTable.updateTable();
            this.bodyScrollBar.getDomNode().style.height = `calc(100% - ${this.headerContainer.clientHeight}px)`;
            this.bodyScrollBar.scanDomNode();
            this.rendering = false;
        }
        getExtensionCount() {
            const set = new Set();
            const inVirtualWorkspace = (0, virtualWorkspace_1.isVirtualWorkspace)(this.workspaceService.getWorkspace());
            const localExtensions = this.extensionWorkbenchService.local.filter(ext => ext.local).map(ext => ext.local);
            for (const extension of localExtensions) {
                const enablementState = this.extensionEnablementService.getEnablementState(extension);
                if (enablementState !== 8 /* EnablementState.EnabledGlobally */ && enablementState !== 9 /* EnablementState.EnabledWorkspace */ &&
                    enablementState !== 0 /* EnablementState.DisabledByTrustRequirement */ && enablementState !== 5 /* EnablementState.DisabledByExtensionDependency */) {
                    continue;
                }
                if (inVirtualWorkspace && this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(extension.manifest) === false) {
                    continue;
                }
                if (this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(extension.manifest) !== true) {
                    set.add(extension.identifier.id);
                    continue;
                }
                const dependencies = (0, extensionManagementUtil_1.getExtensionDependencies)(localExtensions, extension);
                if (dependencies.some(ext => this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(ext.manifest) === false)) {
                    set.add(extension.identifier.id);
                }
            }
            return set.size;
        }
        createHeaderElement(parent) {
            this.headerContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-header', { tabIndex: '0' }));
            this.headerTitleContainer = (0, dom_1.append)(this.headerContainer, (0, dom_1.$)('.workspace-trust-title'));
            this.headerTitleIcon = (0, dom_1.append)(this.headerTitleContainer, (0, dom_1.$)('.workspace-trust-title-icon'));
            this.headerTitleText = (0, dom_1.append)(this.headerTitleContainer, (0, dom_1.$)('.workspace-trust-title-text'));
            this.headerDescription = (0, dom_1.append)(this.headerContainer, (0, dom_1.$)('.workspace-trust-description'));
        }
        createConfigurationElement(parent) {
            this.configurationContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-settings', { tabIndex: '0' }));
            const configurationTitle = (0, dom_1.append)(this.configurationContainer, (0, dom_1.$)('.workspace-trusted-folders-title'));
            configurationTitle.innerText = (0, nls_1.localize)('trustedFoldersAndWorkspaces', "Trusted Folders & Workspaces");
            this.workspaceTrustedUrisTable = this._register(this.instantiationService.createInstance(WorkspaceTrustedUrisTable, this.configurationContainer));
        }
        createAffectedFeaturesElement(parent) {
            this.affectedFeaturesContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-features'));
            this.trustedContainer = (0, dom_1.append)(this.affectedFeaturesContainer, (0, dom_1.$)('.workspace-trust-limitations.trusted', { tabIndex: '0' }));
            this.untrustedContainer = (0, dom_1.append)(this.affectedFeaturesContainer, (0, dom_1.$)('.workspace-trust-limitations.untrusted', { tabIndex: '0' }));
        }
        async renderAffectedFeatures(numSettings, numExtensions) {
            (0, dom_1.clearNode)(this.trustedContainer);
            (0, dom_1.clearNode)(this.untrustedContainer);
            // Trusted features
            const [trustedTitle, trustedSubTitle] = this.getFeaturesHeaderText(true);
            this.renderLimitationsHeaderElement(this.trustedContainer, trustedTitle, trustedSubTitle);
            const trustedContainerItems = this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ?
                [
                    (0, nls_1.localize)('trustedTasks', "Tasks are allowed to run"),
                    (0, nls_1.localize)('trustedDebugging', "Debugging is enabled"),
                    (0, nls_1.localize)('trustedExtensions', "All enabled extensions are activated")
                ] :
                [
                    (0, nls_1.localize)('trustedTasks', "Tasks are allowed to run"),
                    (0, nls_1.localize)('trustedDebugging', "Debugging is enabled"),
                    (0, nls_1.localize)('trustedSettings', "All workspace settings are applied"),
                    (0, nls_1.localize)('trustedExtensions', "All enabled extensions are activated")
                ];
            this.renderLimitationsListElement(this.trustedContainer, trustedContainerItems, themables_1.ThemeIcon.asClassNameArray(checkListIcon));
            // Restricted Mode features
            const [untrustedTitle, untrustedSubTitle] = this.getFeaturesHeaderText(false);
            this.renderLimitationsHeaderElement(this.untrustedContainer, untrustedTitle, untrustedSubTitle);
            const untrustedContainerItems = this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ?
                [
                    (0, nls_1.localize)('untrustedTasks', "Tasks are not allowed to run"),
                    (0, nls_1.localize)('untrustedDebugging', "Debugging is disabled"),
                    fixBadLocalizedLinks((0, nls_1.localize)({ key: 'untrustedExtensions', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[{0} extensions]({1}) are disabled or have limited functionality", numExtensions, `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`))
                ] :
                [
                    (0, nls_1.localize)('untrustedTasks', "Tasks are not allowed to run"),
                    (0, nls_1.localize)('untrustedDebugging', "Debugging is disabled"),
                    fixBadLocalizedLinks(numSettings ? (0, nls_1.localize)({ key: 'untrustedSettings', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[{0} workspace settings]({1}) are not applied", numSettings, 'command:settings.filterUntrusted') : (0, nls_1.localize)('no untrustedSettings', "Workspace settings requiring trust are not applied")),
                    fixBadLocalizedLinks((0, nls_1.localize)({ key: 'untrustedExtensions', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[{0} extensions]({1}) are disabled or have limited functionality", numExtensions, `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`))
                ];
            this.renderLimitationsListElement(this.untrustedContainer, untrustedContainerItems, themables_1.ThemeIcon.asClassNameArray(xListIcon));
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                if (this.workspaceTrustManagementService.canSetWorkspaceTrust()) {
                    this.addDontTrustButtonToElement(this.untrustedContainer);
                }
                else {
                    this.addTrustedTextToElement(this.untrustedContainer);
                }
            }
            else {
                if (this.workspaceTrustManagementService.canSetWorkspaceTrust()) {
                    this.addTrustButtonToElement(this.trustedContainer);
                }
            }
        }
        createButtonRow(parent, buttonInfo, enabled) {
            const buttonRow = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-buttons-row'));
            const buttonContainer = (0, dom_1.append)(buttonRow, (0, dom_1.$)('.workspace-trust-buttons'));
            const buttonBar = this.rerenderDisposables.add(new button_1.ButtonBar(buttonContainer));
            for (const { action, keybinding } of buttonInfo) {
                const button = buttonBar.addButtonWithDescription(defaultStyles_1.defaultButtonStyles);
                button.label = action.label;
                button.enabled = enabled !== undefined ? enabled : action.enabled;
                button.description = keybinding.getLabel();
                button.element.ariaLabel = action.label + ', ' + (0, nls_1.localize)('keyboardShortcut', "Keyboard Shortcut: {0}", keybinding.getAriaLabel());
                this.rerenderDisposables.add(button.onDidClick(e => {
                    if (e) {
                        dom_1.EventHelper.stop(e, true);
                    }
                    action.run();
                }));
            }
        }
        addTrustButtonToElement(parent) {
            const trustAction = new actions_1.Action('workspace.trust.button.action.grant', (0, nls_1.localize)('trustButton', "Trust"), undefined, true, async () => {
                await this.workspaceTrustManagementService.setWorkspaceTrust(true);
            });
            const trustActions = [{ action: trustAction, keybinding: this.keybindingService.resolveUserBinding(platform_2.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter')[0] }];
            if (this.workspaceTrustManagementService.canSetParentFolderTrust()) {
                const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this.workspaceService.getWorkspace());
                const name = (0, resources_1.basename)((0, resources_1.dirname)(workspaceIdentifier.uri));
                const trustMessageElement = (0, dom_1.append)(parent, (0, dom_1.$)('.trust-message-box'));
                trustMessageElement.innerText = (0, nls_1.localize)('trustMessage', "Trust the authors of all files in the current folder or its parent '{0}'.", name);
                const trustParentAction = new actions_1.Action('workspace.trust.button.action.grantParent', (0, nls_1.localize)('trustParentButton', "Trust Parent"), undefined, true, async () => {
                    await this.workspaceTrustManagementService.setParentFolderTrust(true);
                });
                trustActions.push({ action: trustParentAction, keybinding: this.keybindingService.resolveUserBinding(platform_2.isMacintosh ? 'Cmd+Shift+Enter' : 'Ctrl+Shift+Enter')[0] });
            }
            this.createButtonRow(parent, trustActions);
        }
        addDontTrustButtonToElement(parent) {
            this.createButtonRow(parent, [{
                    action: new actions_1.Action('workspace.trust.button.action.deny', (0, nls_1.localize)('dontTrustButton', "Don't Trust"), undefined, true, async () => {
                        await this.workspaceTrustManagementService.setWorkspaceTrust(false);
                    }),
                    keybinding: this.keybindingService.resolveUserBinding(platform_2.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter')[0]
                }]);
        }
        addTrustedTextToElement(parent) {
            if (this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return;
            }
            const textElement = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-untrusted-description'));
            if (!this.workspaceTrustManagementService.isWorkspaceTrustForced()) {
                textElement.innerText = this.workspaceService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? (0, nls_1.localize)('untrustedWorkspaceReason', "This workspace is trusted via the bolded entries in the trusted folders below.") : (0, nls_1.localize)('untrustedFolderReason', "This folder is trusted via the bolded entries in the the trusted folders below.");
            }
            else {
                textElement.innerText = (0, nls_1.localize)('trustedForcedReason', "This window is trusted by nature of the workspace that is opened.");
            }
        }
        renderLimitationsHeaderElement(parent, headerText, subtitleText) {
            const limitationsHeaderContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-limitations-header'));
            const titleElement = (0, dom_1.append)(limitationsHeaderContainer, (0, dom_1.$)('.workspace-trust-limitations-title'));
            const textElement = (0, dom_1.append)(titleElement, (0, dom_1.$)('.workspace-trust-limitations-title-text'));
            const subtitleElement = (0, dom_1.append)(limitationsHeaderContainer, (0, dom_1.$)('.workspace-trust-limitations-subtitle'));
            textElement.innerText = headerText;
            subtitleElement.innerText = subtitleText;
        }
        renderLimitationsListElement(parent, limitations, iconClassNames) {
            const listContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-limitations-list-container'));
            const limitationsList = (0, dom_1.append)(listContainer, (0, dom_1.$)('ul'));
            for (const limitation of limitations) {
                const limitationListItem = (0, dom_1.append)(limitationsList, (0, dom_1.$)('li'));
                const icon = (0, dom_1.append)(limitationListItem, (0, dom_1.$)('.list-item-icon'));
                const text = (0, dom_1.append)(limitationListItem, (0, dom_1.$)('.list-item-text'));
                icon.classList.add(...iconClassNames);
                const linkedText = (0, linkedText_1.parseLinkedText)(limitation);
                for (const node of linkedText.nodes) {
                    if (typeof node === 'string') {
                        (0, dom_1.append)(text, document.createTextNode(node));
                    }
                    else {
                        this.rerenderDisposables.add(this.instantiationService.createInstance(link_1.Link, text, { ...node, tabIndex: -1 }, {}));
                    }
                }
            }
        }
        layout(dimension) {
            if (!this.isVisible()) {
                return;
            }
            this.workspaceTrustedUrisTable.layout();
            this.layoutParticipants.forEach(participant => {
                participant.layout();
            });
            this.bodyScrollBar.scanDomNode();
        }
    };
    exports.WorkspaceTrustEditor = WorkspaceTrustEditor;
    __decorate([
        (0, decorators_1.debounce)(100)
    ], WorkspaceTrustEditor.prototype, "render", null);
    exports.WorkspaceTrustEditor = WorkspaceTrustEditor = WorkspaceTrustEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, extensions_1.IExtensionsWorkbenchService),
        __param(6, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(9, configuration_1.IWorkbenchConfigurationService),
        __param(10, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(11, productService_1.IProductService),
        __param(12, keybinding_1.IKeybindingService)
    ], WorkspaceTrustEditor);
    // Highly scoped fix for #126614
    function fixBadLocalizedLinks(badString) {
        const regex = /(.*)\[(.+)\]\s*\((.+)\)(.*)/; // markdown link match with spaces
        return badString.replace(regex, '$1[$2]($3)$4');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3RFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93b3Jrc3BhY2UvYnJvd3Nlci93b3Jrc3BhY2VUcnVzdEVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNERuRixRQUFBLFVBQVUsR0FBRyxJQUFBLDJCQUFZLEVBQUMsd0JBQXdCLEVBQUUsa0JBQU8sQ0FBQyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLDBDQUEwQyxDQUFDLENBQUMsQ0FBQztJQUVySixNQUFNLGFBQWEsR0FBRyxJQUFBLDJCQUFZLEVBQUMsOEJBQThCLEVBQUUsa0JBQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLHVEQUF1RCxDQUFDLENBQUMsQ0FBQztJQUN0SyxNQUFNLFNBQVMsR0FBRyxJQUFBLDJCQUFZLEVBQUMsOEJBQThCLEVBQUUsa0JBQU8sQ0FBQyxDQUFDLEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLG1EQUFtRCxDQUFDLENBQUMsQ0FBQztJQUN0SixNQUFNLGdCQUFnQixHQUFHLElBQUEsMkJBQVksRUFBQyxzQ0FBc0MsRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSw4REFBOEQsQ0FBQyxDQUFDLENBQUM7SUFDNUwsTUFBTSxRQUFRLEdBQUcsSUFBQSwyQkFBWSxFQUFDLG9DQUFvQyxFQUFFLGtCQUFPLENBQUMsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSw4REFBOEQsQ0FBQyxDQUFDLENBQUM7SUFDeEssTUFBTSxVQUFVLEdBQUcsSUFBQSwyQkFBWSxFQUFDLHNDQUFzQyxFQUFFLGtCQUFPLENBQUMs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