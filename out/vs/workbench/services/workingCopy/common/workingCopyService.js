/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/map"], function (require, exports, instantiation_1, extensions_1, event_1, uri_1, lifecycle_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyService = exports.IWorkingCopyService = void 0;
    exports.IWorkingCopyService = (0, instantiation_1.createDecorator)('workingCopyService');
    class WorkingCopyService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            //#region Events
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this._onDidUnregister = this._register(new event_1.Emitter());
            this.onDidUnregister = this._onDidUnregister.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._workingCopies = new Set();
            this.mapResourceToWorkingCopies = new map_1.ResourceMap();
            this.mapWorkingCopyToListeners = this._register(new lifecycle_1.DisposableMap());
            //#endregion
        }
        //#endregion
        //#region Registry
        get workingCopies() { return Array.from(this._workingCopies.values()); }
        registerWorkingCopy(workingCopy) {
            let workingCopiesForResource = this.mapResourceToWorkingCopies.get(workingCopy.resource);
            if (workingCopiesForResource?.has(workingCopy.typeId)) {
                throw new Error(`Cannot register more than one working copy with the same resource ${workingCopy.resource.toString()} and type ${workingCopy.typeId}.`);
            }
            // Registry (all)
            this._workingCopies.add(workingCopy);
            // Registry (type based)
            if (!workingCopiesForResource) {
                workingCopiesForResource = new Map();
                this.mapResourceToWorkingCopies.set(workingCopy.resource, workingCopiesForResource);
            }
            workingCopiesForResource.set(workingCopy.typeId, workingCopy);
            // Wire in Events
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(workingCopy.onDidChangeContent(() => this._onDidChangeContent.fire(workingCopy)));
            disposables.add(workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(workingCopy)));
            disposables.add(workingCopy.onDidSave(e => this._onDidSave.fire({ workingCopy, ...e })));
            this.mapWorkingCopyToListeners.set(workingCopy, disposables);
            // Send some initial events
            this._onDidRegister.fire(workingCopy);
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                // Unregister working copy
                this.unregisterWorkingCopy(workingCopy);
                // Signal as event
                this._onDidUnregister.fire(workingCopy);
            });
        }
        unregisterWorkingCopy(workingCopy) {
            // Registry (all)
            this._workingCopies.delete(workingCopy);
            // Registry (type based)
            const workingCopiesForResource = this.mapResourceToWorkingCopies.get(workingCopy.resource);
            if (workingCopiesForResource?.delete(workingCopy.typeId) && workingCopiesForResource.size === 0) {
                this.mapResourceToWorkingCopies.delete(workingCopy.resource);
            }
            // If copy is dirty, ensure to fire an event to signal the dirty change
            // (a disposed working copy cannot account for being dirty in our model)
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
            // Remove all listeners associated to working copy
            this.mapWorkingCopyToListeners.deleteAndDispose(workingCopy);
        }
        has(resourceOrIdentifier) {
            if (uri_1.URI.isUri(resourceOrIdentifier)) {
                return this.mapResourceToWorkingCopies.has(resourceOrIdentifier);
            }
            return this.mapResourceToWorkingCopies.get(resourceOrIdentifier.resource)?.has(resourceOrIdentifier.typeId) ?? false;
        }
        get(identifier) {
            return this.mapResourceToWorkingCopies.get(identifier.resource)?.get(identifier.typeId);
        }
        getAll(resource) {
            const workingCopies = this.mapResourceToWorkingCopies.get(resource);
            if (!workingCopies) {
                return undefined;
            }
            return Array.from(workingCopies.values());
        }
        //#endregion
        //#region Dirty Tracking
        get hasDirty() {
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isDirty()) {
                    return true;
                }
            }
            return false;
        }
        get dirtyCount() {
            let totalDirtyCount = 0;
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isDirty()) {
                    totalDirtyCount++;
                }
            }
            return totalDirtyCount;
        }
        get dirtyWorkingCopies() {
            return this.workingCopies.filter(workingCopy => workingCopy.isDirty());
        }
        get modifiedCount() {
            let totalModifiedCount = 0;
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isModified()) {
                    totalModifiedCount++;
                }
            }
            return totalModifiedCount;
        }
        get modifiedWorkingCopies() {
            return this.workingCopies.filter(workingCopy => workingCopy.isModified());
        }
        isDirty(resource, typeId) {
            const workingCopies = this.mapResourceToWorkingCopies.get(resource);
            if (workingCopies) {
                // For a specific type
                if (typeof typeId === 'string') {
                    return workingCopies.get(typeId)?.isDirty() ?? false;
                }
                // Across all working copies
                else {
                    for (const [, workingCopy] of workingCopies) {
                        if (workingCopy.isDirty()) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }
    exports.WorkingCopyService = WorkingCopyService;
    (0, extensions_1.registerSingleton)(exports.IWorkingCopyService, WorkingCopyService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi93b3JraW5nQ29weVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVW5GLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwrQkFBZSxFQUFzQixvQkFBb0IsQ0FBQyxDQUFDO0lBOEg5RixNQUFhLGtCQUFtQixTQUFRLHNCQUFVO1FBQWxEOztZQUlDLGdCQUFnQjtZQUVDLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZ0IsQ0FBQyxDQUFDO1lBQ3JFLGtCQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFFbEMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZ0IsQ0FBQyxDQUFDO1lBQ3ZFLG9CQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUV0QyxzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFnQixDQUFDLENBQUM7WUFDeEUscUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUV4Qyx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFnQixDQUFDLENBQUM7WUFDMUUsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQUU1QyxlQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBeUIsQ0FBQyxDQUFDO1lBQzFFLGNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQVFuQyxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUFnQixDQUFDO1lBRWhDLCtCQUEwQixHQUFHLElBQUksaUJBQVcsRUFBNkIsQ0FBQztZQUMxRSw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBZ0IsQ0FBQyxDQUFDO1lBMEovRixZQUFZO1FBQ2IsQ0FBQztRQXBLQSxZQUFZO1FBR1osa0JBQWtCO1FBRWxCLElBQUksYUFBYSxLQUFxQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQU14RixtQkFBbUIsQ0FBQyxXQUF5QjtZQUM1QyxJQUFJLHdCQUF3QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pGLElBQUksd0JBQXdCLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLHFFQUFxRSxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxhQUFhLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ3pKLENBQUM7WUFFRCxpQkFBaUI7WUFDakIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFckMsd0JBQXdCO1lBQ3hCLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2dCQUMvQix3QkFBd0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQUNyRixDQUFDO1lBQ0Qsd0JBQXdCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFOUQsaUJBQWlCO1lBQ2pCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlGLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekYsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFN0QsMkJBQTJCO1lBQzNCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3RDLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFFeEIsMEJBQTBCO2dCQUMxQixJQUFJLENBQUMscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBRXhDLGtCQUFrQjtnQkFDbEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN6QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUyxxQkFBcUIsQ0FBQyxXQUF5QjtZQUV4RCxpQkFBaUI7WUFDakIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFeEMsd0JBQXdCO1lBQ3hCLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0YsSUFBSSx3QkFBd0IsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLHdCQUF3QixDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUVELHVFQUF1RTtZQUN2RSx3RUFBd0U7WUFDeEUsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsa0RBQWtEO1lBQ2xELElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBSUQsR0FBRyxDQUFDLG9CQUFrRDtZQUNyRCxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUM7UUFDdEgsQ0FBQztRQUVELEdBQUcsQ0FBQyxVQUFrQztZQUNyQyxPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekYsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFhO1lBQ25CLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNwQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxZQUFZO1FBR1osd0JBQXdCO1FBRXhCLElBQUksUUFBUTtZQUNYLEtBQUssTUFBTSxXQUFXLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO29CQUMzQixPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQUksVUFBVTtZQUNiLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQztZQUV4QixLQUFLLE1BQU0sV0FBVyxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsZUFBZSxFQUFFLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxlQUFlLENBQUM7UUFDeEIsQ0FBQztRQUVELElBQUksa0JBQWtCO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRUQsSUFBSSxhQUFhO1lBQ2hCLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO1lBRTNCLEtBQUssTUFBTSxXQUFXLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLFdBQVcsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO29CQUM5QixrQkFBa0IsRUFBRSxDQUFDO2dCQUN0QixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sa0JBQWtCLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQUkscUJBQXFCO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRUQsT0FBTyxDQUFDLFFBQWEsRUFBRSxNQUFlO1lBQ3JDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEUsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFFbkIsc0JBQXNCO2dCQUN0QixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNoQyxPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksS0FBSyxDQUFDO2dCQUN0RCxDQUFDO2dCQUVELDRCQUE0QjtxQkFDdkIsQ0FBQztvQkFDTCxLQUFLLE1BQU0sQ0FBQyxFQUFFLFdBQVcsQ0FBQyxJQUFJLGFBQWEsRUFBRSxDQUFDO3dCQUM3QyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDOzRCQUMzQixPQUFPLElBQUksQ0FBQzt3QkFDYixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7S0FHRDtJQXpMRCxnREF5TEM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDJCQUFtQixFQUFFLGtCQUFrQixvQ0FBNEIsQ0FBQyJ9