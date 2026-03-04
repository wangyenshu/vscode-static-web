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
define(["require", "exports", "vs/base/common/event", "vs/base/common/map", "vs/editor/common/core/range", "vs/editor/contrib/codelens/browser/codelens", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/base/browser/window", "vs/base/browser/dom"], function (require, exports, event_1, map_1, range_1, codelens_1, extensions_1, instantiation_1, storage_1, window_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeLensCache = exports.ICodeLensCache = void 0;
    exports.ICodeLensCache = (0, instantiation_1.createDecorator)('ICodeLensCache');
    class CacheItem {
        constructor(lineCount, data) {
            this.lineCount = lineCount;
            this.data = data;
        }
    }
    let CodeLensCache = class CodeLensCache {
        constructor(storageService) {
            this._fakeProvider = new class {
                provideCodeLenses() {
                    throw new Error('not supported');
                }
            };
            this._cache = new map_1.LRUCache(20, 0.75);
            // remove old data
            const oldkey = 'codelens/cache';
            (0, dom_1.runWhenWindowIdle)(window_1.mainWindow, () => storageService.remove(oldkey, 1 /* StorageScope.WORKSPACE */));
            // restore lens data on start
            const key = 'codelens/cache2';
            const raw = storageService.get(key, 1 /* StorageScope.WORKSPACE */, '{}');
            this._deserialize(raw);
            // store lens data on shutdown
            event_1.Event.once(storageService.onWillSaveState)(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    storageService.store(key, this._serialize(), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                }
            });
        }
        put(model, data) {
            // create a copy of the model that is without command-ids
            // but with comand-labels
            const copyItems = data.lenses.map(item => {
                return {
                    range: item.symbol.range,
                    command: item.symbol.command && { id: '', title: item.symbol.command?.title },
                };
            });
            const copyModel = new codelens_1.CodeLensModel();
            copyModel.add({ lenses: copyItems, dispose: () => { } }, this._fakeProvider);
            const item = new CacheItem(model.getLineCount(), copyModel);
            this._cache.set(model.uri.toString(), item);
        }
        get(model) {
            const item = this._cache.get(model.uri.toString());
            return item && item.lineCount === model.getLineCount() ? item.data : undefined;
        }
        delete(model) {
            this._cache.delete(model.uri.toString());
        }
        // --- persistence
        _serialize() {
            const data = Object.create(null);
            for (const [key, value] of this._cache) {
                const lines = new Set();
                for (const d of value.data.lenses) {
                    lines.add(d.symbol.range.startLineNumber);
                }
                data[key] = {
                    lineCount: value.lineCount,
                    lines: [...lines.values()]
                };
            }
            return JSON.stringify(data);
        }
        _deserialize(raw) {
            try {
                const data = JSON.parse(raw);
                for (const key in data) {
                    const element = data[key];
                    const lenses = [];
                    for (const line of element.lines) {
                        lenses.push({ range: new range_1.Range(line, 1, line, 11) });
                    }
                    const model = new codelens_1.CodeLensModel();
                    model.add({ lenses, dispose() { } }, this._fakeProvider);
                    this._cache.set(key, new CacheItem(element.lineCount, model));
                }
            }
            catch {
                // ignore...
            }
        }
    };
    exports.CodeLensCache = CodeLensCache;
    exports.CodeLensCache = CodeLensCache = __decorate([
        __param(0, storage_1.IStorageService)
    ], CodeLensCache);
    (0, extensions_1.registerSingleton)(exports.ICodeLensCache, CodeLensCache, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUxlbnNDYWNoZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvZGVsZW5zL2Jyb3dzZXIvY29kZUxlbnNDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjbkYsUUFBQSxjQUFjLEdBQUcsSUFBQSwrQkFBZSxFQUFpQixnQkFBZ0IsQ0FBQyxDQUFDO0lBY2hGLE1BQU0sU0FBUztRQUVkLFlBQ1UsU0FBaUIsRUFDakIsSUFBbUI7WUFEbkIsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixTQUFJLEdBQUosSUFBSSxDQUFlO1FBQ3pCLENBQUM7S0FDTDtJQUVNLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7UUFZekIsWUFBNkIsY0FBK0I7WUFSM0Msa0JBQWEsR0FBRyxJQUFJO2dCQUNwQyxpQkFBaUI7b0JBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7YUFDRCxDQUFDO1lBRWUsV0FBTSxHQUFHLElBQUksY0FBUSxDQUFvQixFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFJbkUsa0JBQWtCO1lBQ2xCLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDO1lBQ2hDLElBQUEsdUJBQWlCLEVBQUMsbUJBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0saUNBQXlCLENBQUMsQ0FBQztZQUUzRiw2QkFBNkI7WUFDN0IsTUFBTSxHQUFHLEdBQUcsaUJBQWlCLENBQUM7WUFDOUIsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGtDQUEwQixJQUFJLENBQUMsQ0FBQztZQUNsRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXZC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