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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/rawSearchService", "vs/workbench/services/search/node/ripgrepSearchProvider", "vs/workbench/services/search/node/ripgrepSearchUtils", "vs/workbench/services/search/node/textSearchManager"], function (require, exports, lifecycle_1, network_1, uri_1, pfs, log_1, extHostInitDataService_1, extHostRpcService_1, extHostSearch_1, extHostUriTransformerService_1, search_1, rawSearchService_1, ripgrepSearchProvider_1, ripgrepSearchUtils_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtHostSearch = void 0;
    let NativeExtHostSearch = class NativeExtHostSearch extends extHostSearch_1.ExtHostSearch {
        constructor(extHostRpc, initData, _uriTransformer, _logService) {
            super(extHostRpc, _uriTransformer, _logService);
            this._pfs = pfs; // allow extending for tests
            this._internalFileSearchHandle = -1;
            this._internalFileSearchProvider = null;
            this._registeredEHSearchProvider = false;
            this._disposables = new lifecycle_1.DisposableStore();
            const outputChannel = new ripgrepSearchUtils_1.OutputChannel('RipgrepSearchUD', this._logService);
            this._disposables.add(this.registerTextSearchProvider(network_1.Schemas.vscodeUserData, new ripgrepSearchProvider_1.RipgrepSearchProvider(outputChannel)));
            if (initData.remote.isRemote && initData.remote.authority) {
                this._registerEHSearchProviders();
            }
        }
        dispose() {
            this._disposables.dispose();
        }
        $enableExtensionHostSearch() {
            this._registerEHSearchProviders();
        }
        _registerEHSearchProviders() {
            if (this._registeredEHSearchProvider) {
                return;
            }
            this._registeredEHSearchProvider = true;
            const outputChannel = new ripgrepSearchUtils_1.OutputChannel('RipgrepSearchEH', this._logService);
            this._disposables.add(this.registerTextSearchProvider(network_1.Schemas.file, new ripgrepSearchProvider_1.RipgrepSearchProvider(outputChannel)));
            this._disposables.add(this.registerInternalFileSearchProvider(network_1.Schemas.file, new rawSearchService_1.SearchService('fileSearchProvider')));
        }
        registerInternalFileSearchProvider(scheme, provider) {
            const handle = this._handlePool++;
            this._internalFileSearchProvider = provider;
            this._internalFileSearchHandle = handle;
            this._proxy.$registerFileSearchProvider(handle, this._transformScheme(scheme));
            return (0, lifecycle_1.toDisposable)(() => {
                this._internalFileSearchProvider = null;
                this._proxy.$unregisterProvider(handle);
            });
        }
        $provideFileSearchResults(handle, session, rawQuery, token) {
            const query = (0, extHostSearch_1.reviveQuery)(rawQuery);
            if (handle === this._internalFileSearchHandle) {
                const start = Date.now();
                return this.doInternalFileSearch(handle, session, query, token).then(result => {
                    const elapsed = Date.now() - start;
                    this._logService.debug(`Ext host file search time: ${elapsed}ms`);
                    return result;
                });
            }
            return super.$provideFileSearchResults(handle, session, rawQuery, token);
        }
        doInternalFileSearchWithCustomCallback(rawQuery, token, handleFileMatch) {
            const onResult = (ev) => {
                if ((0, search_1.isSerializedFileMatch)(ev)) {
                    ev = [ev];
                }
                if (Array.isArray(ev)) {
                    handleFileMatch(ev.map(m => uri_1.URI.file(m.path)));
                    return;
                }
                if (ev.message) {
                    this._logService.debug('ExtHostSearch', ev.message);
                }
            };
            if (!this._internalFileSearchProvider) {
                throw new Error('No internal file search handler');
            }
            return this._internalFileSearchProvider.doFileSearch(rawQuery, onResult, token);
        }
        async doInternalFileSearch(handle, session, rawQuery, token) {
            return this.doInternalFileSearchWithCustomCallback(rawQuery, token, (data) => {
                this._proxy.$handleFileMatch(handle, session, data);
            });
        }
        $clearCache(cacheKey) {
            this._internalFileSearchProvider?.clearCache(cacheKey);
            return super.$clearCache(cacheKey);
        }
        createTextSearchManager(query, provider) {
            return new textSearchManager_1.NativeTextSearchManager(query, provider, undefined, 'textSearchProvider');
        }
    };
    exports.NativeExtHostSearch = NativeExtHostSearch;
    exports.NativeExtHostSearch = NativeExtHostSearch = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostUriTransformerService_1.IURITransformerService),
        __param(3, log_1.ILogService)
    ], NativeExtHostSearch);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRIb3N0U2VhcmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSw2QkFBYTtRQVdyRCxZQUNxQixVQUE4QixFQUN6QixRQUFpQyxFQUNsQyxlQUF1QyxFQUNsRCxXQUF3QjtZQUVyQyxLQUFLLENBQUMsVUFBVSxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQWZ2QyxTQUFJLEdBQWUsR0FBRyxDQUFDLENBQUMsNEJBQTRCO1lBRXRELDhCQUF5QixHQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGdDQUEyQixHQUF5QixJQUFJLENBQUM7WUFFekQsZ0NBQTJCLEdBQUcsS0FBSyxDQUFDO1lBRTNCLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFVckQsTUFBTSxhQUFhLEdBQUcsSUFBSSxrQ0FBYSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3RSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsaUJBQU8sQ0FBQyxjQUFjLEVBQUUsSUFBSSw2Q0FBcUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekgsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUMzRCxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUNuQyxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsWUFBWSxDQUFDLE9B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