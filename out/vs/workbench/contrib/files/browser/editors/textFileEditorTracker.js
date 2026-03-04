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
define(["require", "exports", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/workbench/services/host/browser/host", "vs/workbench/services/editor/common/editorService", "vs/base/common/async", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/contrib/files/common/files", "vs/base/common/network", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/common/editor"], function (require, exports, textfiles_1, lifecycle_1, lifecycle_2, arrays_1, host_1, editorService_1, async_1, codeEditorService_1, filesConfigurationService_1, files_1, network_1, untitledTextEditorInput_1, workingCopyEditorService_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditorTracker = void 0;
    let TextFileEditorTracker = class TextFileEditorTracker extends lifecycle_2.Disposable {
        static { this.ID = 'workbench.contrib.textFileEditorTracker'; }
        constructor(editorService, textFileService, lifecycleService, hostService, codeEditorService, filesConfigurationService, workingCopyEditorService) {
            super();
            this.editorService = editorService;
            this.textFileService = textFileService;
            this.lifecycleService = lifecycleService;
            this.hostService = hostService;
            this.codeEditorService = codeEditorService;
            this.filesConfigurationService = filesConfigurationService;
            this.workingCopyEditorService = workingCopyEditorService;
            //#region Text File: Ensure every dirty text and untitled file is opened in an editor
            this.ensureDirtyFilesAreOpenedWorker = this._register(new async_1.RunOnceWorker(units => this.ensureDirtyTextFilesAreOpened(units), this.getDirtyTextFileTrackerDelay()));
            this.registerListeners();
        }
        registerListeners() {
            // Ensure dirty text file and untitled models are always opened as editors
            this._register(this.textFileService.files.onDidChangeDirty(model => this.ensureDirtyFilesAreOpenedWorker.work(model.resource)));
            this._register(this.textFileService.files.onDidSaveError(model => this.ensureDirtyFilesAreOpenedWorker.work(model.resource)));
            this._register(this.textFileService.untitled.onDidChangeDirty(model => this.ensureDirtyFilesAreOpenedWorker.work(model.resource)));
            // Update visible text file editors when focus is gained
            this._register(this.hostService.onDidChangeFocus(hasFocus => hasFocus ? this.reloadVisibleTextFileEditors() : undefined));
            // Lifecycle
            this._register(this.lifecycleService.onDidShutdown(() => this.dispose()));
        }
        getDirtyTextFileTrackerDelay() {
            return 800; // encapsulated in a method for tests to override
        }
        ensureDirtyTextFilesAreOpened(resources) {
            this.doEnsureDirtyTextFilesAreOpened((0, arrays_1.distinct)(resources.filter(resource => {
                if (!this.textFileService.isDirty(resource)) {
                    return false; // resource must be dirty
                }
                const fileModel = this.textFileService.files.get(resource);
                if (fileModel?.hasState(2 /* TextFileEditorModelState.PENDING_SAVE */)) {
                    return false; // resource must not be pending to save
                }
                if (resource.scheme !== network_1.Schemas.untitled && !fileModel?.hasState(5 /* TextFileEditorModelState.ERROR */) && this.filesConfigurationService.hasShortAutoSaveDelay(resource)) {
                    // leave models auto saved after short delay unless
                    // the save resulted in an error and not for untitled
                    // that are not auto-saved anyway
                    return false;
                }
                if (this.editorService.isOpened({ resource, typeId: resource.scheme === network_1.Schemas.untitled ? untitledTextEditorInput_1.UntitledTextEditorInput.ID : files_1.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id })) {
                    return false; // model must not be opened already as file (fast check via editor type)
                }
                const model = fileModel ?? this.textFileService.untitled.get(resource);
                if (model && this.workingCopyEditorService.findEditor(model)) {
                    return false; // model must not be opened already as file (slower check via working copy)
                }
                return true;
            }), resource => resource.toString()));
        }
        doEnsureDirtyTextFilesAreOpened(resources) {
            if (!resources.length) {
                return;
            }
            this.editorService.openEditors(resources.map(resource => ({
                resource,
                options: { inactive: true, pinned: true, preserveFocus: true }
            })));
        }
        //#endregion
        //#region Window Focus Change: Update visible code editors when focus is gained that have a known text file model
        reloadVisibleTextFileEditors() {
            // the window got focus and we use this as a hint that files might have been changed outside
            // of this window. since file events can be unreliable, we queue a load for models that
            // are visible in any editor. since this is a fast operation in the case nothing has changed,
            // we tolerate the additional work.
            (0, arrays_1.distinct)((0, arrays_1.coalesce)(this.codeEditorService.listCodeEditors()
                .map(codeEditor => {
                const resource = codeEditor.getModel()?.uri;
                if (!resource) {
                    return undefined;
                }
                const model = this.textFileService.files.get(resource);
                if (!model || model.isDirty() || !model.isResolved()) {
                    return undefined;
                }
                return model;
            })), model => model.resource.toString()).forEach(model => this.textFileService.files.resolve(model.resource, { reload: { async: true } }));
        }
    };
    exports.TextFileEditorTracker = TextFileEditorTracker;
    exports.TextFileEditorTracker = TextFileEditorTracker = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, host_1.IHostService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, filesConfigurationService_1.IFilesConfigurationService),
        __param(6, workingCopyEditorService_1.IWorkingCopyEditorService)
    ], TextFileEditorTracker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3JUcmFja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci9lZGl0b3JzL3RleHRGaWxlRWRpdG9yVHJhY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7aUJBRXBDLE9BQUUsR0FBRyx5Q0FBeUMsQUFBNUMsQ0FBNkM7UUFFL0QsWUFDaUIsYUFBOEMsRUFDNUMsZUFBa0QsRUFDakQsZ0JBQW9ELEVBQ3pELFdBQTBDLEVBQ3BDLGlCQUFzRCxFQUM5Qyx5QkFBc0UsRUFDdkUsd0JBQW9FO1lBRS9GLEtBQUssRUFBRSxDQUFDO1lBUnlCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN4QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzdCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBNEI7WUFDdEQsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEyQjtZQXFCaEcscUZBQXFGO1lBRXBFLG9DQUErQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxxQkFBYSxDQUFNLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQW5CbEwsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUV4QiwwRUFBMEU7WUFD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