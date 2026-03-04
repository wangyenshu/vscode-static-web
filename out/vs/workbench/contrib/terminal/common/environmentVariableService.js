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
define(["require", "exports", "vs/base/common/event", "vs/base/common/decorators", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/terminal/common/environmentVariableCollection", "vs/platform/terminal/common/environmentVariableShared", "vs/base/common/lifecycle"], function (require, exports, event_1, decorators_1, storage_1, extensions_1, environmentVariableCollection_1, environmentVariableShared_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnvironmentVariableService = void 0;
    /**
     * Tracks and persists environment variable collections as defined by extensions.
     */
    let EnvironmentVariableService = class EnvironmentVariableService extends lifecycle_1.Disposable {
        get onDidChangeCollections() { return this._onDidChangeCollections.event; }
        constructor(_extensionService, _storageService) {
            super();
            this._extensionService = _extensionService;
            this._storageService = _storageService;
            this.collections = new Map();
            this._onDidChangeCollections = this._register(new event_1.Emitter());
            this._storageService.remove("terminal.integrated.environmentVariableCollections" /* TerminalStorageKeys.DeprecatedEnvironmentVariableCollections */, 1 /* StorageScope.WORKSPACE */);
            const serializedPersistedCollections = this._storageService.get("terminal.integrated.environmentVariableCollectionsV2" /* TerminalStorageKeys.EnvironmentVariableCollections */, 1 /* StorageScope.WORKSPACE */);
            if (serializedPersistedCollections) {
                const collectionsJson = JSON.parse(serializedPersistedCollections);
                collectionsJson.forEach(c => this.collections.set(c.extensionIdentifier, {
                    persistent: true,
                    map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)(c.collection),
                    descriptionMap: (0, environmentVariableShared_1.deserializeEnvironmentDescriptionMap)(c.description)
                }));
                // Asynchronously invalidate collections where extensions have been uninstalled, this is
                // async to avoid making all functions on the service synchronous and because extensions
                // being uninstalled is rare.
                this._invalidateExtensionCollections();
            }
            this.mergedCollection = this._resolveMergedCollection();
            // Listen for uninstalled/disabled extensions
            this._register(this._extensionService.onDidChangeExtensions(() => this._invalidateExtensionCollections()));
        }
        set(extensionIdentifier, collection) {
            this.collections.set(extensionIdentifier, collection);
            this._updateCollections();
        }
        delete(extensionIdentifier) {
            this.collections.delete(extensionIdentifier);
            this._updateCollections();
        }
        _updateCollections() {
            this._persistCollectionsEventually();
            this.mergedCollection = this._resolveMergedCollection();
            this._notifyCollectionUpdatesEventually();
        }
        _persistCollectionsEventually() {
            this._persistCollections();
        }
        _persistCollections() {
            const collectionsJson = [];
            this.collections.forEach((collection, extensionIdentifier) => {
                if (collection.persistent) {
                    collectionsJson.push({
                        extensionIdentifier,
                        collection: (0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(this.collections.get(extensionIdentifier).map),
                        description: (0, environmentVariableShared_1.serializeEnvironmentDescriptionMap)(collection.descriptionMap)
                    });
                }
            });
            const stringifiedJson = JSON.stringify(collectionsJson);
            this._storageService.store("terminal.integrated.environmentVariableCollectionsV2" /* TerminalStorageKeys.EnvironmentVariableCollections */, stringifiedJson, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        _notifyCollectionUpdatesEventually() {
            this._notifyCollectionUpdates();
        }
        _notifyCollectionUpdates() {
            this._onDidChangeCollections.fire(this.mergedCollection);
        }
        _resolveMergedCollection() {
            return new environmentVariableCollection_1.MergedEnvironmentVariableCollection(this.collections);
        }
        async _invalidateExtensionCollections() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            const registeredExtensions = this._extensionService.extensions;
            let changes = false;
            this.collections.forEach((_, extensionIdentifier) => {
                const isExtensionRegistered = registeredExtensions.some(r => r.identifier.value === extensionIdentifier);
                if (!isExtensionRegistered) {
                    this.collections.delete(extensionIdentifier);
                    changes = true;
                }
            });
            if (changes) {
                this._updateCollections();
            }
        }
    };
    exports.EnvironmentVariableService = EnvironmentVariableService;
    __decorate([
        (0, decorators_1.throttle)(1000)
    ], EnvironmentVariableService.prototype, "_persistCollectionsEventually", null);
    __decorate([
        (0, decorators_1.debounce)(1000)
    ], EnvironmentVariableService.prototype, "_notifyCollectionUpdatesEventually", null);
    exports.EnvironmentVariableService = EnvironmentVariableService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, storage_1.IStorageService)
    ], EnvironmentVariableService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9jb21tb24vZW52aXJvbm1lbnRWYXJpYWJsZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRzs7T0FFRztJQUNJLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTJCLFNBQVEsc0JBQVU7UUFPekQsSUFBSSxzQkFBc0IsS0FBa0QsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUV4SCxZQUNvQixpQkFBcUQsRUFDdkQsZUFBaUQ7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFINEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN0QyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFSbkUsZ0JBQVcsR0FBK0QsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUduRSw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF3QyxDQUFDLENBQUM7WUFTOUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLHlKQUFzRixDQUFDO1lBQ2xILE1BQU0sOEJBQThCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLGlKQUE0RSxDQUFDO1lBQzVJLElBQUksOEJBQThCLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxlQUFlLEdBQTBELElBQUksQ0FBQyxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztnQkFDMUgsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsRUFBRTtvQkFDeEUs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