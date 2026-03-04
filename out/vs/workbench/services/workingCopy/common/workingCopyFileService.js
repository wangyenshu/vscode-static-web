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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/async", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/cancellation", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workingCopy/common/workingCopyFileOperationParticipant", "vs/workbench/services/workingCopy/common/storedFileWorkingCopySaveParticipant"], function (require, exports, instantiation_1, extensions_1, event_1, async_1, arrays_1, lifecycle_1, files_1, cancellation_1, workingCopyService_1, uriIdentity_1, workingCopyFileOperationParticipant_1, storedFileWorkingCopySaveParticipant_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyFileService = exports.IWorkingCopyFileService = void 0;
    exports.IWorkingCopyFileService = (0, instantiation_1.createDecorator)('workingCopyFileService');
    let WorkingCopyFileService = class WorkingCopyFileService extends lifecycle_1.Disposable {
        constructor(fileService, workingCopyService, instantiationService, uriIdentityService) {
            super();
            this.fileService = fileService;
            this.workingCopyService = workingCopyService;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            //#region Events
            this._onWillRunWorkingCopyFileOperation = this._register(new event_1.AsyncEmitter());
            this.onWillRunWorkingCopyFileOperation = this._onWillRunWorkingCopyFileOperation.event;
            this._onDidFailWorkingCopyFileOperation = this._register(new event_1.AsyncEmitter());
            this.onDidFailWorkingCopyFileOperation = this._onDidFailWorkingCopyFileOperation.event;
            this._onDidRunWorkingCopyFileOperation = this._register(new event_1.AsyncEmitter());
            this.onDidRunWorkingCopyFileOperation = this._onDidRunWorkingCopyFileOperation.event;
            //#endregion
            this.correlationIds = 0;
            //#endregion
            //#region File operation participants
            this.fileOperationParticipants = this._register(this.instantiationService.createInstance(workingCopyFileOperationParticipant_1.WorkingCopyFileOperationParticipant));
            //#endregion
            //#region Save participants (stored file working copies only)
            this.saveParticipants = this._register(this.instantiationService.createInstance(storedFileWorkingCopySaveParticipant_1.StoredFileWorkingCopySaveParticipant));
            //#endregion
            //#region Path related
            this.workingCopyProviders = [];
            // register a default working copy provider that uses the working copy service
            this._register(this.registerWorkingCopyProvider(resource => {
                return this.workingCopyService.workingCopies.filter(workingCopy => {
                    if (this.fileService.hasProvider(resource)) {
                        // only check for parents if the resource can be handled
                        // by the file system where we then assume a folder like
                        // path structure
                        return this.uriIdentityService.extUri.isEqualOrParent(workingCopy.resource, resource);
                    }
                    return this.uriIdentityService.extUri.isEqual(workingCopy.resource, resource);
                });
            }));
        }
        //#region File operations
        create(operations, token, undoInfo) {
            return this.doCreateFileOrFolder(operations, true, token, undoInfo);
        }
        createFolder(operations, token, undoInfo) {
            return this.doCreateFileOrFolder(operations, false, token, undoInfo);
        }
        async doCreateFileOrFolder(operations, isFile, token, undoInfo) {
            if (operations.length === 0) {
                return [];
            }
            // validate create operation before starting
            if (isFile) {
                const validateCreates = await async_1.Promises.settled(operations.map(operation => this.fileService.canCreateFile(operation.resource, { overwrite: operation.overwrite })));
                const error = validateCreates.find(validateCreate => validateCreate instanceof Error);
                if (error instanceof Error) {
                    throw error;
                }
            }
            // file operation participant
            const files = operations.map(operation => ({ target: operation.resource }));
            await this.runFileOperationParticipants(files, 0 /* FileOperation.CREATE */, undoInfo, token);
            // before events
            const event = { correlationId: this.correlationIds++, operation: 0 /* FileOperation.CREATE */, files };
            await this._onWillRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            // now actually create on disk
            let stats;
            try {
                if (isFile) {
                    stats = await async_1.Promises.settled(operations.map(operation => this.fileService.createFile(operation.resource, operation.contents, { overwrite: operation.overwrite })));
                }
                else {
                    stats = await async_1.Promises.settled(operations.map(operation => this.fileService.createFolder(operation.resource)));
                }
            }
            catch (error) {
                // error event
                await this._onDidFailWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
                throw error;
            }
            // after event
            await this._onDidRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            return stats;
        }
        async move(operations, token, undoInfo) {
            return this.doMoveOrCopy(operations, true, token, undoInfo);
        }
        async copy(operations, token, undoInfo) {
            return this.doMoveOrCopy(operations, false, token, undoInfo);
        }
        async doMoveOrCopy(operations, move, token, undoInfo) {
            const stats = [];
            // validate move/copy operation before starting
            for (const { file: { source, target }, overwrite } of operations) {
                const validateMoveOrCopy = await (move ? this.fileService.canMove(source, target, overwrite) : this.fileService.canCopy(source, target, overwrite));
                if (validateMoveOrCopy instanceof Error) {
                    throw validateMoveOrCopy;
                }
            }
            // file operation participant
            const files = operations.map(o => o.file);
            await this.runFileOperationParticipants(files, move ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */, undoInfo, token);
            // before event
            const event = { correlationId: this.correlationIds++, operation: move ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */, files };
            await this._onWillRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            try {
                for (const { file: { source, target }, overwrite } of operations) {
                    // if source and target are not equal, handle dirty working copies
                    // depending on the operation:
                    // - move: revert both source and target (if any)
                    // - copy: revert target (if any)
                    if (!this.uriIdentityService.extUri.isEqual(source, target)) {
                        const dirtyWorkingCopies = (move ? [...this.getDirty(source), ...this.getDirty(target)] : this.getDirty(target));
                        await async_1.Promises.settled(dirtyWorkingCopies.map(dirtyWorkingCopy => dirtyWorkingCopy.revert({ soft: true })));
                    }
                    // now we can rename the source to target via file operation
                    if (move) {
                        stats.push(await this.fileService.move(source, target, overwrite));
                    }
                    else {
                        stats.push(await this.fileService.copy(source, target, overwrite));
                    }
                }
            }
            catch (error) {
                // error event
                await this._onDidFailWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
                throw error;
            }
            // after event
            await this._onDidRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            return stats;
        }
        async delete(operations, token, undoInfo) {
            // validate delete operation before starting
            for (const operation of operations) {
                const validateDelete = await this.fileService.canDelete(operation.resource, { recursive: operation.recursive, useTrash: operation.useTrash });
                if (validateDelete instanceof Error) {
                    throw validateDelete;
                }
            }
            // file operation participant
            const files = operations.map(operation => ({ target: operation.resource }));
            await this.runFileOperationParticipants(files, 1 /* FileOperation.DELETE */, undoInfo, token);
            // before events
            const event = { correlationId: this.correlationIds++, operation: 1 /* FileOperation.DELETE */, files };
            await this._onWillRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            // check for any existing dirty working copies for the resource
            // and do a soft revert before deleting to be able to close
            // any opened editor with these working copies
            for (const operation of operations) {
                const dirtyWorkingCopies = this.getDirty(operation.resource);
                await async_1.Promises.settled(dirtyWorkingCopies.map(dirtyWorkingCopy => dirtyWorkingCopy.revert({ soft: true })));
            }
            // now actually delete from disk
            try {
                for (const operation of operations) {
                    await this.fileService.del(operation.resource, { recursive: operation.recursive, useTrash: operation.useTrash });
                }
            }
            catch (error) {
                // error event
                await this._onDidFailWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
                throw error;
            }
            // after event
            await this._onDidRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
        }
        addFileOperationParticipant(participant) {
            return this.fileOperationParticipants.addFileOperationParticipant(participant);
        }
        runFileOperationParticipants(files, operation, undoInfo, token) {
            return this.fileOperationParticipants.participate(files, operation, undoInfo, token);
        }
        get hasSaveParticipants() { return this.saveParticipants.length > 0; }
        addSaveParticipant(participant) {
            return this.saveParticipants.addSaveParticipant(participant);
        }
        runSaveParticipants(workingCopy, context, token) {
            return this.saveParticipants.participate(workingCopy, context, token);
        }
        registerWorkingCopyProvider(provider) {
            const remove = (0, arrays_1.insert)(this.workingCopyProviders, provider);
            return (0, lifecycle_1.toDisposable)(remove);
        }
        getDirty(resource) {
            const dirtyWorkingCopies = new Set();
            for (const provider of this.workingCopyProviders) {
                for (const workingCopy of provider(resource)) {
                    if (workingCopy.isDirty()) {
                        dirtyWorkingCopies.add(workingCopy);
                    }
                }
            }
            return Array.from(dirtyWorkingCopies);
        }
    };
    exports.WorkingCopyFileService = WorkingCopyFileService;
    exports.WorkingCopyFileService = WorkingCopyFileService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, workingCopyService_1.IWorkingCopyService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], WorkingCopyFileService);
    (0, extensions_1.registerSingleton)(exports.IWorkingCopyFileService, WorkingCopyFileService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlGaWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3JraW5nQ29weS9jb21tb24vd29ya2luZ0NvcHlGaWxlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQm5GLFFBQUEsdUJBQXVCLEdBQUcsSUFBQSwrQkFBZSxFQUEwQix3QkFBd0IsQ0FBQyxDQUFDO0lBbVFuRyxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHNCQUFVO1FBbUJyRCxZQUNlLFdBQTBDLEVBQ25DLGtCQUF3RCxFQUN0RCxvQkFBNEQsRUFDOUQsa0JBQXdEO1lBRTdFLEtBQUssRUFBRSxDQUFDO1lBTHVCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2xCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDckMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBbkI5RSxnQkFBZ0I7WUFFQyx1Q0FBa0MsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksb0JBQVksRUFBd0IsQ0FBQyxDQUFDO1lBQ3RHLHNDQUFpQyxHQUFHLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxLQUFLLENBQUM7WUFFMUUsdUNBQWtDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG9CQUFZLEVBQXdCLENBQUMsQ0FBQztZQUN0RyxzQ0FBaUMsR0FBRyxJQUFJLENBQUMsa0NBQWtDLENBQUMsS0FBSyxDQUFDO1lBRTFFLHNDQUFpQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxvQkFBWSxFQUF3QixDQUFDLENBQUM7WUFDckcscUNBQWdDLEdBQUcsSUFBSSxDQUFDLGlD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