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
define(["require", "exports", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/workbench/services/dialogs/browser/abstractFileDialogService", "vs/base/common/network", "vs/base/common/decorators", "vs/nls", "vs/base/common/mime", "vs/base/common/resources", "vs/base/browser/dom", "vs/base/common/severity", "vs/base/common/buffer", "vs/platform/dnd/browser/dnd", "vs/base/common/iterator", "vs/platform/files/browser/webFileSystemAccess", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget"], function (require, exports, dialogs_1, extensions_1, abstractFileDialogService_1, network_1, decorators_1, nls_1, mime_1, resources_1, dom_1, severity_1, buffer_1, dnd_1, iterator_1, webFileSystemAccess_1, embeddedCodeEditorWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileDialogService = void 0;
    class FileDialogService extends abstractFileDialogService_1.AbstractFileDialogService {
        get fileSystemProvider() {
            return this.fileService.getProvider(network_1.Schemas.file);
        }
        async pickFileFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFilePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickFileFolderAndOpenSimplified(schema, options, false);
            }
            throw new Error((0, nls_1.localize)('pickFolderAndOpen', "Can't open folders, try adding a folder to the workspace instead."));
        }
        addFileSchemaIfNeeded(schema, isFolder) {
            return (schema === network_1.Schemas.untitled) ? [network_1.Schemas.file]
                : (((schema !== network_1.Schemas.file) && (!isFolder || (schema !== network_1.Schemas.vscodeRemote))) ? [schema, network_1.Schemas.file] : [schema]);
        }
        async pickFileAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFilePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickFileAndOpenSimplified(schema, options, false);
            }
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                return this.showUnsupportedBrowserWarning('open');
            }
            let fileHandle = undefined;
            try {
                ([fileHandle] = await activeWindow.showOpenFilePicker({ multiple: false }));
            }
            catch (error) {
                return; // `showOpenFilePicker` will throw an error when the user cancels
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(fileHandle)) {
                return;
            }
            const uri = await this.fileSystemProvider.registerFileHandle(fileHandle);
            this.addFileToRecentlyOpened(uri);
            await this.openerService.open(uri, { fromUserGesture: true, editorOptions: { pinned: true } });
        }
        async pickFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFolderPath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickFolderAndOpenSimplified(schema, options);
            }
            throw new Error((0, nls_1.localize)('pickFolderAndOpen', "Can't open folders, try adding a folder to the workspace instead."));
        }
        async pickWorkspaceAndOpen(options) {
            options.availableFileSystems = this.getWorkspaceAvailableFileSystems(options);
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultWorkspacePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickWorkspaceAndOpenSimplified(schema, options);
            }
            throw new Error((0, nls_1.localize)('pickWorkspaceAndOpen', "Can't open workspaces, try adding a folder to the workspace instead."));
        }
        async pickFileToSave(defaultUri, availableFileSystems) {
            const schema = this.getFileSystemSchema({ defaultUri, availableFileSystems });
            const options = this.getPickFileToSaveDialogOptions(defaultUri, availableFileSystems);
            if (this.shouldUseSimplified(schema)) {
                return super.pickFileToSaveSimplified(schema, options);
            }
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                return this.showUnsupportedBrowserWarning('save');
            }
            let fileHandle = undefined;
            const startIn = iterator_1.Iterable.first(this.fileSystemProvider.directories);
            try {
                fileHandle = await activeWindow.showSaveFilePicker({ types: this.getFilePickerTypes(options.filters), ...{ suggestedName: (0, resources_1.basename)(defaultUri), startIn } });
            }
            catch (error) {
                return; // `showSaveFilePicker` will throw an error when the user cancels
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(fileHandle)) {
                return undefined;
            }
            return this.fileSystemProvider.registerFileHandle(fileHandle);
        }
        getFilePickerTypes(filters) {
            return filters?.filter(filter => {
                return !((filter.extensions.length === 1) && ((filter.extensions[0] === '*') || filter.extensions[0] === ''));
            }).map(filter => {
                const accept = {};
                const extensions = filter.extensions.filter(ext => (ext.indexOf('-') < 0) && (ext.indexOf('*') < 0) && (ext.indexOf('_') < 0));
                accept[(0, mime_1.getMediaOrTextMime)(`fileName.${filter.extensions[0]}`) ?? 'text/plain'] = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
                return {
                    description: filter.name,
                    accept
                };
            });
        }
        async showSaveDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema)) {
                return super.showSaveDialogSimplified(schema, options);
            }
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                return this.showUnsupportedBrowserWarning('save');
            }
            let fileHandle = undefined;
            const startIn = iterator_1.Iterable.first(this.fileSystemProvider.directories);
            try {
                fileHandle = await activeWindow.showSaveFilePicker({ types: this.getFilePickerTypes(options.filters), ...options.defaultUri ? { suggestedName: (0, resources_1.basename)(options.defaultUri) } : undefined, ...{ startIn } });
            }
            catch (error) {
                return undefined; // `showSaveFilePicker` will throw an error when the user cancels
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(fileHandle)) {
                return undefined;
            }
            return this.fileSystemProvider.registerFileHandle(fileHandle);
        }
        async showOpenDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema)) {
                return super.showOpenDialogSimplified(schema, options);
            }
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                return this.showUnsupportedBrowserWarning('open');
            }
            let uri;
            const startIn = iterator_1.Iterable.first(this.fileSystemProvider.directories) ?? 'documents';
            try {
                if (options.canSelectFiles) {
                    const handle = await activeWindow.showOpenFilePicker({ multiple: false, types: this.getFilePickerTypes(options.filters), ...{ startIn } });
                    if (handle.length === 1 && webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(handle[0])) {
                        uri = await this.fileSystemProvider.registerFileHandle(handle[0]);
                    }
                }
                else {
                    const handle = await activeWindow.showDirectoryPicker({ ...{ startIn } });
                    uri = await this.fileSystemProvider.registerDirectoryHandle(handle);
                }
            }
            catch (error) {
                // ignore - `showOpenFilePicker` / `showDirectoryPicker` will throw an error when the user cancels
            }
            return uri ? [uri] : undefined;
        }
        async showUnsupportedBrowserWarning(context) {
            // When saving, try to just download the contents
            // of the active text editor if any as a workaround
            if (context === 'save') {
                const activeCodeEditor = this.codeEditorService.getActiveCodeEditor();
                if (!(activeCodeEditor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget)) {
                    const activeTextModel = activeCodeEditor?.getModel();
                    if (activeTextModel) {
                        (0, dom_1.triggerDownload)(buffer_1.VSBuffer.fromString(activeTextModel.getValue()).buffer, (0, resources_1.basename)(activeTextModel.uri));
                        return;
                    }
                }
            }
            // Otherwise inform the user about options
            const buttons = [
                {
                    label: (0, nls_1.localize)({ key: 'openRemote', comment: ['&& denotes a mnemonic'] }, "&&Open Remote..."),
                    run: async () => { await this.commandService.executeCommand('workbench.action.remote.showMenu'); }
                },
                {
                    label: (0, nls_1.localize)({ key: 'learnMore', comment: ['&& denotes a mnemonic'] }, "&&Learn More"),
                    run: async () => { await this.openerService.open('https://aka.ms/VSCodeWebLocalFileSystemAccess'); }
                }
            ];
            if (context === 'open') {
                buttons.push({
                    label: (0, nls_1.localize)({ key: 'openFiles', comment: ['&& denotes a mnemonic'] }, "Open &&Files..."),
                    run: async () => {
                        const files = await (0, dom_1.triggerUpload)();
                        if (files) {
                            const filesData = (await this.instantiationService.invokeFunction(accessor => (0, dnd_1.extractFileListData)(accessor, files))).filter(fileData => !fileData.isDirectory);
                            if (filesData.length > 0) {
                                this.editorService.openEditors(filesData.map(fileData => {
                                    return {
                                        resource: fileData.resource,
                                        contents: fileData.contents?.toString(),
                                        options: { pinned: true }
                                    };
                                }));
                            }
                        }
                    }
                });
            }
            await this.dialogService.prompt({
                type: severity_1.default.Warning,
                message: (0, nls_1.localize)('unsupportedBrowserMessage', "Opening Local Folders is Unsupported"),
                detail: (0, nls_1.localize)('unsupportedBrowserDetail', "Your browser doesn't support opening local folders.\nYou can either open single files or open a remote repository."),
                buttons
            });
            return undefined;
        }
        shouldUseSimplified(scheme) {
            return ![network_1.Schemas.file, network_1.Schemas.vscodeUserData, network_1.Schemas.tmp].includes(scheme);
        }
    }
    exports.FileDialogService = FileDialogService;
    __decorate([
        decorators_1.memoize
    ], FileDialogService.prototype, "fileSystemProvider", null);
    (0, extensions_1.registerSingleton)(dialogs_1.IFileDialogService, FileDialogService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZURpYWxvZ1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZGlhbG9ncy9icm93c2VyL2ZpbGVEaWFsb2dTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQW9CaEcsTUFBYSxpQkFBa0IsU0FBUSxxREFBeUI7UUFHL0QsSUFBWSxrQkFBa0I7WUFDN0IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxpQkFBTyxDQUFDLElBQUksQ0FBMkIsQ0FBQztRQUM3RSxDQUFDO1FBRUQsS0FBSyxDQUFDLHFCQUFxQixDQUFDLE9BQTRCO1lBQ3ZELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVqRCxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN6QixPQUFPLENBQUMsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxLQUFLLENBQUMsK0JBQStCLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0RSxDQUFDO1lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxtRUFBbUUsQ0FBQyxDQUFDLENBQUM7UUFDckgsQ0FBQztRQUVrQixxQkFBcUIsQ0FBQyxNQUFjLEVBQUUsUUFBaUI7WUFDekUsT0FBTyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFP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