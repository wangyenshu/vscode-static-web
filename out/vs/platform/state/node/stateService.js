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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/types", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log"], function (require, exports, async_1, buffer_1, lifecycle_1, types_1, environment_1, files_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StateService = exports.StateReadonlyService = exports.FileStorage = exports.SaveStrategy = void 0;
    var SaveStrategy;
    (function (SaveStrategy) {
        SaveStrategy[SaveStrategy["IMMEDIATE"] = 0] = "IMMEDIATE";
        SaveStrategy[SaveStrategy["DELAYED"] = 1] = "DELAYED";
    })(SaveStrategy || (exports.SaveStrategy = SaveStrategy = {}));
    class FileStorage extends lifecycle_1.Disposable {
        constructor(storagePath, saveStrategy, logService, fileService) {
            super();
            this.storagePath = storagePath;
            this.saveStrategy = saveStrategy;
            this.logService = logService;
            this.fileService = fileService;
            this.storage = Object.create(null);
            this.lastSavedStorageContents = '';
            this.flushDelayer = this._register(new async_1.ThrottledDelayer(this.saveStrategy === 0 /* SaveStrategy.IMMEDIATE */ ? 0 : 100 /* buffer saves over a short time */));
            this.initializing = undefined;
            this.closing = undefined;
        }
        init() {
            if (!this.initializing) {
                this.initializing = this.doInit();
            }
            return this.initializing;
        }
        async doInit() {
            try {
                this.lastSavedStorageContents = (await this.fileService.readFile(this.storagePath)).value.toString();
                this.storage = JSON.parse(this.lastSavedStorageContents);
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
        }
        getItem(key, defaultValue) {
            const res = this.storage[key];
            if ((0, types_1.isUndefinedOrNull)(res)) {
                return defaultValue;
            }
            return res;
        }
        setItem(key, data) {
            this.setItems([{ key, data }]);
        }
        setItems(items) {
            let save = false;
            for (const { key, data } of items) {
                // Shortcut for data that did not change
                if (this.storage[key] === data) {
                    continue;
                }
                // Remove items when they are undefined or null
                if ((0, types_1.isUndefinedOrNull)(data)) {
                    if (!(0, types_1.isUndefined)(this.storage[key])) {
                        this.storage[key] = undefined;
                        save = true;
                    }
                }
                // Otherwise add an item
                else {
                    this.storage[key] = data;
                    save = true;
                }
            }
            if (save) {
                this.save();
            }
        }
        removeItem(key) {
            // Only update if the key is actually present (not undefined)
            if (!(0, types_1.isUndefined)(this.storage[key])) {
                this.storage[key] = undefined;
                this.save();
            }
        }
        async save() {
            if (this.closing) {
                return; // already about to close
            }
            return this.flushDelayer.trigger(() => this.doSave());
        }
        async doSave() {
            if (!this.initializing) {
                return; // if we never initialized, we should not save our state
            }
            // Make sure to wait for init to finish first
            await this.initializing;
            // Return early if the database has not changed
            const serializedDatabase = JSON.stringify(this.storage, null, 4);
            if (serializedDatabase === this.lastSavedStorageContents) {
                return;
            }
            // Write to disk
            try {
                await this.fileService.writeFile(this.storagePath, buffer_1.VSBuffer.fromString(serializedDatabase), { atomic: { postfix: '.vsctmp' } });
                this.lastSavedStorageContents = serializedDatabase;
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        async close() {
            if (!this.closing) {
                this.closing = this.flushDelayer.trigger(() => this.doSave(), 0 /* as soon as possible */);
            }
            return this.closing;
        }
    }
    exports.FileStorage = FileStorage;
    let StateReadonlyService = class StateReadonlyService extends lifecycle_1.Disposable {
        constructor(saveStrategy, environmentService, logService, fileService) {
            super();
            this.fileStorage = this._register(new FileStorage(environmentService.stateResource, saveStrategy, logService, fileService));
        }
        async init() {
            await this.fileStorage.init();
        }
        getItem(key, defaultValue) {
            return this.fileStorage.getItem(key, defaultValue);
        }
    };
    exports.StateReadonlyService = StateReadonlyService;
    exports.StateReadonlyService = StateReadonlyService = __decorate([
        __param(1, environment_1.IEnvironmentService),
        __param(2, log_1.ILogService),
        __param(3, files_1.IFileService)
    ], StateReadonlyService);
    class StateService extends StateReadonlyService {
        setItem(key, data) {
            this.fileStorage.setItem(key, data);
        }
        setItems(items) {
            this.fileStorage.setItems(items);
        }
        removeItem(key) {
            this.fileStorage.removeItem(key);
        }
        close() {
            return this.fileStorage.close();
        }
    }
    exports.StateService = StateService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc3RhdGUvbm9kZS9zdGF0ZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLElBQWtCLFlBR2pCO0lBSEQsV0FBa0IsWUFBWTtRQUM3Qix5REFBUyxDQUFBO1FBQ1QscURBQU8sQ0FBQTtJQUNSLENBQUMsRUFIaUIsWUFBWSw0QkFBWixZQUFZLFFBRzdCO0lBRUQsTUFBYSxXQUFZLFNBQVEsc0JBQVU7UUFVMUMsWUFDa0IsV0FBZ0IsRUFDaEIsWUFBMEIsRUFDMUIsVUFBdUIsRUFDdkIsV0FBeUI7WUFFMUMsS0FBSyxFQUFFLENBQUM7WUFMUyxnQkFBVyxHQUFYLFdBQVcsQ0FBSztZQUNoQixpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUMxQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3ZCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBWm5DLFlBQU8sR0FBb0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyw2QkFBd0IsR0FBRyxFQUFFLENBQUM7WUFFckIsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQU8sSUFBSSxDQUFDLFlBQVksbUNBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQztZQUVoSyxpQkFBWSxHQUE4QixTQUFTLENBQUM7WUFDcEQsWUFBTyxHQUE4QixTQUFTLENBQUM7UUFTdkQsQ0FBQztRQUVELElBQUk7WUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUks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