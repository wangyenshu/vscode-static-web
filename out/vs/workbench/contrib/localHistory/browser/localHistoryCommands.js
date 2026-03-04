/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/network", "vs/base/common/errorMessage", "vs/base/common/cancellation", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/contrib/localHistory/browser/localHistoryFileSystemProvider", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/resources", "vs/platform/commands/common/commands", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/contextkeys", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/label/common/label", "vs/base/common/arrays", "vs/workbench/contrib/localHistory/browser/localHistory", "vs/workbench/services/path/common/pathService"], function (require, exports, nls_1, uri_1, event_1, network_1, errorMessage_1, cancellation_1, workingCopyHistory_1, editorCommands_1, localHistoryFileSystemProvider_1, contextkey_1, actions_1, resources_1, commands_1, editor_1, files_1, workingCopyService_1, dialogs_1, editorService_1, contextkeys_1, quickInput_1, getIconClasses_1, model_1, language_1, label_1, arrays_1, localHistory_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COMPARE_WITH_FILE_LABEL = void 0;
    exports.toDiffEditorArguments = toDiffEditorArguments;
    exports.findLocalHistoryEntry = findLocalHistoryEntry;
    const LOCAL_HISTORY_CATEGORY = (0, nls_1.localize2)('localHistory.category', 'Local History');
    //#region Compare with File
    exports.COMPARE_WITH_FILE_LABEL = (0, nls_1.localize2)('localHistory.compareWithFile', 'Compare with File');
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.compareWithFile',
                title: exports.COMPARE_WITH_FILE_LABEL,
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '1_compare',
                    order: 1,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const commandService = accessor.get(commands_1.ICommandService);
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(entry, entry.workingCopy.resource));
            }
        }
    });
    //#endregion
    //#region Compare with Previous
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.compareWithPrevious',
                title: (0, nls_1.localize2)('localHistory.compareWithPrevious', 'Compare with Previous'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '1_compare',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const commandService = accessor.get(commands_1.ICommandService);
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const { entry, previous } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                // Without a previous entry, just show the entry directly
                if (!previous) {
                    return openEntry(entry, editorService);
                }
                // Open real diff editor
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(previous, entry));
            }
        }
    });
    //#endregion
    //#region Select for Compare / Compare with Selected
    let itemSelectedForCompare = undefined;
    const LocalHistoryItemSelectedForCompare = new contextkey_1.RawContextKey('localHistoryItemSelectedForCompare', false, true);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.selectForCompare',
                title: (0, nls_1.localize2)('localHistory.selectForCompare', 'Select for Compare'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '2_compare_with',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                itemSelectedForCompare = item;
                LocalHistoryItemSelectedForCompare.bindTo(contextKeyService).set(true);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.compareWithSelected',
                title: (0, nls_1.localize2)('localHistory.compareWithSelected', 'Compare with Selected'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '2_compare_with',
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY, LocalHistoryItemSelectedForCompare)
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const commandService = accessor.get(commands_1.ICommandService);
            if (!itemSelectedForCompare) {
                return;
            }
            const selectedEntry = (await findLocalHistoryEntry(workingCopyHistoryService, itemSelectedForCompare)).entry;
            if (!selectedEntry) {
                return;
            }
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(selectedEntry, entry));
            }
        }
    });
    //#endregion
    //#region Show Contents
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.open',
                title: (0, nls_1.localize2)('localHistory.open', 'Show Contents'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '3_contents',
                    order: 1,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                return openEntry(entry, editorService);
            }
        }
    });
    //#region Restore Contents
    const RESTORE_CONTENTS_LABEL = (0, nls_1.localize2)('localHistory.restore', 'Restore Contents');
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.restoreViaEditor',
                title: RESTORE_CONTENTS_LABEL,
                menu: {
                    id: actions_1.MenuId.EditorTitle,
                    group: 'navigation',
                    order: -10,
                    when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.SCHEMA)
                },
                icon: localHistory_1.LOCAL_HISTORY_ICON_RESTORE
            });
        }
        async run(accessor, uri) {
            const { associatedResource, location } = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(uri);
            return restore(accessor, { uri: associatedResource, handle: (0, resources_1.basenameOrAuthority)(location) });
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.restore',
                title: RESTORE_CONTENTS_LABEL,
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '3_contents',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            return restore(accessor, item);
        }
    });
    const restoreSaveSource = editor_1.SaveSourceRegistry.registerSource('localHistoryRestore.source', (0, nls_1.localize)('localHistoryRestore.source', "File Restored"));
    async function restore(accessor, item) {
        const fileService = accessor.get(files_1.IFileService);
        const dialogService = accessor.get(dialogs_1.IDialogService);
        const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
        const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
        if (entry) {
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmRestoreMessage', "Do you want to restore the contents of '{0}'?", (0, resources_1.basename)(entry.workingCopy.resource)),
                detail: (0, nls_1.localize)('confirmRestoreDetail', "Restoring will discard any unsaved changes."),
                primaryButton: (0, nls_1.localize)({ key: 'restoreButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Restore")
            });
            if (!confirmed) {
                return;
            }
            // Revert all dirty working copies for target
            const workingCopies = workingCopyService.getAll(entry.workingCopy.resource);
            if (workingCopies) {
                for (const workingCopy of workingCopies) {
                    if (workingCopy.isDirty()) {
                        await workingCopy.revert({ soft: true });
                    }
                }
            }
            // Replace target with contents of history entry
            try {
                await fileService.cloneFile(entry.location, entry.workingCopy.resource);
            }
            catch (error) {
                // It is possible that we fail to copy the history entry to the
                // destination, for example when the destination is write protected.
                // In that case tell the user and return, it is still possible for
                // the user to manually copy the changes over from the diff editor.
                await dialogService.error((0, nls_1.localize)('unableToRestore', "Unable to restore '{0}'.", (0, resources_1.basename)(entry.workingCopy.resource)), (0, errorMessage_1.toErrorMessage)(error));
                return;
            }
            // Restore all working copies for target
            if (workingCopies) {
                for (const workingCopy of workingCopies) {
                    await workingCopy.revert({ force: true });
                }
            }
            // Open target
            await editorService.openEditor({ resource: entry.workingCopy.resource });
            // Add new entry
            await workingCopyHistoryService.addEntry({
                resource: entry.workingCopy.resource,
                source: restoreSaveSource
            }, cancellation_1.CancellationToken.None);
            // Close source
            await closeEntry(entry, editorService);
        }
    }
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.restoreViaPicker',
                title: (0, nls_1.localize2)('localHistory.restoreViaPicker', 'Find Entry to Restore'),
                f1: true,
                category: LOCAL_HISTORY_CATEGORY
            });
        }
        async run(accessor) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const modelService = accessor.get(model_1.IModelService);
            const languageService = accessor.get(language_1.ILanguageService);
            const labelService = accessor.get(label_1.ILabelService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_1.IFileService);
            const commandService = accessor.get(commands_1.ICommandService);
            // Show all resources with associated history entries in picker
            // with progress because this operation will take longer the more
            // files have been saved overall.
            const resourcePicker = quickInputService.createQuickPick();
            let cts = new cancellation_1.CancellationTokenSource();
            resourcePicker.onDidHide(() => cts.dispose(true));
            resourcePicker.busy = true;
            resourcePicker.show();
            const resources = await workingCopyHistoryService.getAll(cts.token);
            resourcePicker.busy = false;
            resourcePicker.placeholder = (0, nls_1.localize)('restoreViaPicker.filePlaceholder', "Select the file to show local history for");
            resourcePicker.matchOnLabel = true;
            resourcePicker.matchOnDescription = true;
            resourcePicker.items = resources.map(resource => ({
                resource,
                label: (0, resources_1.basenameOrAuthority)(resource),
                description: labelService.getUriLabel((0, resources_1.dirname)(resource), { relative: true }),
                iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource)
            })).sort((r1, r2) => r1.resource.fsPath < r2.resource.fsPath ? -1 : 1);
            await event_1.Event.toPromise(resourcePicker.onDidAccept);
            resourcePicker.dispose();
            const resource = (0, arrays_1.firstOrDefault)(resourcePicker.selectedItems)?.resource;
            if (!resource) {
                return;
            }
            // Show all entries for the picked resource in another picker
            // and open the entry in the end that was selected by the user
            const entryPicker = quickInputService.createQuickPick();
            cts = new cancellation_1.CancellationTokenSource();
            entryPicker.onDidHide(() => cts.dispose(true));
            entryPicker.busy = true;
            entryPicker.show();
            const entries = await workingCopyHistoryService.getEntries(resource, cts.token);
            entryPicker.busy = false;
            entryPicker.placeholder = (0, nls_1.localize)('restoreViaPicker.entryPlaceholder', "Select the local history entry to open");
            entryPicker.matchOnLabel = true;
            entryPicker.matchOnDescription = true;
            entryPicker.items = Array.from(entries).reverse().map(entry => ({
                entry,
                label: `$(circle-outline) ${editor_1.SaveSourceRegistry.getSourceLabel(entry.source)}`,
                description: toLocalHistoryEntryDateLabel(entry.timestamp)
            }));
            await event_1.Event.toPromise(entryPicker.onDidAccept);
            entryPicker.dispose();
            const selectedItem = (0, arrays_1.firstOrDefault)(entryPicker.selectedItems);
            if (!selectedItem) {
                return;
            }
            const resourceExists = await fileService.exists(selectedItem.entry.workingCopy.resource);
            if (resourceExists) {
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(selectedItem.entry, selectedItem.entry.workingCopy.resource));
            }
            return openEntry(selectedItem.entry, editorService);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.TimelineTitle, { command: { id: 'workbench.action.localHistory.restoreViaPicker', title: (0, nls_1.localize2)('localHistory.restoreViaPickerMenu', 'Local History: Find Entry to Restore...') }, group: 'submenu', order: 1 });
    //#endregion
    //#region Rename
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.rename',
                title: (0, nls_1.localize2)('localHistory.rename', 'Rename'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '5_edit',
                    order: 1,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                const inputBox = quickInputService.createInputBox();
                inputBox.title = (0, nls_1.localize)('renameLocalHistoryEntryTitle', "Rename Local History Entry");
                inputBox.ignoreFocusOut = true;
                inputBox.placeholder = (0, nls_1.localize)('renameLocalHistoryPlaceholder', "Enter the new name of the local history entry");
                inputBox.value = editor_1.SaveSourceRegistry.getSourceLabel(entry.source);
                inputBox.show();
                inputBox.onDidAccept(() => {
                    if (inputBox.value) {
                        workingCopyHistoryService.updateEntry(entry, { source: inputBox.value }, cancellation_1.CancellationToken.None);
                    }
                    inputBox.dispose();
                });
            }
        }
    });
    //#endregion
    //#region Delete
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.delete',
                title: (0, nls_1.localize2)('localHistory.delete', 'Delete'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '5_edit',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                // Ask for confirmation
                const { confirmed } = await dialogService.confirm({
                    type: 'warning',
                    message: (0, nls_1.localize)('confirmDeleteMessage', "Do you want to delete the local history entry of '{0}' from {1}?", entry.workingCopy.name, toLocalHistoryEntryDateLabel(entry.timestamp)),
                    detail: (0, nls_1.localize)('confirmDeleteDetail', "This action is irreversible!"),
                    primaryButton: (0, nls_1.localize)({ key: 'deleteButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete"),
                });
                if (!confirmed) {
                    return;
                }
                // Remove via service
                await workingCopyHistoryService.removeEntry(entry, cancellation_1.CancellationToken.None);
                // Close any opened editors
                await closeEntry(entry, editorService);
            }
        }
    });
    //#endregion
    //#region Delete All
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.deleteAll',
                title: (0, nls_1.localize2)('localHistory.deleteAll', 'Delete All'),
                f1: true,
                category: LOCAL_HISTORY_CATEGORY
            });
        }
        async run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmDeleteAllMessage', "Do you want to delete all entries of all files in local history?"),
                detail: (0, nls_1.localize)('confirmDeleteAllDetail', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'deleteAllButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete All"),
            });
            if (!confirmed) {
                return;
            }
            // Remove via service
            await workingCopyHistoryService.removeAll(cancellation_1.CancellationToken.None);
        }
    });
    //#endregion
    //#region Create
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.create',
                title: (0, nls_1.localize2)('localHistory.create', 'Create Entry'),
                f1: true,
                category: LOCAL_HISTORY_CATEGORY,
                precondition: contextkeys_1.ActiveEditorContext
            });
        }
        async run(accessor) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const labelService = accessor.get(label_1.ILabelService);
            const pathService = accessor.get(pathService_1.IPathService);
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (resource?.scheme !== pathService.defaultUriScheme && resource?.scheme !== network_1.Schemas.vscodeUserData) {
                return; // only enable for selected schemes
            }
            const inputBox = quickInputService.createInputBox();
            inputBox.title = (0, nls_1.localize)('createLocalHistoryEntryTitle', "Create Local History Entry");
            inputBox.ignoreFocusOut = true;
            inputBox.placeholder = (0, nls_1.localize)('createLocalHistoryPlaceholder', "Enter the new name of the local history entry for '{0}'", labelService.getUriBasenameLabel(resource));
            inputBox.show();
            inputBox.onDidAccept(async () => {
                const entrySource = inputBox.value;
                inputBox.dispose();
                if (entrySource) {
                    await workingCopyHistoryService.addEntry({ resource, source: inputBox.value }, cancellation_1.CancellationToken.None);
                }
            });
        }
    });
    //#endregion
    //#region Helpers
    async function openEntry(entry, editorService) {
        const resource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: entry.location, associatedResource: entry.workingCopy.resource });
        await editorService.openEditor({
            resource,
            label: (0, nls_1.localize)('localHistoryEditorLabel', "{0} ({1} • {2})", entry.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(entry.source), toLocalHistoryEntryDateLabel(entry.timestamp))
        });
    }
    async function closeEntry(entry, editorService) {
        const resource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: entry.location, associatedResource: entry.workingCopy.resource });
        const editors = editorService.findEditors(resource, { supportSideBySide: editor_1.SideBySideEditor.ANY });
        await editorService.closeEditors(editors, { preserveFocus: true });
    }
    function toDiffEditorArguments(arg1, arg2) {
        // Left hand side is always a working copy history entry
        const originalResource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: arg1.location, associatedResource: arg1.workingCopy.resource });
        let label;
        // Right hand side depends on how the method was called
        // and is either another working copy history entry
        // or the file on disk.
        let modifiedResource;
        // Compare with file on disk
        if (uri_1.URI.isUri(arg2)) {
            const resource = arg2;
            modifiedResource = resource;
            label = (0, nls_1.localize)('localHistoryCompareToFileEditorLabel', "{0} ({1} • {2}) ↔ {3}", arg1.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(arg1.source), toLocalHistoryEntryDateLabel(arg1.timestamp), arg1.workingCopy.name);
        }
        // Compare with another entry
        else {
            const modified = arg2;
            modifiedResource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: modified.location, associatedResource: modified.workingCopy.resource });
            label = (0, nls_1.localize)('localHistoryCompareToPreviousEditorLabel', "{0} ({1} • {2}) ↔ {3} ({4} • {5})", arg1.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(arg1.source), toLocalHistoryEntryDateLabel(arg1.timestamp), modified.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(modified.source), toLocalHistoryEntryDateLabel(modified.timestamp));
        }
        return [
            originalResource,
            modifiedResource,
            label,
            undefined // important to keep order of arguments in command proper
        ];
    }
    async function findLocalHistoryEntry(workingCopyHistoryService, descriptor) {
        const entries = await workingCopyHistoryService.getEntries(descriptor.uri, cancellation_1.CancellationToken.None);
        let currentEntry = undefined;
        let previousEntry = undefined;
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.id === descriptor.handle) {
                currentEntry = entry;
                previousEntry = entries[i - 1];
                break;
            }
        }
        return {
            entry: currentEntry,
            previous: previousEntry
        };
    }
    const SEP = /\//g;
    function toLocalHistoryEntryDateLabel(timestamp) {
        return `${(0, localHistory_1.getLocalHistoryDateFormatter)().format(timestamp).replace(SEP, '-')}`; // preserving `/` will break editor labels, so replace it with a non-path symbol
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5Q29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sb2NhbEhpc3RvcnkvYnJvd3Nlci9sb2NhbEhpc3RvcnlDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwa0JoRyxzREFtQ0M7SUFFRCxzREFtQkM7SUFubUJELE1BQU0sc0JBQXNCLEdBQUcsSUFBQSxlQUFTLEVBQUMsdUJBQXVCLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFPbkYsMkJBQTJCO0lBRWQsUUFBQSx1QkFBdUIsR0FBRyxJQUFBLGVBQVMsRUFBQyw4QkFBOEIsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBRXRHLElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLCtDQUErQztnQkFDbkQsS0FBSyxFQUFFLCtCQUF1QjtnQkFDOUIsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLG1CQUFtQjtvQkFDOUIsS0FBSyxFQUFFLFdBQVc7b0JBQ2xCLEtBQUssRUFBRSxDQUFDO29CQUNSLElBQUksRUFBRSw2Q0FBOEI7aUJBQ3BDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxJQUE4QjtZQUNuRSxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUFlLENBQUMsQ0FBQztZQUNyRCxNQUFNLHlCQUF5QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0NBQTBCLENBQUMsQ0FBQztZQUUzRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUMs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