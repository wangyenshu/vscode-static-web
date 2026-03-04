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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/ternarySearchTree", "vs/editor/common/languages", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage"], function (require, exports, async_1, lifecycle_1, map_1, ternarySearchTree_1, languages_1, configuration_1, extensions_1, instantiation_1, storage_1) {
    "use strict";
    var SuggestMemoryService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISuggestMemoryService = exports.SuggestMemoryService = exports.PrefixMemory = exports.LRUMemory = exports.NoMemory = exports.Memory = void 0;
    class Memory {
        constructor(name) {
            this.name = name;
        }
        select(model, pos, items) {
            if (items.length === 0) {
                return 0;
            }
            const topScore = items[0].score[0];
            for (let i = 0; i < items.length; i++) {
                const { score, completion: suggestion } = items[i];
                if (score[0] !== topScore) {
                    // stop when leaving the group of top matches
                    break;
                }
                if (suggestion.preselect) {
                    // stop when seeing an auto-select-item
                    return i;
                }
            }
            return 0;
        }
    }
    exports.Memory = Memory;
    class NoMemory extends Memory {
        constructor() {
            super('first');
        }
        memorize(model, pos, item) {
            // no-op
        }
        toJSON() {
            return undefined;
        }
        fromJSON() {
            //
        }
    }
    exports.NoMemory = NoMemory;
    class LRUMemory extends Memory {
        constructor() {
            super('recentlyUsed');
            this._cache = new map_1.LRUCache(300, 0.66);
            this._seq = 0;
        }
        memorize(model, pos, item) {
            const key = `${model.getLanguageId()}/${item.textLabel}`;
            this._cache.set(key, {
                touch: this._seq++,
                type: item.completion.kind,
                insertText: item.completion.insertText
            });
        }
        select(model, pos, items) {
            if (items.length === 0) {
                return 0;
            }
            const lineSuffix = model.getLineContent(pos.lineNumber).substr(pos.column - 10, pos.column - 1);
            if (/\s$/.test(lineSuffix)) {
                return super.select(model, pos, items);
            }
            const topScore = items[0].score[0];
            let indexPreselect = -1;
            let indexRecency = -1;
            let seq = -1;
            for (let i = 0; i < items.length; i++) {
                if (items[i].score[0] !== topScore) {
                    // consider only top items
                    break;
                }
                const key = `${model.getLanguageId()}/${items[i].textLabel}`;
                const item = this._cache.peek(key);
                if (item && item.touch > seq && item.type === items[i].completion.kind && item.insertText === items[i].completion.insertText) {
                    seq = item.touch;
                    indexRecency = i;
                }
                if (items[i].completion.preselect && indexPreselect === -1) {
                    // stop when seeing an auto-select-item
                    return indexPreselect = i;
                }
            }
            if (indexRecency !== -1) {
                return indexRecency;
            }
            else if (indexPreselect !== -1) {
                return indexPreselect;
            }
            else {
                return 0;
            }
        }
        toJSON() {
            return this._cache.toJSON();
        }
        fromJSON(data) {
            this._cache.clear();
            const seq = 0;
            for (const [key, value] of data) {
                value.touch = seq;
                value.type = typeof value.type === 'number' ? value.type : languages_1.CompletionItemKinds.fromString(value.type);
                this._cache.set(key, value);
            }
            this._seq = this._cache.size;
        }
    }
    exports.LRUMemory = LRUMemory;
    class PrefixMemory extends Memory {
        constructor() {
            super('recentlyUsedByPrefix');
            this._trie = ternarySearchTree_1.TernarySearchTree.forStrings();
            this._seq = 0;
        }
        memorize(model, pos, item) {
            const { word } = model.getWordUntilPosition(pos);
            const key = `${model.getLanguageId()}/${word}`;
            this._trie.set(key, {
                type: item.completion.kind,
                insertText: item.completion.insertText,
                touch: this._seq++
            });
        }
        select(model, pos, items) {
            const { word } = model.getWordUntilPosition(pos);
            if (!word) {
                return super.select(model, pos, items);
            }
            const key = `${model.getLanguageId()}/${word}`;
            let item = this._trie.get(key);
            if (!item) {
                item = this._trie.findSubstr(key);
            }
            if (item) {
                for (let i = 0; i < items.length; i++) {
                    const { kind, insertText } = items[i].completion;
                    if (kind === item.type && insertText === item.insertText) {
                        return i;
                    }
                }
            }
            return super.select(model, pos, items);
        }
        toJSON() {
            const entries = [];
            this._trie.forEach((value, key) => entries.push([key, value]));
            // sort by last recently used (touch), then
            // take the top 200 item and normalize their
            // touch
            entries
                .sort((a, b) => -(a[1].touch - b[1].touch))
                .forEach((value, i) => value[1].touch = i);
            return entries.slice(0, 200);
        }
        fromJSON(data) {
            this._trie.clear();
            if (data.length > 0) {
                this._seq = data[0][1].touch + 1;
                for (const [key, value] of data) {
                    value.type = typeof value.type === 'number' ? value.type : languages_1.CompletionItemKinds.fromString(value.type);
                    this._trie.set(key, value);
                }
            }
        }
    }
    exports.PrefixMemory = PrefixMemory;
    let SuggestMemoryService = class SuggestMemoryService {
        static { SuggestMemoryService_1 = this; }
        static { this._strategyCtors = new Map([
            ['recentlyUsedByPrefix', PrefixMemory],
            ['recentlyUsed', LRUMemory],
            ['first', NoMemory]
        ]); }
        static { this._storagePrefix = 'suggest/memories'; }
        constructor(_storageService, _configService) {
            this._storageService = _storageService;
            this._configService = _configService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._persistSoon = new async_1.RunOnceScheduler(() => this._saveState(), 500);
            this._disposables.add(_storageService.onWillSaveState(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    this._saveState();
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._persistSoon.dispose();
        }
        memorize(model, pos, item) {
            this._withStrategy(model, pos).memorize(model, pos, item);
            this._persistSoon.schedule();
        }
        select(model, pos, items) {
            return this._withStrategy(model, pos).select(model, pos, items);
        }
        _withStrategy(model, pos) {
            const mode = this._configService.getValue('editor.suggestSelection', {
                overrideIdentifier: model.getLanguageIdAtPosition(pos.lineNumber, pos.column),
                resource: model.uri
            });
            if (this._strategy?.name !== mode) {
                this._saveState();
                const ctor = SuggestMemoryService_1._strategyCtors.get(mode) || NoMemory;
                this._strategy = new ctor();
                try {
                    const share = this._configService.getValue('editor.suggest.shareSuggestSelections');
                    const scope = share ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */;
                    const raw = this._storageService.get(`${SuggestMemoryService_1._storagePrefix}/${mode}`, scope);
                    if (raw) {
                        this._strategy.fromJSON(JSON.parse(raw));
                    }
                }
                catch (e) {
                    // things can go wrong with JSON...
                }
            }
            return this._strategy;
        }
        _saveState() {
            if (this._strategy) {
                const share = this._configService.getValue('editor.suggest.shareSuggestSelections');
                const scope = share ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */;
                const raw = JSON.stringify(this._strategy);
                this._storageService.store(`${SuggestMemoryService_1._storagePrefix}/${this._strategy.name}`, raw, scope, 1 /* StorageTarget.MACHINE */);
            }
        }
    };
    exports.SuggestMemoryService = SuggestMemoryService;
    exports.SuggestMemoryService = SuggestMemoryService = SuggestMemoryService_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, configuration_1.IConfigurationService)
    ], SuggestMemoryService);
    exports.ISuggestMemoryService = (0, instantiation_1.createDecorator)('ISuggestMemories');
    (0, extensions_1.registerSingleton)(exports.ISuggestMemoryService, SuggestMemoryService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdE1lbW9yeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvYnJvd3Nlci9zdWdnZXN0TWVtb3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHLE1BQXNCLE1BQU07UUFFM0IsWUFBcUIsSUFBYTtZQUFiLFNBQUksR0FBSixJQUFJLENBQVM7UUFBSSxDQUFDO1FBRXZDLE1BQU0sQ0FBQyxLQUFpQixFQUFFLEdBQWMsRUFBRSxLQUF1QjtZQUNoRSxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUNELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDM0IsNkNBQTZDO29CQUM3QyxNQUFNO2dCQUNQLENBQUM7Z0JBQ0QsSUFBSSxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzFCLHVDQUF1QztvQkFDdkMsT0FBTyxDQUFDLENBQUM7Z0JBQ1YsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7S0FPRDtJQTVCRCx3QkE0QkM7SUFFRCxNQUFhLFFBQVMs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