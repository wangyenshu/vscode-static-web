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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/types", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/log/common/log", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/extensions/common/proxyIdentifier", "../common/extHost.protocol", "vs/base/common/marshalling", "vs/base/common/arrays"], function (require, exports, buffer_1, cancellation_1, event_1, lifecycle_1, stopwatch_1, types_1, uri_1, commands_1, log_1, mainThreadNotebookDto_1, notebookCellStatusBarService_1, notebookService_1, extHostCustomers_1, proxyIdentifier_1, extHost_protocol_1, marshalling_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebooks = void 0;
    let MainThreadNotebooks = class MainThreadNotebooks {
        constructor(extHostContext, _notebookService, _cellStatusBarService, _logService) {
            this._notebookService = _notebookService;
            this._cellStatusBarService = _cellStatusBarService;
            this._logService = _logService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._notebookSerializer = new Map();
            this._notebookCellStatusBarRegistrations = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebook);
        }
        dispose() {
            this._disposables.dispose();
            (0, lifecycle_1.dispose)(this._notebookSerializer.values());
        }
        $registerNotebookSerializer(handle, extension, viewType, options, data) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(this._notebookService.registerNotebookSerializer(viewType, extension, {
                options,
                dataToNotebook: async (data) => {
                    const sw = new stopwatch_1.StopWatch();
                    let result;
                    if (data.byteLength === 0 && viewType === 'interactive') {
                        // we don't want any starting cells for an empty interactive window.
                        result = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto({ cells: [], metadata: {} });
                    }
                    else {
                        const dto = await this._proxy.$dataToNotebook(handle, data, cancellation_1.CancellationToken.None);
                        result = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto(dto.value);
                    }
                    this._logService.trace(`[NotebookSerializer] dataToNotebook DONE after ${sw.elapsed()}ms`, {
                        viewType,
                        extensionId: extension.id.value,
                    });
                    return result;
                },
                notebookToData: (data) => {
                    const sw = new stopwatch_1.StopWatch();
                    const result = this._proxy.$notebookToData(handle, new proxyIdentifier_1.SerializableObjectWithBuffers(mainThreadNotebookDto_1.NotebookDto.toNotebookDataDto(data)), cancellation_1.CancellationToken.None);
                    this._logService.trace(`[NotebookSerializer] notebookToData DONE after ${sw.elapsed()}`, {
                        viewType,
                        extensionId: extension.id.value,
                    });
                    return result;
                },
                save: async (uri, versionId, options, token) => {
                    const stat = await this._proxy.$saveNotebook(handle, uri, versionId, options, token);
                    return {
                        ...stat,
                        children: undefined,
                        resource: uri
                    };
                },
                searchInNotebooks: async (textQuery, token, allPriorityInfo) => {
                    const contributedType = this._notebookService.getContributedNotebookType(viewType);
                    if (!contributedType) {
                        return { results: [], limitHit: false };
                    }
                    const fileNames = contributedType.selectors;
                    const includes = fileNames.map((selector) => {
                        const globPattern = selector.include || selector;
                        return globPattern.toString();
                    });
                    if (!includes.length) {
                        return {
                            results: [], limitHit: false
                        };
                    }
                    const thisPriorityInfo = (0, arrays_1.coalesce)([{ isFromSettings: false, filenamePatterns: includes }, ...allPriorityInfo.get(viewType) ?? []]);
                    const otherEditorsPriorityInfo = Array.from(allPriorityInfo.keys())
                        .flatMap(key => {
                        if (key !== viewType) {
                            return allPriorityInfo.get(key) ?? [];
                        }
                        return [];
                    });
                    const searchComplete = await this._proxy.$searchInNotebooks(handle, textQuery, thisPriorityInfo, otherEditorsPriorityInfo, token);
                    const revivedResults = searchComplete.results.map(result => {
                        const resource = uri_1.URI.revive(result.resource);
                        return {
                            resource,
                            cellResults: result.cellResults.map(e => (0, marshalling_1.revive)(e))
                        };
                    });
                    return { results: revivedResults, limitHit: searchComplete.limitHit };
                }
            }));
            if (data) {
                disposables.add(this._notebookService.registerContributedNotebookType(viewType, data));
            }
            this._notebookSerializer.set(handle, disposables);
            this._logService.trace('[NotebookSerializer] registered notebook serializer', {
                viewType,
                extensionId: extension.id.value,
            });
        }
        $unregisterNotebookSerializer(handle) {
            this._notebookSerializer.get(handle)?.dispose();
            this._notebookSerializer.delete(handle);
        }
        $emitCellStatusBarEvent(eventHandle) {
            const emitter = this._notebookCellStatusBarRegistrations.get(eventHandle);
            if (emitter instanceof event_1.Emitter) {
                emitter.fire(undefined);
            }
        }
        async $registerNotebookCellStatusBarItemProvider(handle, eventHandle, viewType) {
            const that = this;
            const provider = {
                async provideCellStatusBarItems(uri, index, token) {
                    const result = await that._proxy.$provideNotebookCellStatusBarItems(handle, uri, index, token);
                    return {
                        items: result?.items ?? [],
                        dispose() {
                            if (result) {
                                that._proxy.$releaseNotebookCellStatusBarItems(result.cacheId);
                            }
                        }
                    };
                },
                viewType
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._notebookCellStatusBarRegistrations.set(eventHandle, emitter);
                provider.onDidChangeStatusBarItems = emitter.event;
            }
            const disposable = this._cellStatusBarService.registerCellStatusBarItemProvider(provider);
            this._notebookCellStatusBarRegistrations.set(handle, disposable);
        }
        async $unregisterNotebookCellStatusBarItemProvider(handle, eventHandle) {
            const unregisterThing = (handle) => {
                const entry = this._notebookCellStatusBarRegistrations.get(handle);
                if (entry) {
                    this._notebookCellStatusBarRegistrations.get(handle)?.dispose();
                    this._notebookCellStatusBarRegistrations.delete(handle);
                }
            };
            unregisterThing(handle);
            if (typeof eventHandle === 'number') {
                unregisterThing(eventHandle);
            }
        }
    };
    exports.MainThreadNotebooks = MainThreadNotebooks;
    exports.MainThreadNotebooks = MainThreadNotebooks = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadNotebook),
        __param(1, notebookService_1.INotebookService),
        __param(2, notebookCellStatusBarService_1.INotebookCellStatusBarService),
        __param(3, log_1.ILogService)
    ], MainThreadNotebooks);
    commands_1.CommandsRegistry.registerCommand('_executeDataToNotebook', async (accessor, ...args) => {
        const [notebookType, bytes] = args;
        (0, types_1.assertType)(typeof notebookType === 'string', 'string');
        (0, types_1.assertType)(bytes instanceof buffer_1.VSBuffer, 'VSBuffer');
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const info = await notebookService.withNotebookDataProvider(notebookType);
        if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
            return;
        }
        const dto = await info.serializer.dataToNotebook(bytes);
        return new proxyIdentifier_1.SerializableObjectWithBuffers(mainThreadNotebookDto_1.NotebookDto.toNotebookDataDto(dto));
    });
    commands_1.CommandsRegistry.registerCommand('_executeNotebookToData', async (accessor, ...args) => {
        const [notebookType, dto] = args;
        (0, types_1.assertType)(typeof notebookType === 'string', 'string');
        (0, types_1.assertType)(typeof dto === 'object');
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const info = await notebookService.withNotebookDataProvider(notebookType);
        if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
            return;
        }
        const data = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto(dto.value);
        const bytes = await info.serializer.notebookToData(data);
        return bytes;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWROb3RlYm9vay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5QnpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1FBUS9CLFlBQ0MsY0FBK0IsRUFDYixnQkFBbUQsRUFDdEMscUJBQXFFLEVBQ3ZGLFdBQXlDO1lBRm5CLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDckIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUErQjtZQUN0RSxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQVZ0QyxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBR3JDLHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBQ3JELHdDQUFtQyxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBUXJGLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixJQUFBLG1CQUFPLEVBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELDJCQUEyQixDQUFDLE1BQWMsRUFBRSxTQUF1QyxFQUFFLFFBQWdCLEVBQUUsT0FBeUIsRUFBRSxJQUEyQztZQUM1SyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUUxQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQywwQkFBMEIs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