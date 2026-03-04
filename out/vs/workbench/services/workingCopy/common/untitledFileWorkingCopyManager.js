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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopy", "vs/base/common/event", "vs/base/common/network", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/files/common/files", "vs/workbench/services/workingCopy/common/abstractFileWorkingCopyManager", "vs/base/common/map"], function (require, exports, lifecycle_1, uri_1, untitledFileWorkingCopy_1, event_1, network_1, workingCopyService_1, label_1, log_1, workingCopyBackup_1, files_1, abstractFileWorkingCopyManager_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledFileWorkingCopyManager = void 0;
    let UntitledFileWorkingCopyManager = class UntitledFileWorkingCopyManager extends abstractFileWorkingCopyManager_1.BaseFileWorkingCopyManager {
        constructor(workingCopyTypeId, modelFactory, saveDelegate, fileService, labelService, logService, workingCopyBackupService, workingCopyService) {
            super(fileService, logService, workingCopyBackupService);
            this.workingCopyTypeId = workingCopyTypeId;
            this.modelFactory = modelFactory;
            this.saveDelegate = saveDelegate;
            this.labelService = labelService;
            this.workingCopyService = workingCopyService;
            //#region Events
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            //#endregion
            this.mapResourceToWorkingCopyListeners = new map_1.ResourceMap();
        }
        async resolve(options) {
            const workingCopy = this.doCreateOrGet(options);
            await workingCopy.resolve();
            return workingCopy;
        }
        doCreateOrGet(options = Object.create(null)) {
            const massagedOptions = this.massageOptions(options);
            // Return existing instance if asked for it
            if (massagedOptions.untitledResource) {
                const existingWorkingCopy = this.get(massagedOptions.untitledResource);
                if (existingWorkingCopy) {
                    return existingWorkingCopy;
                }
            }
            // Create new instance otherwise
            return this.doCreate(massagedOptions);
        }
        massageOptions(options) {
            const massagedOptions = Object.create(null);
            // Handle associated resource
            if (options.associatedResource) {
                massagedOptions.untitledResource = uri_1.URI.from({
                    scheme: network_1.Schemas.untitled,
                    authority: options.associatedResource.authority,
                    fragment: options.associatedResource.fragment,
                    path: options.associatedResource.path,
                    query: options.associatedResource.query
                });
                massagedOptions.associatedResource = options.associatedResource;
            }
            // Handle untitled resource
            else {
                if (options.untitledResource?.scheme === network_1.Schemas.untitled) {
                    massagedOptions.untitledResource = options.untitledResource;
                }
                massagedOptions.isScratchpad = options.isScratchpad;
            }
            // Take over initial value
            massagedOptions.contents = options.contents;
            return massagedOptions;
        }
        doCreate(options) {
            // Create a new untitled resource if none is provided
            let untitledResource = options.untitledResource;
            if (!untitledResource) {
                let counter = 1;
                do {
                    untitledResource = uri_1.URI.from({
                        scheme: network_1.Schemas.untitled,
                        path: options.isScratchpad ? `Scratchpad-${counter}` : `Untitled-${counter}`,
                        query: this.workingCopyTypeId ?
                            `typeId=${this.workingCopyTypeId}` : // distinguish untitled resources among others by encoding the `typeId` as query param
                            undefined // keep untitled resources for text files as they are (when `typeId === ''`)
                    });
                    counter++;
                } while (this.has(untitledResource));
            }
            // Create new working copy with provided options
            const workingCopy = new untitledFileWorkingCopy_1.UntitledFileWorkingCopy(this.workingCopyTypeId, untitledResource, this.labelService.getUriBasenameLabel(untitledResource), !!options.associatedResource, !!options.isScratchpad, options.contents, this.modelFactory, this.saveDelegate, this.workingCopyService, this.workingCopyBackupService, this.logService);
            // Register
            this.registerWorkingCopy(workingCopy);
            return workingCopy;
        }
        registerWorkingCopy(workingCopy) {
            // Install working copy listeners
            const workingCopyListeners = new lifecycle_1.DisposableStore();
            workingCopyListeners.add(workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onWillDispose(() => this._onWillDispose.fire(workingCopy)));
            // Keep for disposal
            this.mapResourceToWorkingCopyListeners.set(workingCopy.resource, workingCopyListeners);
            // Add to cache
            this.add(workingCopy.resource, workingCopy);
            // If the working copy is dirty right from the beginning,
            // make sure to emit this as an event
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
        }
        remove(resource) {
            const removed = super.remove(resource);
            // Dispose any existing working copy listeners
            const workingCopyListener = this.mapResourceToWorkingCopyListeners.get(resource);
            if (workingCopyListener) {
                (0, lifecycle_1.dispose)(workingCopyListener);
                this.mapResourceToWorkingCopyListeners.delete(resource);
            }
            return removed;
        }
        //#endregion
        //#region Lifecycle
        dispose() {
            super.dispose();
            // Dispose the working copy change listeners
            (0, lifecycle_1.dispose)(this.mapResourceToWorkingCopyListeners.values());
            this.mapResourceToWorkingCopyListeners.clear();
        }
    };
    exports.UntitledFileWorkingCopyManager = UntitledFileWorkingCopyManager;
    exports.UntitledFileWorkingCopyManager = UntitledFileWorkingCopyManager = __decorate([
        __param(3, files_1.IFileService),
        __param(4, label_1.ILabelService),
        __param(5, log_1.ILogService),
        __param(6, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(7, workingCopyService_1.IWorkingCopyService)
    ], UntitledFileWorkingCopyManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRGaWxlV29ya2luZ0NvcHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi91bnRpdGxlZEZpbGVXb3JraW5nQ29weU1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0d6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUF3RSxTQUFRLDJEQUEwRDtRQWN0SixZQUNrQixpQkFBeUIsRUFDekIsWUFBcUQsRUFDckQsWUFBcUQsRUFDeEQsV0FBeUIsRUFDeEIsWUFBNEMsRUFDOUMsVUFBdUIsRUFDVCx3QkFBbUQsRUFDekQsa0JBQXdEO1lBRTdFLEtBQUssQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFUeEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFRO1lBQ3pCLGlCQUFZLEdBQVosWUFBWSxDQUF5QztZQUNyRCxpQkFBWSxHQUFaLFlBQVksQ0FBeUM7WUFFdEMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFHckIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQXBCOUUsZ0JBQWdCO1lBRUMsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBK0IsQ0FBQyxDQUFDO1lBQ3ZGLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFeEMsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUErQixDQUFDLENBQUM7WUFDcEYsa0JBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUVuRCxZQUFZO1lBRUssc0NBQWlDLEdBQUcsSUFBSSxpQkFBVyxF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