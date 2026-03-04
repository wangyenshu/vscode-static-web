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
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/base/common/arrays", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network"], function (require, exports, files_1, configuration_1, workingCopyFileService_1, undoRedo_1, instantiation_1, log_1, cancellation_1, arrays_1, textfiles_1, network_1) {
    "use strict";
    var RenameOperation_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkFileEdits = void 0;
    class Noop {
        constructor() {
            this.uris = [];
        }
        async perform() { return this; }
        toString() {
            return '(noop)';
        }
    }
    class RenameEdit {
        constructor(newUri, oldUri, options) {
            this.newUri = newUri;
            this.oldUri = oldUri;
            this.options = options;
            this.type = 'rename';
        }
    }
    let RenameOperation = RenameOperation_1 = class RenameOperation {
        constructor(_edits, _undoRedoInfo, _workingCopyFileService, _fileService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._workingCopyFileService = _workingCopyFileService;
            this._fileService = _fileService;
        }
        get uris() {
            return this._edits.flatMap(edit => [edit.newUri, edit.oldUri]);
        }
        async perform(token) {
            const moves = [];
            const undoes = [];
            for (const edit of this._edits) {
                // check: not overwriting, but ignoring, and the target file exists
                const skip = edit.options.overwrite === undefined && edit.options.ignoreIfExists && await this._fileService.exists(edit.newUri);
                if (!skip) {
                    moves.push({
                        file: { source: edit.oldUri, target: edit.newUri },
                        overwrite: edit.options.overwrite
                    });
                    // reverse edit
                    undoes.push(new RenameEdit(edit.oldUri, edit.newUri, edit.options));
                }
            }
            if (moves.length === 0) {
                return new Noop();
            }
            await this._workingCopyFileService.move(moves, token, this._undoRedoInfo);
            return new RenameOperation_1(undoes, { isUndoing: true }, this._workingCopyFileService, this._fileService);
        }
        toString() {
            return `(rename ${this._edits.map(edit => `${edit.oldUri} to ${edit.newUri}`).join(', ')})`;
        }
    };
    RenameOperation = RenameOperation_1 = __decorate([
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, files_1.IFileService)
    ], RenameOperation);
    class CopyEdit {
        constructor(newUri, oldUri, options) {
            this.newUri = newUri;
            this.oldUri = oldUri;
            this.options = options;
            this.type = 'copy';
        }
    }
    let CopyOperation = class CopyOperation {
        constructor(_edits, _undoRedoInfo, _workingCopyFileService, _fileService, _instaService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._workingCopyFileService = _workingCopyFileService;
            this._fileService = _fileService;
            this._instaService = _instaService;
        }
        get uris() {
            return this._edits.flatMap(edit => [edit.newUri, edit.oldUri]);
        }
        async perform(token) {
            // (1) create copy operations, remove noops
            const copies = [];
            for (const edit of this._edits) {
                //check: not overwriting, but ignoring, and the target file exists
                const skip = edit.options.overwrite === undefined && edit.options.ignoreIfExists && await this._fileService.exists(edit.newUri);
                if (!skip) {
                    copies.push({ file: { source: edit.oldUri, target: edit.newUri }, overwrite: edit.options.overwrite });
                }
            }
            if (copies.length === 0) {
                return new Noop();
            }
            // (2) perform the actual copy and use the return stats to build undo edits
            const stats = await this._workingCopyFileService.copy(copies, token, this._undoRedoInfo);
            const undoes = [];
            for (let i = 0; i < stats.length; i++) {
                const stat = stats[i];
                const edit = this._edits[i];
                undoes.push(new DeleteEdit(stat.resource, { recursive: true, folder: this._edits[i].options.folder || stat.isDirectory, ...edit.options }, false));
            }
            return this._instaService.createInstance(DeleteOperation, undoes, { isUndoing: true });
        }
        toString() {
            return `(copy ${this._edits.map(edit => `${edit.oldUri} to ${edit.newUri}`).join(', ')})`;
        }
    };
    CopyOperation = __decorate([
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, files_1.IFileService),
        __param(4, instantiation_1.IInstantiationService)
    ], CopyOperation);
    class CreateEdit {
        constructor(newUri, options, contents) {
            this.newUri = newUri;
            this.options = options;
            this.contents = contents;
            this.type = 'create';
        }
    }
    let CreateOperation = class CreateOperation {
        constructor(_edits, _undoRedoInfo, _fileService, _workingCopyFileService, _instaService, _textFileService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._fileService = _fileService;
            this._workingCopyFileService = _workingCopyFileService;
            this._instaService = _instaService;
            this._textFileService = _textFileService;
        }
        get uris() {
            return this._edits.map(edit => edit.newUri);
        }
        async perform(token) {
            const folderCreates = [];
            const fileCreates = [];
            const undoes = [];
            for (const edit of this._edits) {
                if (edit.newUri.scheme === network_1.Schemas.untitled) {
                    continue; // ignore, will be handled by a later edit
                }
                if (edit.options.overwrite === undefined && edit.options.ignoreIfExists && await this._fileService.exists(edit.newUri)) {
                    continue; // not overwriting, but ignoring, and the target file exists
                }
                if (edit.options.folder) {
                    folderCreates.push({ resource: edit.newUri });
                }
                else {
                    // If the contents are part of the edit they include the encoding, thus use them. Otherwise get the encoding for a new empty file.
                    const encodedReadable = typeof edit.contents !== 'undefined' ? edit.contents : await this._textFileService.getEncodedReadable(edit.newUri);
                    fileCreates.push({ resource: edit.newUri, contents: encodedReadable, overwrite: edit.options.overwrite });
                }
                undoes.push(new DeleteEdit(edit.newUri, edit.options, !edit.options.folder && !edit.contents));
            }
            if (folderCreates.length === 0 && fileCreates.length === 0) {
                return new Noop();
            }
            await this._workingCopyFileService.createFolder(folderCreates, token, this._undoRedoInfo);
            await this._workingCopyFileService.create(fileCreates, token, this._undoRedoInfo);
            return this._instaService.createInstance(DeleteOperation, undoes, { isUndoing: true });
        }
        toString() {
            return `(create ${this._edits.map(edit => edit.options.folder ? `folder ${edit.newUri}` : `file ${edit.newUri} with ${edit.contents?.byteLength || 0} bytes`).join(', ')})`;
        }
    };
    CreateOperation = __decorate([
        __param(2, files_1.IFileService),
        __param(3, workingCopyFileService_1.IWorkingCopyFileService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, textfiles_1.ITextFileService)
    ], CreateOperation);
    class DeleteEdit {
        constructor(oldUri, options, undoesCreate) {
            this.oldUri = oldUri;
            this.options = options;
            this.undoesCreate = undoesCreate;
            this.type = 'delete';
        }
    }
    let DeleteOperation = class DeleteOperation {
        constructor(_edits, _undoRedoInfo, _workingCopyFileService, _fileService, _configurationService, _instaService, _logService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._workingCopyFileService = _workingCopyFileService;
            this._fileService = _fileService;
            this._configurationService = _configurationService;
            this._instaService = _instaService;
            this._logService = _logService;
        }
        get uris() {
            return this._edits.map(edit => edit.oldUri);
        }
        async perform(token) {
            // delete file
            const deletes = [];
            const undoes = [];
            for (const edit of this._edits) {
                let fileStat;
                try {
                    fileStat = await this._fileService.resolve(edit.oldUri, { resolveMetadata: true });
                }
                catch (err) {
                    if (!edit.options.ignoreIfNotExists) {
                        throw new Error(`${edit.oldUri} does not exist and can not be deleted`);
                    }
                    continue;
                }
                deletes.push({
                    resource: edit.oldUri,
                    recursive: edit.options.recursive,
                    useTrash: !edit.options.skipTrashBin && this._fileService.hasCapability(edit.oldUri, 4096 /* FileSystemProviderCapabilities.Trash */) && this._configurationService.getValue('files.enableTrash')
                });
                // read file contents for undo operation. when a file is too large it won't be restored
                let fileContent;
                if (!edit.undoesCreate && !edit.options.folder && !(typeof edit.options.maxSize === 'number' && fileStat.size > edit.options.maxSize)) {
                    try {
                        fileContent = await this._fileService.readFile(edit.oldUri);
                    }
                    catch (err) {
                        this._logService.error(err);
                    }
                }
                if (fileContent !== undefined) {
                    undoes.push(new CreateEdit(edit.oldUri, edit.options, fileContent.value));
                }
            }
            if (deletes.length === 0) {
                return new Noop();
            }
            await this._workingCopyFileService.delete(deletes, token, this._undoRedoInfo);
            if (undoes.length === 0) {
                return new Noop();
            }
            return this._instaService.createInstance(CreateOperation, undoes, { isUndoing: true });
        }
        toString() {
            return `(delete ${this._edits.map(edit => edit.oldUri).join(', ')})`;
        }
    };
    DeleteOperation = __decorate([
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, files_1.IFileService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, log_1.ILogService)
    ], DeleteOperation);
    class FileUndoRedoElement {
        constructor(label, code, operations, confirmBeforeUndo) {
            this.label = label;
            this.code = code;
            this.operations = operations;
            this.confirmBeforeUndo = confirmBeforeUndo;
            this.type = 1 /* UndoRedoElementType.Workspace */;
            this.resources = operations.flatMap(op => op.uris);
        }
        async undo() {
            await this._reverse();
        }
        async redo() {
            await this._reverse();
        }
        async _reverse() {
            for (let i = 0; i < this.operations.length; i++) {
                const op = this.operations[i];
                const undo = await op.perform(cancellation_1.CancellationToken.None);
                this.operations[i] = undo;
            }
        }
        toString() {
            return this.operations.map(op => String(op)).join(', ');
        }
    }
    let BulkFileEdits = class BulkFileEdits {
        constructor(_label, _code, _undoRedoGroup, _undoRedoSource, _confirmBeforeUndo, _progress, _token, _edits, _instaService, _undoRedoService) {
            this._label = _label;
            this._code = _code;
            this._undoRedoGroup = _undoRedoGroup;
            this._undoRedoSource = _undoRedoSource;
            this._confirmBeforeUndo = _confirmBeforeUndo;
            this._progress = _progress;
            this._token = _token;
            this._edits = _edits;
            this._instaService = _instaService;
            this._undoRedoService = _undoRedoService;
        }
        async apply() {
            const undoOperations = [];
            const undoRedoInfo = { undoRedoGroupId: this._undoRedoGroup.id };
            const edits = [];
            for (const edit of this._edits) {
                if (edit.newResource && edit.oldResource && !edit.options?.copy) {
                    edits.push(new RenameEdit(edit.newResource, edit.oldResource, edit.options ?? {}));
                }
                else if (edit.newResource && edit.oldResource && edit.options?.copy) {
                    edits.push(new CopyEdit(edit.newResource, edit.oldResource, edit.options ?? {}));
                }
                else if (!edit.newResource && edit.oldResource) {
                    edits.push(new DeleteEdit(edit.oldResource, edit.options ?? {}, false));
                }
                else if (edit.newResource && !edit.oldResource) {
                    edits.push(new CreateEdit(edit.newResource, edit.options ?? {}, await edit.options.contents));
                }
            }
            if (edits.length === 0) {
                return [];
            }
            const groups = [];
            groups[0] = [edits[0]];
            for (let i = 1; i < edits.length; i++) {
                const edit = edits[i];
                const lastGroup = (0, arrays_1.tail)(groups);
                if (lastGroup?.[0].type === edit.type) {
                    lastGroup.push(edit);
                }
                else {
                    groups.push([edit]);
                }
            }
            for (const group of groups) {
                if (this._token.isCancellationRequested) {
                    break;
                }
                let op;
                switch (group[0].type) {
                    case 'rename':
                        op = this._instaService.createInstance(RenameOperation, group, undoRedoInfo);
                        break;
                    case 'copy':
                        op = this._instaService.createInstance(CopyOperation, group, undoRedoInfo);
                        break;
                    case 'delete':
                        op = this._instaService.createInstance(DeleteOperation, group, undoRedoInfo);
                        break;
                    case 'create':
                        op = this._instaService.createInstance(CreateOperation, group, undoRedoInfo);
                        break;
                }
                if (op) {
                    const undoOp = await op.perform(this._token);
                    undoOperations.push(undoOp);
                }
                this._progress.report(undefined);
            }
            const undoRedoElement = new FileUndoRedoElement(this._label, this._code, undoOperations, this._confirmBeforeUndo);
            this._undoRedoService.pushElement(undoRedoElement, this._undoRedoGroup, this._undoRedoSource);
            return undoRedoElement.resources;
        }
    };
    exports.BulkFileEdits = BulkFileEdits;
    exports.BulkFileEdits = BulkFileEdits = __decorate([
        __param(8, instantiation_1.IInstantiationService),
        __param(9, undoRedo_1.IUndoRedoService)
    ], BulkFileEdits);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0ZpbGVFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2J1bGtFZGl0L2Jyb3dzZXIvYnVsa0ZpbGVFZGl0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd0JoRyxNQUFNLElBQUk7UUFBVjtZQUNVLFNBQUksR0FBRyxFQUFFLENBQUM7UUFLcEIsQ0FBQztRQUpBLEtBQUssQ0FBQyxPQUFPLEtBQUssT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLFFBQVE7WUFDUCxPQUFPLFFBQVEsQ0FBQztRQUNqQixDQUFDO0tBQ0Q7SUFFRCxNQUFNLFVBQVU7UUFFZixZQUNVLE1BQVcsRUFDWCxNQUFXLEVBQ1gsT0FBaUM7WUFGakMsV0FBTSxHQUFOLE1BQU0sQ0FBSztZQUNYLFdBQU0sR0FBTixNQUFNLENBQUs7WUFDWCxZQUFPLEdBQVAsT0FBTyxDQUEwQjtZQUpsQyxTQUFJLEdBQUcsUUFBUSxDQUFDO1FBS3JCLENBQUM7S0FDTDtJQUVELElBQU0sZUFBZSx1QkFBckIsTUFBTSxlQUFlO1FBRXBCLFlBQ2tCLE1BQW9CLEVBQ3BCLGFBQXlDLEVBQ2hCLHVCQUFnRCxFQUMzRCxZQUEwQjtZQUh4QyxXQUFNLEdBQU4sTUFBTSxDQUFjO1lBQ3BCLGtCQUFhLEdBQWIsYUFBYSxDQUE0QjtZQUNoQiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBQzNELGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBQ3RELENBQUM7UUFFTCxJQUFJLElBQUk7WUFDUCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFD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