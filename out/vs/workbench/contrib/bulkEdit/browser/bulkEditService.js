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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/map", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/bulkEditService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/bulkEdit/browser/bulkFileEdits", "vs/workbench/contrib/bulkEdit/browser/bulkTextEdits", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyService"], function (require, exports, cancellation_1, lifecycle_1, linkedList_1, map_1, editorBrowser_1, bulkEditService_1, nls_1, configuration_1, configurationRegistry_1, dialogs_1, extensions_1, instantiation_1, log_1, progress_1, platform_1, undoRedo_1, bulkCellEdits_1, bulkFileEdits_1, bulkTextEdits_1, editorService_1, lifecycle_2, workingCopyService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditService = void 0;
    function liftEdits(edits) {
        return edits.map(edit => {
            if (bulkEditService_1.ResourceTextEdit.is(edit)) {
                return bulkEditService_1.ResourceTextEdit.lift(edit);
            }
            if (bulkEditService_1.ResourceFileEdit.is(edit)) {
                return bulkEditService_1.ResourceFileEdit.lift(edit);
            }
            if (bulkCellEdits_1.ResourceNotebookCellEdit.is(edit)) {
                return bulkCellEdits_1.ResourceNotebookCellEdit.lift(edit);
            }
            throw new Error('Unsupported edit');
        });
    }
    let BulkEdit = class BulkEdit {
        constructor(_label, _code, _editor, _progress, _token, _edits, _undoRedoGroup, _undoRedoSource, _confirmBeforeUndo, _instaService, _logService) {
            this._label = _label;
            this._code = _code;
            this._editor = _editor;
            this._progress = _progress;
            this._token = _token;
            this._edits = _edits;
            this._undoRedoGroup = _undoRedoGroup;
            this._undoRedoSource = _undoRedoSource;
            this._confirmBeforeUndo = _confirmBeforeUndo;
            this._instaService = _instaService;
            this._logService = _logService;
        }
        ariaMessage() {
            const otherResources = new map_1.ResourceMap();
            const textEditResources = new map_1.ResourceMap();
            let textEditCount = 0;
            for (const edit of this._edits) {
                if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                    textEditCount += 1;
                    textEditResources.set(edit.resource, true);
                }
                else if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    otherResources.set(edit.oldResource ?? edit.newResource, true);
                }
            }
            if (this._edits.length === 0) {
                return (0, nls_1.localize)('summary.0', "Made no edits");
            }
            else if (otherResources.size === 0) {
                if (textEditCount > 1 && textEditResources.size > 1) {
                    return (0, nls_1.localize)('summary.nm', "Made {0} text edits in {1} files", textEditCount, textEditResources.size);
                }
                else {
                    return (0, nls_1.localize)('summary.n0', "Made {0} text edits in one file", textEditCount);
                }
            }
            else {
                return (0, nls_1.localize)('summary.textFiles', "Made {0} text edits in {1} files, also created or deleted {2} files", textEditCount, textEditResources.size, otherResources.size);
            }
        }
        async perform() {
            if (this._edits.length === 0) {
                return [];
            }
            const ranges = [1];
            for (let i = 1; i < this._edits.length; i++) {
                if (Object.getPrototypeOf(this._edits[i - 1]) === Object.getPrototypeOf(this._edits[i])) {
                    ranges[ranges.length - 1]++;
                }
                else {
                    ranges.push(1);
                }
            }
            // Show infinte progress when there is only 1 item since we do not know how long it takes
            const increment = this._edits.length > 1 ? 0 : undefined;
            this._progress.report({ increment, total: 100 });
            // Increment by percentage points since progress API expects that
            const progress = { report: _ => this._progress.report({ increment: 100 / this._edits.length }) };
            const resources = [];
            let index = 0;
            for (const range of ranges) {
                if (this._token.isCancellationRequested) {
                    break;
                }
                const group = this._edits.slice(index, index + range);
                if (group[0] instanceof bulkEditService_1.ResourceFileEdit) {
                    resources.push(await this._performFileEdits(group, this._undoRedoGroup, this._undoRedoSource, this._confirmBeforeUndo, progress));
                }
                else if (group[0] instanceof bulkEditService_1.ResourceTextEdit) {
                    resources.push(await this._performTextEdits(group, this._undoRedoGroup, this._undoRedoSource, progress));
                }
                else if (group[0] instanceof bulkCellEdits_1.ResourceNotebookCellEdit) {
                    resources.push(await this._performCellEdits(group, this._undoRedoGroup, this._undoRedoSource, progress));
                }
                else {
                    console.log('UNKNOWN EDIT');
                }
                index = index + range;
            }
            return resources.flat();
        }
        async _performFileEdits(edits, undoRedoGroup, undoRedoSource, confirmBeforeUndo, progress) {
            this._logService.debug('_performFileEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(bulkFileEdits_1.BulkFileEdits, this._label || (0, nls_1.localize)('workspaceEdit', "Workspace Edit"), this._code || 'undoredo.workspaceEdit', undoRedoGroup, undoRedoSource, confirmBeforeUndo, progress, this._token, edits);
            return await model.apply();
        }
        async _performTextEdits(edits, undoRedoGroup, undoRedoSource, progress) {
            this._logService.debug('_performTextEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(bulkTextEdits_1.BulkTextEdits, this._label || (0, nls_1.localize)('workspaceEdit', "Workspace Edit"), this._code || 'undoredo.workspaceEdit', this._editor, undoRedoGroup, undoRedoSource, progress, this._token, edits);
            return await model.apply();
        }
        async _performCellEdits(edits, undoRedoGroup, undoRedoSource, progress) {
            this._logService.debug('_performCellEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(bulkCellEdits_1.BulkCellEdits, undoRedoGroup, undoRedoSource, progress, this._token, edits);
            return await model.apply();
        }
    };
    BulkEdit = __decorate([
        __param(9, instantiation_1.IInstantiationService),
        __param(10, log_1.ILogService)
    ], BulkEdit);
    let BulkEditService = class BulkEditService {
        constructor(_instaService, _logService, _editorService, _lifecycleService, _dialogService, _workingCopyService, _configService) {
            this._instaService = _instaService;
            this._logService = _logService;
            this._editorService = _editorService;
            this._lifecycleService = _lifecycleService;
            this._dialogService = _dialogService;
            this._workingCopyService = _workingCopyService;
            this._configService = _configService;
            this._activeUndoRedoGroups = new linkedList_1.LinkedList();
        }
        setPreviewHandler(handler) {
            this._previewHandler = handler;
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._previewHandler === handler) {
                    this._previewHandler = undefined;
                }
            });
        }
        hasPreviewHandler() {
            return Boolean(this._previewHandler);
        }
        async apply(editsIn, options) {
            let edits = liftEdits(Array.isArray(editsIn) ? editsIn : editsIn.edits);
            if (edits.length === 0) {
                return { ariaSummary: (0, nls_1.localize)('nothing', "Made no edits"), isApplied: false };
            }
            if (this._previewHandler && (options?.showPreview || edits.some(value => value.metadata?.needsConfirmation))) {
                edits = await this._previewHandler(edits, options);
            }
            let codeEditor = options?.editor;
            // try to find code editor
            if (!codeEditor) {
                const candidate = this._editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isCodeEditor)(candidate)) {
                    codeEditor = candidate;
                }
                else if ((0, editorBrowser_1.isDiffEditor)(candidate)) {
                    codeEditor = candidate.getModifiedEditor();
                }
            }
            if (codeEditor && codeEditor.getOption(91 /* EditorOption.readOnly */)) {
                // If the code editor is readonly still allow bulk edits to be applied #68549
                codeEditor = undefined;
            }
            // undo-redo-group: if a group id is passed then try to find it
            // in the list of active edits. otherwise (or when not found)
            // create a separate undo-redo-group
            let undoRedoGroup;
            let undoRedoGroupRemove = () => { };
            if (typeof options?.undoRedoGroupId === 'number') {
                for (const candidate of this._activeUndoRedoGroups) {
                    if (candidate.id === options.undoRedoGroupId) {
                        undoRedoGroup = candidate;
                        break;
                    }
                }
            }
            if (!undoRedoGroup) {
                undoRedoGroup = new undoRedo_1.UndoRedoGroup();
                undoRedoGroupRemove = this._activeUndoRedoGroups.push(undoRedoGroup);
            }
            const label = options?.quotableLabel || options?.label;
            const bulkEdit = this._instaService.createInstance(BulkEdit, label, options?.code, codeEditor, options?.progress ?? progress_1.Progress.None, options?.token ?? cancellation_1.CancellationToken.None, edits, undoRedoGroup, options?.undoRedoSource, !!options?.confirmBeforeUndo);
            let listener;
            try {
                listener = this._lifecycleService.onBeforeShutdown(e => e.veto(this._shouldVeto(label, e.reason), 'veto.blukEditService'));
                const resources = await bulkEdit.perform();
                // when enabled (option AND setting) loop over all dirty working copies and trigger save
                // for those that were involved in this bulk edit operation.
                if (options?.respectAutoSaveConfig && this._configService.getValue(autoSaveSetting) === true && resources.length > 1) {
                    await this._saveAll(resources);
                }
                return { ariaSummary: bulkEdit.ariaMessage(), isApplied: edits.length > 0 };
            }
            catch (err) {
                // console.log('apply FAILED');
                // console.log(err);
                this._logService.error(err);
                throw err;
            }
            finally {
                listener?.dispose();
                undoRedoGroupRemove();
            }
        }
        async _saveAll(resources) {
            const set = new map_1.ResourceSet(resources);
            const saves = this._workingCopyService.dirtyWorkingCopies.map(async (copy) => {
                if (set.has(copy.resource)) {
                    await copy.save();
                }
            });
            const result = await Promise.allSettled(saves);
            for (const item of result) {
                if (item.status === 'rejected') {
                    this._logService.warn(item.reason);
                }
            }
        }
        async _shouldVeto(label, reason) {
            let message;
            let primaryButton;
            switch (reason) {
                case 1 /* ShutdownReason.CLOSE */:
                    message = (0, nls_1.localize)('closeTheWindow.message', "Are you sure you want to close the window?");
                    primaryButton = (0, nls_1.localize)({ key: 'closeTheWindow', comment: ['&& denotes a mnemonic'] }, "&&Close Window");
                    break;
                case 4 /* ShutdownReason.LOAD */:
                    message = (0, nls_1.localize)('changeWorkspace.message', "Are you sure you want to change the workspace?");
                    primaryButton = (0, nls_1.localize)({ key: 'changeWorkspace', comment: ['&& denotes a mnemonic'] }, "Change &&Workspace");
                    break;
                case 3 /* ShutdownReason.RELOAD */:
                    message = (0, nls_1.localize)('reloadTheWindow.message', "Are you sure you want to reload the window?");
                    primaryButton = (0, nls_1.localize)({ key: 'reloadTheWindow', comment: ['&& denotes a mnemonic'] }, "&&Reload Window");
                    break;
                default:
                    message = (0, nls_1.localize)('quit.message', "Are you sure you want to quit?");
                    primaryButton = (0, nls_1.localize)({ key: 'quit', comment: ['&& denotes a mnemonic'] }, "&&Quit");
                    break;
            }
            const result = await this._dialogService.confirm({
                message,
                detail: (0, nls_1.localize)('areYouSureQuiteBulkEdit.detail', "'{0}' is in progress.", label || (0, nls_1.localize)('fileOperation', "File operation")),
                primaryButton
            });
            return !result.confirmed;
        }
    };
    exports.BulkEditService = BulkEditService;
    exports.BulkEditService = BulkEditService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService),
        __param(2, editorService_1.IEditorService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, dialogs_1.IDialogService),
        __param(5, workingCopyService_1.IWorkingCopyService),
        __param(6, configuration_1.IConfigurationService)
    ], BulkEditService);
    (0, extensions_1.registerSingleton)(bulkEditService_1.IBulkEditService, BulkEditService, 1 /* InstantiationType.Delayed */);
    const autoSaveSetting = 'files.refactoring.autoSave';
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'files',
        properties: {
            [autoSaveSetting]: {
                description: (0, nls_1.localize)('refactoring.autoSave', "Controls if files that were part of a refactoring are saved automatically"),
                default: true,
                type: 'boolean'
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYnVsa0VkaXQvYnJvd3Nlci9idWxrRWRpdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNEJoRyxTQUFTLFNBQVMsQ0FBQyxLQUFxQjtRQUN2QyxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkIsSUFBSSxrQ0FBZ0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxrQ0FBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUNELElBQUksa0NBQWdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sa0NBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLENBQUM7WUFDRCxJQUFJLHdDQUF3QixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLHdDQUF3QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtRQUViLFlBQ2tCLE1BQTBCLEVBQzFCLEtBQXlCLEVBQ3pCLE9BQWdDLEVBQ2hDLFNBQW1DLEVBQ25DLE1BQXlCLEVBQ3pCLE1BQXNCLEVBQ3RCLGNBQTZCLEVBQzdCLGVBQTJDLEVBQzNDLGtCQUEyQixFQUNKLGFBQW9DLEVBQzlDLFdBQXdCO1lBVnJDLFdBQU0s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