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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/cancellation", "vs/base/common/async", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/stream"], function (require, exports, event_1, lifecycle_1, workingCopyService_1, cancellation_1, async_1, log_1, workingCopyBackup_1, stream_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledFileWorkingCopy = void 0;
    let UntitledFileWorkingCopy = class UntitledFileWorkingCopy extends lifecycle_1.Disposable {
        get model() { return this._model; }
        //#endregion
        constructor(typeId, resource, name, hasAssociatedFilePath, isScratchpad, initialContents, modelFactory, saveDelegate, workingCopyService, workingCopyBackupService, logService) {
            super();
            this.typeId = typeId;
            this.resource = resource;
            this.name = name;
            this.hasAssociatedFilePath = hasAssociatedFilePath;
            this.isScratchpad = isScratchpad;
            this.initialContents = initialContents;
            this.modelFactory = modelFactory;
            this.saveDelegate = saveDelegate;
            this.workingCopyBackupService = workingCopyBackupService;
            this.logService = logService;
            this.capabilities = this.isScratchpad ? 2 /* WorkingCopyCapabilities.Untitled */ | 4 /* WorkingCopyCapabilities.Scratchpad */ : 2 /* WorkingCopyCapabilities.Untitled */;
            this._model = undefined;
            //#region Events
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            //#region Dirty/Modified
            this.modified = this.hasAssociatedFilePath || Boolean(this.initialContents && this.initialContents.markModified !== false);
            // Make known to working copy service
            this._register(workingCopyService.registerWorkingCopy(this));
        }
        isDirty() {
            return this.modified && !this.isScratchpad; // Scratchpad working copies are never dirty
        }
        isModified() {
            return this.modified;
        }
        setModified(modified) {
            if (this.modified === modified) {
                return;
            }
            this.modified = modified;
            if (!this.isScratchpad) {
                this._onDidChangeDirty.fire();
            }
        }
        //#endregion
        //#region Resolve
        async resolve() {
            this.trace('resolve()');
            if (this.isResolved()) {
                this.trace('resolve() - exit (already resolved)');
                // return early if the untitled file working copy is already
                // resolved assuming that the contents have meanwhile changed
                // in the underlying model. we only resolve untitled once.
                return;
            }
            let untitledContents;
            // Check for backups or use initial value or empty
            const backup = await this.workingCopyBackupService.resolve(this);
            if (backup) {
                this.trace('resolve() - with backup');
                untitledContents = backup.value;
            }
            else if (this.initialContents?.value) {
                this.trace('resolve() - with initial contents');
                untitledContents = this.initialContents.value;
            }
            else {
                this.trace('resolve() - empty');
                untitledContents = (0, stream_1.emptyStream)();
            }
            // Create model
            await this.doCreateModel(untitledContents);
            // Untitled associated to file path are modified right away as well as untitled with content
            this.setModified(this.hasAssociatedFilePath || !!backup || Boolean(this.initialContents && this.initialContents.markModified !== false));
            // If we have initial contents, make sure to emit this
            // as the appropriate events to the outside.
            if (!!backup || this.initialContents) {
                this._onDidChangeContent.fire();
            }
        }
        async doCreateModel(contents) {
            this.trace('doCreateModel()');
            // Create model and dispose it when we get disposed
            this._model = this._register(await this.modelFactory.createModel(this.resource, contents, cancellation_1.CancellationToken.None));
            // Model listeners
            this.installModelListeners(this._model);
        }
        installModelListeners(model) {
            // Content Change
            this._register(model.onDidChangeContent(e => this.onModelContentChanged(e)));
            // Lifecycle
            this._register(model.onWillDispose(() => this.dispose()));
        }
        onModelContentChanged(e) {
            // Mark the untitled file working copy as non-modified once its
            // in case provided by the change event and in case we do not
            // have an associated path set
            if (!this.hasAssociatedFilePath && e.isInitial) {
                this.setModified(false);
            }
            // Turn modified otherwise
            else {
                this.setModified(true);
            }
            // Emit as general content change event
            this._onDidChangeContent.fire();
        }
        isResolved() {
            return !!this.model;
        }
        //#endregion
        //#region Backup
        get backupDelay() {
            return this.model?.configuration?.backupDelay;
        }
        async backup(token) {
            let content = undefined;
            // Make sure to check whether this working copy has been
            // resolved or not and fallback to the initial value -
            // if any - to prevent backing up an unresolved working
            // copy and loosing the initial value.
            if (this.isResolved()) {
                content = await (0, async_1.raceCancellation)(this.model.snapshot(2 /* SnapshotContext.Backup */, token), token);
            }
            else if (this.initialContents) {
                content = this.initialContents.value;
            }
            return { content };
        }
        //#endregion
        //#region Save
        async save(options) {
            this.trace('save()');
            const result = await this.saveDelegate(this, options);
            // Emit Save Event
            if (result) {
                this._onDidSave.fire({ reason: options?.reason, source: options?.source });
            }
            return result;
        }
        //#endregion
        //#region Revert
        async revert() {
            this.trace('revert()');
            // No longer modified
            this.setModified(false);
            // Emit as event
            this._onDidRevert.fire();
            // A reverted untitled file working copy is invalid
            // because it has no actual source on disk to revert to.
            // As such we dispose the model.
            this.dispose();
        }
        //#endregion
        dispose() {
            this.trace('dispose()');
            this._onWillDispose.fire();
            super.dispose();
        }
        trace(msg) {
            this.logService.trace(`[untitled file working copy] ${msg}`, this.resource.toString(), this.typeId);
        }
    };
    exports.UntitledFileWorkingCopy = UntitledFileWorkingCopy;
    exports.UntitledFileWorkingCopy = UntitledFileWorkingCopy = __decorate([
        __param(8, workingCopyService_1.IWorkingCopyService),
        __param(9, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(10, log_1.ILogService)
    ], UntitledFileWorkingCopy);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRGaWxlV29ya2luZ0NvcHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL3VudGl0bGVkRmlsZVdvcmtpbmdDb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlGekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBaUUsU0FBUSxzQkFBVTtRQUsvRixJQUFJLEtBQUssS0FBb0IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQW1CbEQsWUFBWTtRQUVaLFlBQ1UsTUFBYyxFQUNkLFFBQWEsRUFDYixJQUFZLEVBQ1oscUJBQThCLEVBQ3RCLFlBQXFCLEVBQ3JCLGVBQW9FLEVBQ3BFLFlBQXFELEVBQ3JELFlBQXFELEVBQ2pELGtCQUF1QyxFQUNqQyx3QkFBb0UsRUFDbEYsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFaQyxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ2QsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNiLFNBQUksR0FBSixJQUFJLENBQVE7WUFDWiwwQkFBcUIsR0FBckIscUJBQXFCLENBQVM7WUFDdEIsaUJBQVksR0FBWixZQUFZLENBQVM7WUFDckIsb0JBQWUsR0FBZixlQUFlLENBQXFEO1lBQ3BFLGlCQUFZLEdBQVosWUFBWSxDQUF5QztZQUNyRCxpQkFBWSxHQUFaLFlBQVksQ0FBeUM7WUFFMUIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEyQjtZQUNqRSxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBbkM3QyxpQkFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLHFGQUFxRSxDQUFDLENBQUMseUNBQWlDLENBQUM7WUFFN0ksV0FBTSxHQUFrQixTQUFT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