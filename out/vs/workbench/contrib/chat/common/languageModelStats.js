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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform", "vs/nls"], function (require, exports, event_1, lifecycle_1, instantiation_1, storage_1, extensions_1, extensionFeatures_1, platform_1, nls_1) {
    "use strict";
    var LanguageModelStatsService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageModelStatsService = exports.ILanguageModelStatsService = void 0;
    exports.ILanguageModelStatsService = (0, instantiation_1.createDecorator)('ILanguageModelStatsService');
    let LanguageModelStatsService = class LanguageModelStatsService extends lifecycle_1.Disposable {
        static { LanguageModelStatsService_1 = this; }
        static { this.MODEL_STATS_STORAGE_KEY_PREFIX = 'languageModelStats.'; }
        static { this.MODEL_ACCESS_STORAGE_KEY_PREFIX = 'languageModelAccess.'; }
        constructor(extensionFeaturesManagementService, _storageService) {
            super();
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this._storageService = _storageService;
            this._onDidChangeStats = this._register(new event_1.Emitter());
            this.onDidChangeLanguageMoelStats = this._onDidChangeStats.event;
            this.sessionStats = new Map();
            this._register(_storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, undefined, this._store)(e => {
                const model = this.getModel(e.key);
                if (model) {
                    this._onDidChangeStats.fire(model);
                }
            }));
        }
        hasAccessedModel(extensionId, model) {
            return this.getAccessExtensions(model).includes(extensionId.toLowerCase());
        }
        async update(model, extensionId, agent, tokenCount) {
            await this.extensionFeaturesManagementService.getAccess(extensionId, 'languageModels');
            // update model access
            this.addAccess(model, extensionId.value);
            // update session stats
            let sessionStats = this.sessionStats.get(model);
            if (!sessionStats) {
                sessionStats = { extensions: [] };
                this.sessionStats.set(model, sessionStats);
            }
            this.add(sessionStats, extensionId.value, agent, tokenCount);
            this.write(model, extensionId.value, agent, tokenCount);
            this._onDidChangeStats.fire(model);
        }
        addAccess(model, extensionId) {
            extensionId = extensionId.toLowerCase();
            const extensions = this.getAccessExtensions(model);
            if (!extensions.includes(extensionId)) {
                extensions.push(extensionId);
                this._storageService.store(this.getAccessKey(model), JSON.stringify(extensions), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            }
        }
        getAccessExtensions(model) {
            const key = this.getAccessKey(model);
            const data = this._storageService.get(key, -1 /* StorageScope.APPLICATION */);
            try {
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                }
            }
            catch (e) {
                // ignore
            }
            return [];
        }
        async write(model, extensionId, participant, tokenCount) {
            const modelStats = await this.read(model);
            this.add(modelStats, extensionId, participant, tokenCount);
            this._storageService.store(this.getKey(model), JSON.stringify(modelStats), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
        }
        add(modelStats, extensionId, participant, tokenCount) {
            let extensionStats = modelStats.extensions.find(e => extensions_1.ExtensionIdentifier.equals(e.extensionId, extensionId));
            if (!extensionStats) {
                extensionStats = { extensionId, requestCount: 0, tokenCount: 0, participants: [] };
                modelStats.extensions.push(extensionStats);
            }
            if (participant) {
                let participantStats = extensionStats.participants.find(p => p.id === participant);
                if (!participantStats) {
                    participantStats = { id: participant, requestCount: 0, tokenCount: 0 };
                    extensionStats.participants.push(participantStats);
                }
                participantStats.requestCount++;
                participantStats.tokenCount += tokenCount ?? 0;
            }
            else {
                extensionStats.requestCount++;
                extensionStats.tokenCount += tokenCount ?? 0;
            }
        }
        async read(model) {
            try {
                const value = this._storageService.get(this.getKey(model), -1 /* StorageScope.APPLICATION */);
                if (value) {
                    return JSON.parse(value);
                }
            }
            catch (error) {
                // ignore
            }
            return { extensions: [] };
        }
        getModel(key) {
            if (key.startsWith(LanguageModelStatsService_1.MODEL_STATS_STORAGE_KEY_PREFIX)) {
                return key.substring(LanguageModelStatsService_1.MODEL_STATS_STORAGE_KEY_PREFIX.length);
            }
            return undefined;
        }
        getKey(model) {
            return `${LanguageModelStatsService_1.MODEL_STATS_STORAGE_KEY_PREFIX}${model}`;
        }
        getAccessKey(model) {
            return `${LanguageModelStatsService_1.MODEL_ACCESS_STORAGE_KEY_PREFIX}${model}`;
        }
    };
    exports.LanguageModelStatsService = LanguageModelStatsService;
    exports.LanguageModelStatsService = LanguageModelStatsService = LanguageModelStatsService_1 = __decorate([
        __param(0, extensionFeatures_1.IExtensionFeaturesManagementService),
        __param(1, storage_1.IStorageService)
    ], LanguageModelStatsService);
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'languageModels',
        label: (0, nls_1.localize)('Language Models', "Language Models"),
        description: (0, nls_1.localize)('languageModels', "Language models usage statistics of this extension."),
        access: {
            canToggle: false
        },
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VNb2RlbFN0YXRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9jb21tb24vbGFuZ3VhZ2VNb2RlbFN0YXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFXbkYsUUFBQSwwQkFBMEIsR0FBRyxJQUFBLCtCQUFlLEVBQTZCLDRCQUE0QixDQUFDLENBQUM7SUFxQjdHLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7O2lCQUVoQyxtQ0FBOEIsR0FBRyxxQkFBcUIsQUFBeEIsQ0FBeUI7aUJBQ3ZELG9DQUErQixHQUFHLHNCQUFzQixBQUF6QixDQUEwQjtRQVNqRixZQUNzQyxrQ0FBd0YsRUFDNUcsZUFBaUQ7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFIOEMsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFxQztZQUMzRixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFQbEQsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFDbEUsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUVwRCxpQkFBWSxHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO1lBT3JFLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLGdCQUFnQixvQ0FBMkIsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDckcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ25DLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsSUFBSSxDQUFDLGlCQUFp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