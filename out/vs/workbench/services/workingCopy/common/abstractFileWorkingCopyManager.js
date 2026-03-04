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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/async", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackup"], function (require, exports, event_1, lifecycle_1, map_1, async_1, files_1, log_1, workingCopyBackup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseFileWorkingCopyManager = void 0;
    let BaseFileWorkingCopyManager = class BaseFileWorkingCopyManager extends lifecycle_1.Disposable {
        constructor(fileService, logService, workingCopyBackupService) {
            super();
            this.fileService = fileService;
            this.logService = logService;
            this.workingCopyBackupService = workingCopyBackupService;
            this._onDidCreate = this._register(new event_1.Emitter());
            this.onDidCreate = this._onDidCreate.event;
            this.mapResourceToWorkingCopy = new map_1.ResourceMap();
            this.mapResourceToDisposeListener = new map_1.ResourceMap();
        }
        has(resource) {
            return this.mapResourceToWorkingCopy.has(resource);
        }
        add(resource, workingCopy) {
            const knownWorkingCopy = this.get(resource);
            if (knownWorkingCopy === workingCopy) {
                return; // already cached
            }
            // Add to our working copy map
            this.mapResourceToWorkingCopy.set(resource, workingCopy);
            // Update our dispose listener to remove it on dispose
            this.mapResourceToDisposeListener.get(resource)?.dispose();
            this.mapResourceToDisposeListener.set(resource, workingCopy.onWillDispose(() => this.remove(resource)));
            // Signal creation event
            this._onDidCreate.fire(workingCopy);
        }
        remove(resource) {
            // Dispose any existing listener
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            if (disposeListener) {
                (0, lifecycle_1.dispose)(disposeListener);
                this.mapResourceToDisposeListener.delete(resource);
            }
            // Remove from our working copy map
            return this.mapResourceToWorkingCopy.delete(resource);
        }
        //#region Get / Get all
        get workingCopies() {
            return [...this.mapResourceToWorkingCopy.values()];
        }
        get(resource) {
            return this.mapResourceToWorkingCopy.get(resource);
        }
        //#endregion
        //#region Lifecycle
        dispose() {
            super.dispose();
            // Clear working copy caches
            //
            // Note: we are not explicitly disposing the working copies
            // known to the manager because this can have unwanted side
            // effects such as backups getting discarded once the working
            // copy unregisters. We have an explicit `destroy`
            // for that purpose (https://github.com/microsoft/vscode/pull/123555)
            //
            this.mapResourceToWorkingCopy.clear();
            // Dispose the dispose listeners
            (0, lifecycle_1.dispose)(this.mapResourceToDisposeListener.values());
            this.mapResourceToDisposeListener.clear();
        }
        async destroy() {
            // Make sure all dirty working copies are saved to disk
            try {
                await async_1.Promises.settled(this.workingCopies.map(async (workingCopy) => {
                    if (workingCopy.isDirty()) {
                        await this.saveWithFallback(workingCopy);
                    }
                }));
            }
            catch (error) {
                this.logService.error(error);
            }
            // Dispose all working copies
            (0, lifecycle_1.dispose)(this.mapResourceToWorkingCopy.values());
            // Finally dispose manager
            this.dispose();
        }
        async saveWithFallback(workingCopy) {
            // First try regular save
            let saveSuccess = false;
            try {
                saveSuccess = await workingCopy.save();
            }
            catch (error) {
                // Ignore
            }
            // Then fallback to backup if that exists
            if (!saveSuccess || workingCopy.isDirty()) {
                const backup = await this.workingCopyBackupService.resolve(workingCopy);
                if (backup) {
                    await this.fileService.writeFile(workingCopy.resource, backup.value, { unlock: true });
                }
            }
        }
    };
    exports.BaseFileWorkingCopyManager = BaseFileWorkingCopyManager;
    exports.BaseFileWorkingCopyManager = BaseFileWorkingCopyManager = __decorate([
        __param(0, files_1.IFileService),
        __param(1, log_1.ILogService),
        __param(2, workingCopyBackup_1.IWorkingCopyBackupService)
    ], BaseFileWorkingCopyManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RGaWxlV29ya2luZ0NvcHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi9hYnN0cmFjdEZpbGVXb3JraW5nQ29weU1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkN6RixJQUFlLDBCQUEwQixHQUF6QyxNQUFlLDBCQUEyRixTQUFRLHNCQUFVO1FBUWxJLFlBQ2UsV0FBNEMsRUFDN0MsVUFBMEMsRUFDNUIsd0JBQXNFO1lBRWpHLEtBQUssRUFBRSxDQUFDO1lBSnlCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQzFCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDVCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBVGpGLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBSyxDQUFDLENBQUM7WUFDeEQsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUU5Qiw2QkFBd0IsR0FBRyxJQUFJLGlCQUFXLEVBQUssQ0FBQztZQUNoRCxpQ0FBNEIsR0FBRyxJQUFJLGlCQUFXLEVBQWUsQ0FBQztRQVEvRSxDQUFDO1FBRVMsR0FBRyxDQUFDLFFBQWE7WUFDMUIsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFUyxHQUFHLENBQUMsUUFBYSxFQUFFLFdBQWM7WUFDMUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVDLElBQUksZ0JBQWdCLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sQ0FBQyxpQkFB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