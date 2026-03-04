/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostWebview", "./cache", "./extHost.protocol", "./extHostTypes"], function (require, exports, cancellation_1, hash_1, lifecycle_1, network_1, resources_1, uri_1, typeConverters, extHostWebview_1, cache_1, extHostProtocol, extHostTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostCustomEditors = void 0;
    class CustomDocumentStoreEntry {
        constructor(document, _storagePath) {
            this.document = document;
            this._storagePath = _storagePath;
            this._backupCounter = 1;
            this._edits = new cache_1.Cache('custom documents');
        }
        addEdit(item) {
            return this._edits.add([item]);
        }
        async undo(editId, isDirty) {
            await this.getEdit(editId).undo();
            if (!isDirty) {
                this.disposeBackup();
            }
        }
        async redo(editId, isDirty) {
            await this.getEdit(editId).redo();
            if (!isDirty) {
                this.disposeBackup();
            }
        }
        disposeEdits(editIds) {
            for (const id of editIds) {
                this._edits.delete(id);
            }
        }
        getNewBackupUri() {
            if (!this._storagePath) {
                throw new Error('Backup requires a valid storage path');
            }
            const fileName = hashPath(this.document.uri) + (this._backupCounter++);
            return (0, resources_1.joinPath)(this._storagePath, fileName);
        }
        updateBackup(backup) {
            this._backup?.delete();
            this._backup = backup;
        }
        disposeBackup() {
            this._backup?.delete();
            this._backup = undefined;
        }
        getEdit(editId) {
            const edit = this._edits.get(editId, 0);
            if (!edit) {
                throw new Error('No edit found');
            }
            return edit;
        }
    }
    class CustomDocumentStore {
        constructor() {
            this._documents = new Map();
        }
        get(viewType, resource) {
            return this._documents.get(this.key(viewType, resource));
        }
        add(viewType, document, storagePath) {
            const key = this.key(viewType, document.uri);
            if (this._documents.has(key)) {
                throw new Error(`Document already exists for viewType:${viewType} resource:${document.uri}`);
            }
            const entry = new CustomDocumentStoreEntry(document, storagePath);
            this._documents.set(key, entry);
            return entry;
        }
        delete(viewType, document) {
            const key = this.key(viewType, document.uri);
            this._documents.delete(key);
        }
        key(viewType, resource) {
            return `${viewType}@@@${resource}`;
        }
    }
    var CustomEditorType;
    (function (CustomEditorType) {
        CustomEditorType[CustomEditorType["Text"] = 0] = "Text";
        CustomEditorType[CustomEditorType["Custom"] = 1] = "Custom";
    })(CustomEditorType || (CustomEditorType = {}));
    class EditorProviderStore {
        constructor() {
            this._providers = new Map();
        }
        addTextProvider(viewType, extension, provider) {
            return this.add(0 /* CustomEditorType.Text */, viewType, extension, provider);
        }
        addCustomProvider(viewType, extension, provider) {
            return this.add(1 /* CustomEditorType.Custom */, viewType, extension, provider);
        }
        get(viewType) {
            return this._providers.get(viewType);
        }
        add(type, viewType, extension, provider) {
            if (this._providers.has(viewType)) {
                throw new Error(`Provider for viewType:${viewType} already registered`);
            }
            this._providers.set(viewType, { type, extension, provider });
            return new extHostTypes.Disposable(() => this._providers.delete(viewType));
        }
    }
    class ExtHostCustomEditors {
        constructor(mainContext, _extHostDocuments, _extensionStoragePaths, _extHostWebview, _extHostWebviewPanels) {
            this._extHostDocuments = _extHostDocuments;
            this._extensionStoragePaths = _extensionStoragePaths;
            this._extHostWebview = _extHostWebview;
            this._extHostWebviewPanels = _extHostWebviewPanels;
            this._editorProviders = new EditorProviderStore();
            this._documents = new CustomDocumentStore();
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadCustomEditors);
        }
        registerCustomEditorProvider(extension, viewType, provider, options) {
            const disposables = new lifecycle_1.DisposableStore();
            if (isCustomTextEditorProvider(provider)) {
                disposables.add(this._editorProviders.addTextProvider(viewType, extension, provider));
                this._proxy.$registerTextEditorProvider((0, extHostWebview_1.toExtensionData)(extension), viewType, options.webviewOptions || {}, {
                    supportsMove: !!provider.moveCustomTextEditor,
                }, (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension));
            }
            else {
                disposables.add(this._editorProviders.addCustomProvider(viewType, extension, provider));
                if (isCustomEditorProviderWithEditingCapability(provider)) {
                    disposables.add(provider.onDidChangeCustomDocument(e => {
                        const entry = this.getCustomDocumentEntry(viewType, e.document.uri);
                        if (isEditEvent(e)) {
                            const editId = entry.addEdit(e);
                            this._proxy.$onDidEdit(e.document.uri, viewType, editId, e.label);
                        }
                        else {
                            this._proxy.$onContentChange(e.document.uri, viewType);
                        }
                    }));
                }
                this._proxy.$registerCustomEditorProvider((0, extHostWebview_1.toExtensionData)(extension), viewType, options.webviewOptions || {}, !!options.supportsMultipleEditorsPerDocument, (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension));
            }
            return extHostTypes.Disposable.from(disposables, new extHostTypes.Disposable(() => {
                this._proxy.$unregisterEditorProvider(viewType);
            }));
        }
        async $createCustomDocument(resource, viewType, backupId, untitledDocumentData, cancellation) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            if (entry.type !== 1 /* CustomEditorType.Custom */) {
                throw new Error(`Invalid provide type for '${viewType}'`);
            }
            const revivedResource = uri_1.URI.revive(resource);
            const document = await entry.provider.openCustomDocument(revivedResource, { backupId, untitledDocumentData: untitledDocumentData?.buffer }, cancellation);
            let storageRoot;
            if (isCustomEditorProviderWithEditingCapability(entry.provider) && this._extensionStoragePaths) {
                storageRoot = this._extensionStoragePaths.workspaceValue(entry.extension) ?? this._extensionStoragePaths.globalValue(entry.extension);
            }
            this._documents.add(viewType, document, storageRoot);
            return { editable: isCustomEditorProviderWithEditingCapability(entry.provider) };
        }
        async $disposeCustomDocument(resource, viewType) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            if (entry.type !== 1 /* CustomEditorType.Custom */) {
                throw new Error(`Invalid provider type for '${viewType}'`);
            }
            const revivedResource = uri_1.URI.revive(resource);
            const { document } = this.getCustomDocumentEntry(viewType, revivedResource);
            this._documents.delete(viewType, document);
            document.dispose();
        }
        async $resolveCustomEditor(resource, handle, viewType, initData, position, cancellation) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            const viewColumn = typeConverters.ViewColumn.to(position);
            const webview = this._extHostWebview.createNewWebview(handle, initData.contentOptions, entry.extension);
            const panel = this._extHostWebviewPanels.createNewWebviewPanel(handle, viewType, initData.title, viewColumn, initData.options, webview, initData.active);
            const revivedResource = uri_1.URI.revive(resource);
            switch (entry.type) {
                case 1 /* CustomEditorType.Custom */: {
                    const { document } = this.getCustomDocumentEntry(viewType, revivedResource);
                    return entry.provider.resolveCustomEditor(document, panel, cancellation);
                }
                case 0 /* CustomEditorType.Text */: {
                    const document = this._extHostDocuments.getDocument(revivedResource);
                    return entry.provider.resolveCustomTextEditor(document, panel, cancellation);
                }
                default: {
                    throw new Error('Unknown webview provider type');
                }
            }
        }
        $disposeEdits(resourceComponents, viewType, editIds) {
            const document = this.getCustomDocumentEntry(viewType, resourceComponents);
            document.disposeEdits(editIds);
        }
        async $onMoveCustomEditor(handle, newResourceComponents, viewType) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            if (!entry.provider.moveCustomTextEditor) {
                throw new Error(`Provider does not implement move '${viewType}'`);
            }
            const webview = this._extHostWebviewPanels.getWebviewPanel(handle);
            if (!webview) {
                throw new Error(`No webview found`);
            }
            const resource = uri_1.URI.revive(newResourceComponents);
            const document = this._extHostDocuments.getDocument(resource);
            await entry.provider.moveCustomTextEditor(document, webview, cancellation_1.CancellationToken.None);
        }
        async $undo(resourceComponents, viewType, editId, isDirty) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            return entry.undo(editId, isDirty);
        }
        async $redo(resourceComponents, viewType, editId, isDirty) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            return entry.redo(editId, isDirty);
        }
        async $revert(resourceComponents, viewType, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            await provider.revertCustomDocument(entry.document, cancellation);
            entry.disposeBackup();
        }
        async $onSave(resourceComponents, viewType, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            await provider.saveCustomDocument(entry.document, cancellation);
            entry.disposeBackup();
        }
        async $onSaveAs(resourceComponents, viewType, targetResource, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            return provider.saveCustomDocumentAs(entry.document, uri_1.URI.revive(targetResource), cancellation);
        }
        async $backup(resourceComponents, viewType, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            const backup = await provider.backupCustomDocument(entry.document, {
                destination: entry.getNewBackupUri(),
            }, cancellation);
            entry.updateBackup(backup);
            return backup.id;
        }
        getCustomDocumentEntry(viewType, resource) {
            const entry = this._documents.get(viewType, uri_1.URI.revive(resource));
            if (!entry) {
                throw new Error('No custom document found');
            }
            return entry;
        }
        getCustomEditorProvider(viewType) {
            const entry = this._editorProviders.get(viewType);
            const provider = entry?.provider;
            if (!provider || !isCustomEditorProviderWithEditingCapability(provider)) {
                throw new Error('Custom document is not editable');
            }
            return provider;
        }
    }
    exports.ExtHostCustomEditors = ExtHostCustomEditors;
    function isCustomEditorProviderWithEditingCapability(provider) {
        return !!provider.onDidChangeCustomDocument;
    }
    function isCustomTextEditorProvider(provider) {
        return typeof provider.resolveCustomTextEditor === 'function';
    }
    function isEditEvent(e) {
        return typeof e.undo === 'function'
            && typeof e.redo === 'function';
    }
    function hashPath(resource) {
        const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
        return (0, hash_1.hash)(str) + '';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEN1c3RvbUVkaXRvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Q3VzdG9tRWRpdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzQmhHLE1BQU0sd0JBQXdCO1FBSTdCLFlBQ2lCLFFBQStCLEVBQzlCLFlBQTZCO1lBRDlCLGFBQVEsR0FBUixRQUFRLENBQXVCO1lBQzlCLGlCQUFZLEdBQVosWUFBWSxDQUFpQjtZQUp2QyxtQkFBYyxHQUFHLENBQUMsQ0FBQztZQU9WLFdBQU0sR0FBRyxJQUFJLGFBQUssQ0FBaUMsa0JBQWtCLENBQUMsQ0FBQztRQUZwRixDQUFDO1FBTUwsT0FBTyxDQUFDLElBQW9DO1lBQzNDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQWMsRUFBRSxPQUFnQjtZQUMxQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBYyxFQUFFLE9BQWdCO1lBQzFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RCLENBQUM7UUFDRixDQUFDO1FBRUQsWUFBWSxDQUFDLE9B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