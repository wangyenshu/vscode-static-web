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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/services/extensions/common/extensions"], function (require, exports, lifecycle_1, storage_1, memento_1, configuration_1, extensions_1) {
    "use strict";
    var ContributedExternalUriOpenersStore_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContributedExternalUriOpenersStore = void 0;
    let ContributedExternalUriOpenersStore = class ContributedExternalUriOpenersStore extends lifecycle_1.Disposable {
        static { ContributedExternalUriOpenersStore_1 = this; }
        static { this.STORAGE_ID = 'externalUriOpeners'; }
        constructor(storageService, _extensionService) {
            super();
            this._extensionService = _extensionService;
            this._openers = new Map();
            this._memento = new memento_1.Memento(ContributedExternalUriOpenersStore_1.STORAGE_ID, storageService);
            this._mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            for (const [id, value] of Object.entries(this._mementoObject || {})) {
                this.add(id, value.extensionId, { isCurrentlyRegistered: false });
            }
            this.invalidateOpenersOnExtensionsChanged();
            this._register(this._extensionService.onDidChangeExtensions(() => this.invalidateOpenersOnExtensionsChanged()));
            this._register(this._extensionService.onDidChangeExtensionsStatus(() => this.invalidateOpenersOnExtensionsChanged()));
        }
        didRegisterOpener(id, extensionId) {
            this.add(id, extensionId, {
                isCurrentlyRegistered: true
            });
        }
        add(id, extensionId, options) {
            const existing = this._openers.get(id);
            if (existing) {
                existing.isCurrentlyRegistered = existing.isCurrentlyRegistered || options.isCurrentlyRegistered;
                return;
            }
            const entry = {
                extensionId,
                isCurrentlyRegistered: options.isCurrentlyRegistered
            };
            this._openers.set(id, entry);
            this._mementoObject[id] = entry;
            this._memento.saveMemento();
            this.updateSchema();
        }
        delete(id) {
            this._openers.delete(id);
            delete this._mementoObject[id];
            this._memento.saveMemento();
            this.updateSchema();
        }
        async invalidateOpenersOnExtensionsChanged() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            const registeredExtensions = this._extensionService.extensions;
            for (const [id, entry] of this._openers) {
                const extension = registeredExtensions.find(r => r.identifier.value === entry.extensionId);
                if (extension) {
                    if (!this._extensionService.canRemoveExtension(extension)) {
                        // The extension is running. We should have registered openers at this point
                        if (!entry.isCurrentlyRegistered) {
                            this.delete(id);
                        }
                    }
                }
                else {
                    // The opener came from an extension that is no longer enabled/installed
                    this.delete(id);
                }
            }
        }
        updateSchema() {
            const ids = [];
            const descriptions = [];
            for (const [id, entry] of this._openers) {
                ids.push(id);
                descriptions.push(entry.extensionId);
            }
            (0, configuration_1.updateContributedOpeners)(ids, descriptions);
        }
    };
    exports.ContributedExternalUriOpenersStore = ContributedExternalUriOpenersStore;
    exports.ContributedExternalUriOpenersStore = ContributedExternalUriOpenersStore = ContributedExternalUriOpenersStore_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensions_1.IExtensionService)
    ], ContributedExternalUriOpenersStore);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0ZWRPcGVuZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZXJuYWxVcmlPcGVuZXIvY29tbW9uL2NvbnRyaWJ1dGVkT3BlbmVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLGtDQUFrQyxHQUF4QyxNQUFNLGtDQUFtQyxTQUFRLHNCQUFVOztpQkFFekMsZUFBVSxHQUFHLG9CQUFvQixBQUF2QixDQUF3QjtRQU0xRCxZQUNrQixjQUErQixFQUM3QixpQkFBcUQ7WUFFeEUsS0FBSyxFQUFFLENBQUM7WUFGNEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQU54RCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQW9DLENBQUM7WUFVdkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGlCQUFPLENBQUMsb0NBQWtDLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzNGLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLDZEQUE2QyxDQUFDO1lBQzVGLEtBQUssTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDckUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFLHFCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDbkUsQ0FBQztZQUVELElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDO1lBRTVDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixD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