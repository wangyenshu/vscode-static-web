/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostDocumentData", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/types", "vs/base/common/objects", "vs/workbench/api/common/extHostTypes"], function (require, exports, event_1, lifecycle_1, uri_1, extHost_protocol_1, extHostDocumentData_1, TypeConverters, types_1, objects_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocuments = void 0;
    class ExtHostDocuments {
        constructor(mainContext, documentsAndEditors) {
            this._onDidAddDocument = new event_1.Emitter();
            this._onDidRemoveDocument = new event_1.Emitter();
            this._onDidChangeDocument = new event_1.Emitter();
            this._onDidSaveDocument = new event_1.Emitter();
            this.onDidAddDocument = this._onDidAddDocument.event;
            this.onDidRemoveDocument = this._onDidRemoveDocument.event;
            this.onDidChangeDocument = this._onDidChangeDocument.event;
            this.onDidSaveDocument = this._onDidSaveDocument.event;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._documentLoader = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDocuments);
            this._documentsAndEditors = documentsAndEditors;
            this._documentsAndEditors.onDidRemoveDocuments(documents => {
                for (const data of documents) {
                    this._onDidRemoveDocument.fire(data.document);
                }
            }, undefined, this._toDispose);
            this._documentsAndEditors.onDidAddDocuments(documents => {
                for (const data of documents) {
                    this._onDidAddDocument.fire(data.document);
                }
            }, undefined, this._toDispose);
        }
        dispose() {
            this._toDispose.dispose();
        }
        getAllDocumentData() {
            return [...this._documentsAndEditors.allDocuments()];
        }
        getDocumentData(resource) {
            if (!resource) {
                return undefined;
            }
            const data = this._documentsAndEditors.getDocument(resource);
            if (data) {
                return data;
            }
            return undefined;
        }
        getDocument(resource) {
            const data = this.getDocumentData(resource);
            if (!data?.document) {
                throw new Error(`Unable to retrieve document from URI '${resource}'`);
            }
            return data.document;
        }
        ensureDocumentData(uri) {
            const cached = this._documentsAndEditors.getDocument(uri);
            if (cached) {
                return Promise.resolve(cached);
            }
            let promise = this._documentLoader.get(uri.toString());
            if (!promise) {
                promise = this._proxy.$tryOpenDocument(uri).then(uriData => {
                    this._documentLoader.delete(uri.toString());
                    const canonicalUri = uri_1.URI.revive(uriData);
                    return (0, types_1.assertIsDefined)(this._documentsAndEditors.getDocument(canonicalUri));
                }, err => {
                    this._documentLoader.delete(uri.toString());
                    return Promise.reject(err);
                });
                this._documentLoader.set(uri.toString(), promise);
            }
            return promise;
        }
        createDocumentData(options) {
            return this._proxy.$tryCreateDocument(options).then(data => uri_1.URI.revive(data));
        }
        $acceptModelLanguageChanged(uriComponents, newLanguageId) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            // Treat a language change as a remove + add
            this._onDidRemoveDocument.fire(data.document);
            data._acceptLanguageId(newLanguageId);
            this._onDidAddDocument.fire(data.document);
        }
        $acceptModelSaved(uriComponents) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            this.$acceptDirtyStateChanged(uriComponents, false);
            this._onDidSaveDocument.fire(data.document);
        }
        $acceptDirtyStateChanged(uriComponents, isDirty) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            data._acceptIsDirty(isDirty);
            this._onDidChangeDocument.fire({
                document: data.document,
                contentChanges: [],
                reason: undefined
            });
        }
        $acceptModelChanged(uriComponents, events, isDirty) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            data._acceptIsDirty(isDirty);
            data.onEvents(events);
            let reason = undefined;
            if (events.isUndoing) {
                reason = extHostTypes_1.TextDocumentChangeReason.Undo;
            }
            else if (events.isRedoing) {
                reason = extHostTypes_1.TextDocumentChangeReason.Redo;
            }
            this._onDidChangeDocument.fire((0, objects_1.deepFreeze)({
                document: data.document,
                contentChanges: events.changes.map((change) => {
                    return {
                        range: TypeConverters.Range.to(change.range),
                        rangeOffset: change.rangeOffset,
                        rangeLength: change.rangeLength,
                        text: change.text
                    };
                }),
                reason
            }));
        }
        setWordDefinitionFor(languageId, wordDefinition) {
            (0, extHostDocumentData_1.setWordDefinitionFor)(languageId, wordDefinition);
        }
    }
    exports.ExtHostDocuments = ExtHostDocuments;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3REb2N1bWVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEsZ0JBQWdCO1FBaUI1QixZQUFZLFdBQXlCLEVBQUUsbUJBQStDO1lBZnJFLHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUF1QixDQUFDO1lBQ3ZELHlCQUFvQixHQUFHLElBQUksZUFBTyxFQUF1QixDQUFDO1lBQzFELHlCQUFvQixHQUFHLElBQUksZUFBTyxFQUFrQyxDQUFDO1lBQ3JFLHVCQUFrQixHQUFHLElBQUksZUFBTyxFQUF1QixDQUFDO1lBRWhFLHFCQUFnQixHQUErQixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBQzVFLHdCQUFtQixHQUErQixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBQ2xGLHdCQUFtQixHQUEwQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBQzdGLHNCQUFpQixHQUErQixJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBRXRFLGVBQVUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUc1QyxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUF3QyxDQUFDO1lBR3pFLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG1CQUFtQixDQUFDO1lBRWhELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDMUQsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFT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