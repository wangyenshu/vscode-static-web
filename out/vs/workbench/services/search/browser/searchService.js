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
define(["require", "exports", "vs/editor/common/services/model", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchService", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/worker/simpleWorker", "vs/base/common/lifecycle", "vs/base/browser/defaultWorkerFactory", "vs/platform/instantiation/common/extensions", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/event", "vs/nls", "vs/platform/files/browser/webFileSystemAccess", "vs/base/common/marshalling"], function (require, exports, model_1, files_1, instantiation_1, log_1, telemetry_1, editorService_1, extensions_1, search_1, searchService_1, uriIdentity_1, simpleWorker_1, lifecycle_1, defaultWorkerFactory_1, extensions_2, decorators_1, network_1, uri_1, event_1, nls_1, webFileSystemAccess_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalFileSearchWorkerClient = exports.RemoteSearchService = void 0;
    let RemoteSearchService = class RemoteSearchService extends searchService_1.SearchService {
        constructor(modelService, editorService, telemetryService, logService, extensionService, fileService, instantiationService, uriIdentityService) {
            super(modelService, editorService, telemetryService, logService, extensionService, fileService, uriIdentityService);
            this.instantiationService = instantiationService;
            const searchProvider = this.instantiationService.createInstance(LocalFileSearchWorkerClient);
            this.registerSearchResultProvider(network_1.Schemas.file, 0 /* SearchProviderType.file */, searchProvider);
            this.registerSearchResultProvider(network_1.Schemas.file, 1 /* SearchProviderType.text */, searchProvider);
        }
    };
    exports.RemoteSearchService = RemoteSearchService;
    exports.RemoteSearchService = RemoteSearchService = __decorate([
        __param(0, model_1.IModelService),
        __param(1, editorService_1.IEditorService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, log_1.ILogService),
        __param(4, extensions_1.IExtensionService),
        __param(5, files_1.IFileService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, uriIdentity_1.IUriIdentityService)
    ], RemoteSearchService);
    let LocalFileSearchWorkerClient = class LocalFileSearchWorkerClient extends lifecycle_1.Disposable {
        constructor(fileService, uriIdentityService) {
            super();
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this._onDidReceiveTextSearchMatch = new event_1.Emitter();
            this.onDidReceiveTextSearchMatch = this._onDidReceiveTextSearchMatch.event;
            this.queryId = 0;
            this._worker = null;
            this._workerFactory = new defaultWorkerFactory_1.DefaultWorkerFactory('localFileSearchWorker');
        }
        sendTextSearchMatch(match, queryId) {
            this._onDidReceiveTextSearchMatch.fire({ match, queryId });
        }
        get fileSystemProvider() {
            return this.fileService.getProvider(network_1.Schemas.file);
        }
        async cancelQuery(queryId) {
            const proxy = await this._getOrCreateWorker().getProxyObject();
            proxy.cancelQuery(queryId);
        }
        async textSearch(query, onProgress, token) {
            try {
                const queryDisposables = new lifecycle_1.DisposableStore();
                const proxy = await this._getOrCreateWorker().getProxyObject();
                const results = [];
                let limitHit = false;
                await Promise.all(query.folderQueries.map(async (fq) => {
                    const queryId = this.queryId++;
                    queryDisposables.add(token?.onCancellationRequested(e => this.cancelQuery(queryId)) || lifecycle_1.Disposable.None);
                    const handle = await this.fileSystemProvider.getHandle(fq.folder);
                    if (!handle || !webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(handle)) {
                        console.error('Could not get directory handle for ', fq);
                        return;
                    }
                    // force resource to revive using URI.revive.
                    // TODO @andrea see why we can't just use `revive()` below. For some reason, (<MarshalledObject>obj).$mid was undefined for result.resource
                    const reviveMatch = (result) => ({
                        resource: uri_1.URI.revive(result.resource),
                        results: (0, marshalling_1.revive)(result.results)
                    });
                    queryDisposables.add(this.onDidReceiveTextSearchMatch(e => {
                        if (e.queryId === queryId) {
                            onProgress?.(reviveMatch(e.match));
                        }
                    }));
                    const ignorePathCasing = this.uriIdentityService.extUri.ignorePathCasing(fq.folder);
                    const folderResults = await proxy.searchDirectory(handle, query, fq, ignorePathCasing, queryId);
                    for (const folderResult of folderResults.results) {
                        results.push((0, marshalling_1.revive)(folderResult));
                    }
                    if (folderResults.limitHit) {
                        limitHit = true;
                    }
                }));
                queryDisposables.dispose();
                const result = { messages: [], results, limitHit };
                return result;
            }
            catch (e) {
                console.error('Error performing web worker text search', e);
                return {
                    results: [],
                    messages: [{
                            text: (0, nls_1.localize)('errorSearchText', "Unable to search with Web Worker text searcher"), type: search_1.TextSearchCompleteMessageType.Warning
                        }],
                };
            }
        }
        async fileSearch(query, token) {
            try {
                const queryDisposables = new lifecycle_1.DisposableStore();
                let limitHit = false;
                const proxy = await this._getOrCreateWorker().getProxyObject();
                const results = [];
                await Promise.all(query.folderQueries.map(async (fq) => {
                    const queryId = this.queryId++;
                    queryDisposables.add(token?.onCancellationRequested(e => this.cancelQuery(queryId)) || lifecycle_1.Disposable.None);
                    const handle = await this.fileSystemProvider.getHandle(fq.folder);
                    if (!handle || !webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(handle)) {
                        console.error('Could not get directory handle for ', fq);
                        return;
                    }
                    const caseSensitive = this.uriIdentityService.extUri.ignorePathCasing(fq.folder);
                    const folderResults = await proxy.listDirectory(handle, query, fq, caseSensitive, queryId);
                    for (const folderResult of folderResults.results) {
                        results.push({ resource: uri_1.URI.joinPath(fq.folder, folderResult) });
                    }
                    if (folderResults.limitHit) {
                        limitHit = true;
                    }
                }));
                queryDisposables.dispose();
                const result = { messages: [], results, limitHit };
                return result;
            }
            catch (e) {
                console.error('Error performing web worker file search', e);
                return {
                    results: [],
                    messages: [{
                            text: (0, nls_1.localize)('errorSearchFile', "Unable to search with Web Worker file searcher"), type: search_1.TextSearchCompleteMessageType.Warning
                        }],
                };
            }
        }
        async clearCache(cacheKey) {
            if (this.cache?.key === cacheKey) {
                this.cache = undefined;
            }
        }
        _getOrCreateWorker() {
            if (!this._worker) {
                try {
                    this._worker = this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/workbench/services/search/worker/localFileSearch', this));
                }
                catch (err) {
                    (0, simpleWorker_1.logOnceWebWorkerWarning)(err);
                    throw err;
                }
            }
            return this._worker;
        }
    };
    exports.LocalFileSearchWorkerClient = LocalFileSearchWorkerClient;
    __decorate([
        decorators_1.memoize
    ], LocalFileSearchWorkerClient.prototype, "fileSystemProvider", null);
    exports.LocalFileSearchWorkerClient = LocalFileSearchWorkerClient = __decorate([
        __param(0, files_1.IFileService),
        __param(1, uriIdentity_1.IUriIdentityService)
    ], LocalFileSearchWorkerClient);
    (0, extensions_2.registerSingleton)(search_1.ISearchService, RemoteSearchService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvYnJvd3Nlci9zZWFyY2hTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSw2QkFBYTtRQUNyRCxZQUNnQixZQUEyQixFQUMxQixhQUE2QixFQUMxQixnQkFBbUMsRUFDekMsVUFBdUIsRUFDakIsZ0JBQW1DLEVBQ3hDLFdBQXlCLEVBQ0Msb0JBQTJDLEVBQzlELGtCQUF1QztZQUU1RCxLQUFLLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFINUUseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUluRixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDN0YsSUFBSSxDQUFDLDRCQUE0QixDQUFDLGlCQUFPLENBQUMsSUFBSSxtQ0FBMkIsY0FBYyxDQUFDLENBQUM7WUFDekYsSUFBSSxDQUFDLDRCQUE0QixDQUFDLGlCQUFPLENBQUMsSUFBSSxtQ0FBMkIsY0FBYyxDQUFDLENBQUM7UUFDMUYsQ0FBQztLQUNELENBQUE7SUFoQlksa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFFN0IsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxpQ0FBbUIsQ0FBQTtPQVRULG1CQUFtQixDQWdCL0I7SUFFTSxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO1FBWTFELFlBQ2UsV0FBaUMsRUFDMUIsa0JBQStDO1lBRXBFLEtBQUssRUFBRSxDQUFDO1lBSGMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQVRwRCxpQ0FBNEIsR0FBRyxJQUFJLGVBQU8sRUFBeUQsQ0FBQztZQUM1RyxnQ0FBMkIsR0FBaUUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEtBQUssQ0FBQztZQUlySSxZQUFPLEdBQVcsQ0FBQyxDQUFDO1lBTzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSwyQ0FBb0IsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxLQUFnQyxFQUFFLE9BQWU7WUFDcEUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFHRCxJQUFZLGtCQUFrQjtZQUM3QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLGlCQUFPLENBQUMsSUFBSSxDQUEyQixDQUFDO1FBQzdFLENBQUM7UUFFTyxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQWU7WUFDeEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUMvRCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQWlCLEVBQUUsVUFBNkMsRUFBRSxLQUF5QjtZQUMzRyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztnQkFFL0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDL0QsTUFBTSxPQUFPLEdBQWlCLEVBQUUsQ0FBQztnQkFFakMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO2dCQUVyQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDLEVBQUUsRUFBQyxFQUFFO29CQUNwRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQy9CLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksc0JBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFFeEcsTUFBTSxNQUFNLEdBQWlDLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ2hHLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyx5Q0FBbUIsQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO3dCQUN6RSxPQUFPLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUN6RCxPQUFPO29CQUNSLENBQUM7b0JBRUQsNkNBQTZDO29CQUM3QywySUFBMkk7b0JBQzNJLE1BQU0sV0FBVyxHQUFHLENBQUMsTUFBaUMsRUFBYyxFQUFFLENBQUMsQ0FBQzt3QkFDdkUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQzt3QkFDckMsT0FBTyxFQUFFLElBQUEsb0JBQU0sRUFBQyxNQUFNLENBQUMsT0FBTyxDQUFDO3FCQUMvQixDQUFDLENBQUM7b0JBRUgsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDekQsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRSxDQUFDOzRCQUMzQixVQUFVLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQ3BDLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFSixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNwRixNQUFNLGFBQWEsR0FBRyxNQUFNLEtBQUssQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ2hHLEtBQUssTUFBTSxZQUFZLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNsRCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUEsb0JBQU0sRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUNwQyxDQUFDO29CQUVELElBQUksYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUM1QixRQUFRLEdBQUcsSUFBSSxDQUFDO29CQUNqQixDQUFDO2dCQUVGLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sTUFBTSxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUM7Z0JBQ25ELE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyx5Q0FBeUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUQsT0FBTztvQkFDTixPQUFPLEVBQUUsRUFBRTtvQkFDWCxRQUFRLEVBQUUsQ0FBQzs0QkFDVixJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsZ0RBQWdELENBQUMsRUFBRSxJQUFJLEVBQUUsc0NBQTZCLENBQUMsT0FBTzt5QkFDaEksQ0FBQztpQkFDRixDQUFDO1lBQ0gsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQWlCLEVBQUUsS0FBeUI7WUFDNUQsSUFBSSxDQUFDO2dCQUNKLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7Z0JBQy9DLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztnQkFFckIsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDL0QsTUFBTSxPQUFPLEdBQWlCLEVBQUUsQ0FBQztnQkFDakMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsRUFBRTtvQkFDcEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUMvQixnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLHNCQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRXhHLE1BQU0sTUFBTSxHQUFpQyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNoRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMseUNBQW1CLENBQUMsMkJBQTJCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQzt3QkFDekUsT0FBTyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDekQsT0FBTztvQkFDUixDQUFDO29CQUNELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNqRixNQUFNLGFBQWEsR0FBRyxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUMzRixLQUFLLE1BQU0sWUFBWSxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDbEQsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNuRSxDQUFDO29CQUNELElBQUksYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7b0JBQUMsQ0FBQztnQkFDakQsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSixnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFM0IsTUFBTSxNQUFNLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixPQUFPLENBQUMsS0FBSyxDQUFDLHlDQUF5QyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxPQUFPO29CQUNOLE9BQU8sRUFBRSxFQUFFO29CQUNYLFFBQVEsRUFBRSxDQUFDOzRCQUNWLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxnREFBZ0QsQ0FBQyxFQUFFLElBQUksRUFBRSxzQ0FBNkIsQ0FBQyxPQUFPO3lCQUNoSSxDQUFDO2lCQUNGLENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBZ0I7WUFDaEMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFBQyxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztZQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVPLGtCQUFrQjtZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUM7b0JBQ0osSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksaUNBQWtCLENBQ25ELElBQUksQ0FBQyxjQUFjLEVBQ25CLHFEQUFxRCxFQUNyRCxJQUFJLENBQ0osQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxJQUFBLHNDQUF1QixFQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM3QixNQUFNLEdBQUcsQ0FBQztnQkFDWCxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO0tBQ0QsQ0FBQTtJQXZKWSxrRUFBMkI7SUEwQnZDO1FBREMsb0JBQU87eUVBR1A7MENBNUJXLDJCQUEyQjtRQWFyQyxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGlDQUFtQixDQUFBO09BZFQsMkJBQTJCLENBdUp2QztJQUVELElBQUEsOEJBQWlCLEVBQUMsdUJBQWMsRUFBRSxtQkFBbUIsb0NBQTRCLENBQUMifQ==