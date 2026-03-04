/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "./extHost.protocol", "vs/base/common/network", "vs/base/common/cancellation", "vs/base/common/strings"], function (require, exports, errors_1, uri_1, extHostTypes_1, extHost_protocol_1, network_1, cancellation_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocumentContentProvider = void 0;
    class ExtHostDocumentContentProvider {
        static { this._handlePool = 0; }
        constructor(mainContext, _documentsAndEditors, _logService) {
            this._documentsAndEditors = _documentsAndEditors;
            this._logService = _logService;
            this._documentContentProviders = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDocumentContentProviders);
        }
        registerTextDocumentContentProvider(scheme, provider) {
            // todo@remote
            // check with scheme from fs-providers!
            if (Object.keys(network_1.Schemas).indexOf(scheme) >= 0) {
                throw new Error(`scheme '${scheme}' already registered`);
            }
            const handle = ExtHostDocumentContentProvider._handlePool++;
            this._documentContentProviders.set(handle, provider);
            this._proxy.$registerTextContentProvider(handle, scheme);
            let subscription;
            if (typeof provider.onDidChange === 'function') {
                let lastEvent;
                subscription = provider.onDidChange(async (uri) => {
                    if (uri.scheme !== scheme) {
                        this._logService.warn(`Provider for scheme '${scheme}' is firing event for schema '${uri.scheme}' which will be IGNORED`);
                        return;
                    }
                    if (!this._documentsAndEditors.getDocument(uri)) {
                        // ignore event if document isn't open
                        return;
                    }
                    if (lastEvent) {
                        await lastEvent;
                    }
                    const thisEvent = this.$provideTextDocumentContent(handle, uri)
                        .then(async (value) => {
                        if (!value && typeof value !== 'string') {
                            return;
                        }
                        const document = this._documentsAndEditors.getDocument(uri);
                        if (!document) {
                            // disposed in the meantime
                            return;
                        }
                        // create lines and compare
                        const lines = (0, strings_1.splitLines)(value);
                        // broadcast event when content changed
                        if (!document.equalLines(lines)) {
                            return this._proxy.$onVirtualDocumentChange(uri, value);
                        }
                    })
                        .catch(errors_1.onUnexpectedError)
                        .finally(() => {
                        if (lastEvent === thisEvent) {
                            lastEvent = undefined;
                        }
                    });
                    lastEvent = thisEvent;
                });
            }
            return new extHostTypes_1.Disposable(() => {
                if (this._documentContentProviders.delete(handle)) {
                    this._proxy.$unregisterTextContentProvider(handle);
                }
                if (subscription) {
                    subscription.dispose();
                    subscription = undefined;
                }
            });
        }
        $provideTextDocumentContent(handle, uri) {
            const provider = this._documentContentProviders.get(handle);
            if (!provider) {
                return Promise.reject(new Error(`unsupported uri-scheme: ${uri.scheme}`));
            }
            return Promise.resolve(provider.provideTextDocumentContent(uri_1.URI.revive(uri), cancellation_1.CancellationToken.None));
        }
    }
    exports.ExtHostDocumentContentProvider = ExtHostDocumentContentProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50Q29udGVudFByb3ZpZGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3REb2N1bWVudENvbnRlbnRQcm92aWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQWEsOEJBQThCO2lCQUUzQixnQkFBVyxHQUFHLENBQUMsQUFBSixDQUFLO1FBSy9CLFlBQ0MsV0FBeUIsRUFDUixvQkFBZ0QsRUFDaEQsV0FBd0I7WUFEeEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUE0QjtZQUNoRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQU56Qiw4QkFBeUIsR0FBRyxJQUFJLEdBQUcsRUFBOEMsQ0FBQztZQVFsRyxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFFRCxtQ0FBbUMsQ0FBQyxNQUFjLEVBQUUsUUFBNEM7WUFDL0YsY0FBYztZQUNkLHVDQUF1QztZQUN2QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLE1BQU0sc0JBQXNCLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsOEJBQThCLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFNUQsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENB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