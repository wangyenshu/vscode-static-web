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
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/resources", "vs/base/common/actions", "vs/base/common/uri", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/editor/common/services/resolverService", "vs/base/common/map", "vs/workbench/common/editor/diffEditorInput", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/contrib/files/browser/fileConstants", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/base/common/platform", "vs/base/common/network", "vs/workbench/services/preferences/common/preferences", "vs/workbench/common/editor", "vs/base/common/hash"], function (require, exports, nls_1, errorMessage_1, resources_1, actions_1, uri_1, textfiles_1, instantiation_1, lifecycle_1, resolverService_1, map_1, diffEditorInput_1, contextkey_1, files_1, fileEditorInput_1, fileConstants_1, notification_1, opener_1, storage_1, productService_1, event_1, editorService_1, platform_1, network_1, preferences_1, editor_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.revertLocalChangesCommand = exports.acceptLocalChangesCommand = exports.TextFileSaveErrorHandler = exports.CONFLICT_RESOLUTION_SCHEME = exports.CONFLICT_RESOLUTION_CONTEXT = void 0;
    exports.CONFLICT_RESOLUTION_CONTEXT = 'saveConflictResolutionContext';
    exports.CONFLICT_RESOLUTION_SCHEME = 'conflictResolution';
    const LEARN_MORE_DIRTY_WRITE_IGNORE_KEY = 'learnMoreDirtyWriteError';
    const conflictEditorHelp = (0, nls_1.localize)('userGuide', "Use the actions in the editor tool bar to either undo your changes or overwrite the content of the file with your changes.");
    // A handler for text file save error happening with conflict resolution actions
    let TextFileSaveErrorHandler = class TextFileSaveErrorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.textFileSaveErrorHandler'; }
        constructor(notificationService, textFileService, contextKeyService, editorService, textModelService, instantiationService, storageService) {
            super();
            this.notificationService = notificationService;
            this.textFileService = textFileService;
            this.contextKeyService = contextKeyService;
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.messages = new map_1.ResourceMap();
            this.conflictResolutionContext = new contextkey_1.RawContextKey(exports.CONFLICT_RESOLUTION_CONTEXT, false, true).bindTo(this.contextKeyService);
            this.activeConflictResolutionResource = undefined;
            const provider = this._register(instantiationService.createInstance(files_1.TextFileContentProvider));
            this._register(textModelService.registerTextModelContentProvider(exports.CONFLICT_RESOLUTION_SCHEME, provider));
            // Set as save error handler to service for text files
            this.textFileService.files.saveErrorHandler = this;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.textFileService.files.onDidSave(e => this.onFileSavedOrReverted(e.model.resource)));
            this._register(this.textFileService.files.onDidRevert(model => this.onFileSavedOrReverted(model.resource)));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChanged()));
        }
        onActiveEditorChanged() {
            let isActiveEditorSaveConflictResolution = false;
            let activeConflictResolutionResource;
            const activeInput = this.editorService.activeEditor;
            if (activeInput instanceof diffEditorInput_1.DiffEditorInput) {
                const resource = activeInput.original.resource;
                if (resource?.scheme === exports.CONFLICT_RESOLUTION_SCHEME) {
                    isActiveEditorSaveConflictResolution = true;
                    activeConflictResolutionResource = activeInput.modified.resource;
                }
            }
            this.conflictResolutionContext.set(isActiveEditorSaveConflictResolution);
            this.activeConflictResolutionResource = activeConflictResolutionResource;
        }
        onFileSavedOrReverted(resource) {
            const messageHandle = this.messages.get(resource);
            if (messageHandle) {
                messageHandle.close();
                this.messages.delete(resource);
            }
        }
        onSaveError(error, model, options) {
            const fileOperationError = error;
            const resource = model.resource;
            let message;
            const primaryActions = [];
            const secondaryActions = [];
            // Dirty write prevention
            if (fileOperationError.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                // If the user tried to save from the opened conflict editor, show its message again
                if (this.activeConflictResolutionResource && (0, resources_1.isEqual)(this.activeConflictResolutionResource, model.resource)) {
                    if (this.storageService.getBoolean(LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, -1 /* StorageScope.APPLICATION */)) {
                        return; // return if this message is ignored
                    }
                    message = conflictEditorHelp;
                    primaryActions.push(this.instantiationService.createInstance(ResolveConflictLearnMoreAction));
                    secondaryActions.push(this.instantiationService.createInstance(DoNotShowResolveConflictLearnMoreAction));
                }
                // Otherwise show the message that will lead the user into the save conflict editor.
                else {
                    message = (0, nls_1.localize)('staleSaveError', "Failed to save '{0}': The content of the file is newer. Please compare your version with the file contents or overwrite the content of the file with your changes.", (0, resources_1.basename)(resource));
                    primaryActions.push(this.instantiationService.createInstance(ResolveSaveConflictAction, model));
                    primaryActions.push(this.instantiationService.createInstance(SaveModelIgnoreModifiedSinceAction, model, options));
                    secondaryActions.push(this.instantiationService.createInstance(ConfigureSaveConflictAction));
                }
            }
            // Any other save error
            else {
                const isWriteLocked = fileOperationError.fileOperationResult === 5 /* FileOperationResult.FILE_WRITE_LOCKED */;
                const triedToUnlock = isWriteLocked && fileOperationError.options?.unlock;
                const isPermissionDenied = fileOperationError.fileOperationResult === 6 /* FileOperationResult.FILE_PERMISSION_DENIED */;
                const canSaveElevated = resource.scheme === network_1.Schemas.file; // currently only supported for local schemes (https://github.com/microsoft/vscode/issues/48659)
                // Save Elevated
                if (canSaveElevated && (isPermissionDenied || triedToUnlock)) {
                    primaryActions.push(this.instantiationService.createInstance(SaveModelElevatedAction, model, options, !!triedToUnlock));
                }
                // Unlock
                else if (isWriteLocked) {
                    primaryActions.push(this.instantiationService.createInstance(UnlockModelAction, model, options));
                }
                // Retry
                else {
                    primaryActions.push(this.instantiationService.createInstance(RetrySaveModelAction, model, options));
                }
                // Save As
                primaryActions.push(this.instantiationService.createInstance(SaveModelAsAction, model));
                // Discard
                primaryActions.push(this.instantiationService.createInstance(DiscardModelAction, model));
                // Message
                if (isWriteLocked) {
                    if (triedToUnlock && canSaveElevated) {
                        message = platform_1.isWindows ? (0, nls_1.localize)('readonlySaveErrorAdmin', "Failed to save '{0}': File is read-only. Select 'Overwrite as Admin' to retry as administrator.", (0, resources_1.basename)(resource)) : (0, nls_1.localize)('readonlySaveErrorSudo', "Failed to save '{0}': File is read-only. Select 'Overwrite as Sudo' to retry as superuser.", (0, resources_1.basename)(resource));
                    }
                    else {
                        message = (0, nls_1.localize)('readonlySaveError', "Failed to save '{0}': File is read-only. Select 'Overwrite' to attempt to make it writeable.", (0, resources_1.basename)(resource));
                    }
                }
                else if (canSaveElevated && isPermissionDenied) {
                    message = platform_1.isWindows ? (0, nls_1.localize)('permissionDeniedSaveError', "Failed to save '{0}': Insufficient permissions. Select 'Retry as Admin' to retry as administrator.", (0, resources_1.basename)(resource)) : (0, nls_1.localize)('permissionDeniedSaveErrorSudo', "Failed to save '{0}': Insufficient permissions. Select 'Retry as Sudo' to retry as superuser.", (0, resources_1.basename)(resource));
                }
                else {
                    message = (0, nls_1.localize)({ key: 'genericSaveError', comment: ['{0} is the resource that failed to save and {1} the error message'] }, "Failed to save '{0}': {1}", (0, resources_1.basename)(resource), (0, errorMessage_1.toErrorMessage)(error, false));
                }
            }
            // Show message and keep function to hide in case the file gets saved/reverted
            const actions = { primary: primaryActions, secondary: secondaryActions };
            const handle = this.notificationService.notify({
                id: `${(0, hash_1.hash)(model.resource.toString())}`, // unique per model (https://github.com/microsoft/vscode/issues/121539)
                severity: notification_1.Severity.Error,
                message,
                actions
            });
            event_1.Event.once(handle.onDidClose)(() => { (0, lifecycle_1.dispose)(primaryActions); (0, lifecycle_1.dispose)(secondaryActions); });
            this.messages.set(model.resource, handle);
        }
        dispose() {
            super.dispose();
            this.messages.clear();
        }
    };
    exports.TextFileSaveErrorHandler = TextFileSaveErrorHandler;
    exports.TextFileSaveErrorHandler = TextFileSaveErrorHandler = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, editorService_1.IEditorService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, storage_1.IStorageService)
    ], TextFileSaveErrorHandler);
    const pendingResolveSaveConflictMessages = [];
    function clearPendingResolveSaveConflictMessages() {
        while (pendingResolveSaveConflictMessages.length > 0) {
            const item = pendingResolveSaveConflictMessages.pop();
            item?.close();
        }
    }
    let ResolveConflictLearnMoreAction = class ResolveConflictLearnMoreAction extends actions_1.Action {
        constructor(openerService) {
            super('workbench.files.action.resolveConflictLearnMore', (0, nls_1.localize)('learnMore', "Learn More"));
            this.openerService = openerService;
        }
        async run() {
            await this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=868264'));
        }
    };
    ResolveConflictLearnMoreAction = __decorate([
        __param(0, opener_1.IOpenerService)
    ], ResolveConflictLearnMoreAction);
    let DoNotShowResolveConflictLearnMoreAction = class DoNotShowResolveConflictLearnMoreAction extends actions_1.Action {
        constructor(storageService) {
            super('workbench.files.action.resolveConflictLearnMoreDoNotShowAgain', (0, nls_1.localize)('dontShowAgain', "Don't Show Again"));
            this.storageService = storageService;
        }
        async run(notification) {
            // Remember this as application state
            this.storageService.store(LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            // Hide notification
            notification.dispose();
        }
    };
    DoNotShowResolveConflictLearnMoreAction = __decorate([
        __param(0, storage_1.IStorageService)
    ], DoNotShowResolveConflictLearnMoreAction);
    let ResolveSaveConflictAction = class ResolveSaveConflictAction extends actions_1.Action {
        constructor(model, editorService, notificationService, instantiationService, productService) {
            super('workbench.files.action.resolveConflict', (0, nls_1.localize)('compareChanges', "Compare"));
            this.model = model;
            this.editorService = editorService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
            this.productService = productService;
        }
        async run() {
            if (!this.model.isDisposed()) {
                const resource = this.model.resource;
                const name = (0, resources_1.basename)(resource);
                const editorLabel = (0, nls_1.localize)('saveConflictDiffLabel', "{0} (in file) ↔ {1} (in {2}) - Resolve save conflict", name, name, this.productService.nameLong);
                await files_1.TextFileContentProvider.open(resource, exports.CONFLICT_RESOLUTION_SCHEME, editorLabel, this.editorService, { pinned: true });
                // Show additional help how to resolve the save conflict
                const actions = { primary: [this.instantiationService.createInstance(ResolveConflictLearnMoreAction)] };
                const handle = this.notificationService.notify({
                    id: `${(0, hash_1.hash)(resource.toString())}`, // unique per model
                    severity: notification_1.Severity.Info,
                    message: conflictEditorHelp,
                    actions,
                    neverShowAgain: { id: LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, isSecondary: true }
                });
                event_1.Event.once(handle.onDidClose)(() => (0, lifecycle_1.dispose)(actions.primary));
                pendingResolveSaveConflictMessages.push(handle);
            }
        }
    };
    ResolveSaveConflictAction = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, notification_1.INotificationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, productService_1.IProductService)
    ], ResolveSaveConflictAction);
    class SaveModelElevatedAction extends actions_1.Action {
        constructor(model, options, triedToUnlock) {
            super('workbench.files.action.saveModelElevated', triedToUnlock ? platform_1.isWindows ? (0, nls_1.localize)('overwriteElevated', "Overwrite as Admin...") : (0, nls_1.localize)('overwriteElevatedSudo', "Overwrite as Sudo...") : platform_1.isWindows ? (0, nls_1.localize)('saveElevated', "Retry as Admin...") : (0, nls_1.localize)('saveElevatedSudo', "Retry as Sudo..."));
            this.model = model;
            this.options = options;
            this.triedToUnlock = triedToUnlock;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.save({
                    ...this.options,
                    writeElevated: true,
                    writeUnlock: this.triedToUnlock,
                    reason: 1 /* SaveReason.EXPLICIT */
                });
            }
        }
    }
    class RetrySaveModelAction extends actions_1.Action {
        constructor(model, options) {
            super('workbench.files.action.saveModel', (0, nls_1.localize)('retry', "Retry"));
            this.model = model;
            this.options = options;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.save({ ...this.options, reason: 1 /* SaveReason.EXPLICIT */ });
            }
        }
    }
    class DiscardModelAction extends actions_1.Action {
        constructor(model) {
            super('workbench.files.action.discardModel', (0, nls_1.localize)('discard', "Discard"));
            this.model = model;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.revert();
            }
        }
    }
    let SaveModelAsAction = class SaveModelAsAction extends actions_1.Action {
        constructor(model, editorService) {
            super('workbench.files.action.saveModelAs', fileConstants_1.SAVE_FILE_AS_LABEL.value);
            this.model = model;
            this.editorService = editorService;
        }
        async run() {
            if (!this.model.isDisposed()) {
                const editor = this.findEditor();
                if (editor) {
                    await this.editorService.save(editor, { saveAs: true, reason: 1 /* SaveReason.EXPLICIT */ });
                }
            }
        }
        findEditor() {
            let preferredMatchingEditor;
            const editors = this.editorService.findEditors(this.model.resource, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            for (const identifier of editors) {
                if (identifier.editor instanceof fileEditorInput_1.FileEditorInput) {
                    // We prefer a `FileEditorInput` for "Save As", but it is possible
                    // that a custom editor is leveraging the text file model and as
                    // such we need to fallback to any other editor having the resource
                    // opened for running the save.
                    preferredMatchingEditor = identifier;
                    break;
                }
                else if (!preferredMatchingEditor) {
                    preferredMatchingEditor = identifier;
                }
            }
            return preferredMatchingEditor;
        }
    };
    SaveModelAsAction = __decorate([
        __param(1, editorService_1.IEditorService)
    ], SaveModelAsAction);
    class UnlockModelAction extends actions_1.Action {
        constructor(model, options) {
            super('workbench.files.action.unlock', (0, nls_1.localize)('overwrite', "Overwrite"));
            this.model = model;
            this.options = options;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.save({ ...this.options, writeUnlock: true, reason: 1 /* SaveReason.EXPLICIT */ });
            }
        }
    }
    class SaveModelIgnoreModifiedSinceAction extends actions_1.Action {
        constructor(model, options) {
            super('workbench.files.action.saveIgnoreModifiedSince', (0, nls_1.localize)('overwrite', "Overwrite"));
            this.model = model;
            this.options = options;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.save({ ...this.options, ignoreModifiedSince: true, reason: 1 /* SaveReason.EXPLICIT */ });
            }
        }
    }
    let ConfigureSaveConflictAction = class ConfigureSaveConflictAction extends actions_1.Action {
        constructor(preferencesService) {
            super('workbench.files.action.configureSaveConflict', (0, nls_1.localize)('configure', "Configure"));
            this.preferencesService = preferencesService;
        }
        async run() {
            this.preferencesService.openSettings({ query: 'files.saveConflictResolution' });
        }
    };
    ConfigureSaveConflictAction = __decorate([
        __param(0, preferences_1.IPreferencesService)
    ], ConfigureSaveConflictAction);
    const acceptLocalChangesCommand = (accessor, resource) => {
        return acceptOrRevertLocalChangesCommand(accessor, resource, true);
    };
    exports.acceptLocalChangesCommand = acceptLocalChangesCommand;
    const revertLocalChangesCommand = (accessor, resource) => {
        return acceptOrRevertLocalChangesCommand(accessor, resource, false);
    };
    exports.revertLocalChangesCommand = revertLocalChangesCommand;
    async function acceptOrRevertLocalChangesCommand(accessor, resource, accept) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editorPane = editorService.activeEditorPane;
        if (!editorPane) {
            return;
        }
        const editor = editorPane.input;
        const group = editorPane.group;
        // Hide any previously shown message about how to use these actions
        clearPendingResolveSaveConflictMessages();
        // Accept or revert
        if (accept) {
            const options = { ignoreModifiedSince: true, reason: 1 /* SaveReason.EXPLICIT */ };
            await editorService.save({ editor, groupId: group.id }, options);
        }
        else {
            await editorService.revert({ editor, groupId: group.id });
        }
        // Reopen original editor
        await editorService.openEditor({ resource }, group);
        // Clean up
        return group.closeEditor(editor);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVTYXZlRXJyb3JIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci9lZGl0b3JzL3RleHRGaWxlU2F2ZUVycm9ySGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUErQm5GLFFBQUEsMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDOUQsUUFBQSwwQkFBMEIsR0FBRyxvQkFBb0IsQ0FBQztJQUUvRCxNQUFNLGlDQUFpQyxHQUFHLDBCQUEwQixDQUFDO0lBRXJFLE1BQU0sa0JBQWtCLEdBQUcsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLDRIQUE0SCxDQUFDLENBQUM7SUFFL0ssZ0ZBQWdGO0lBQ3pFLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7aUJBRXZDLE9BQUUsR0FBRyw0Q0FBNEMsQUFBL0MsQ0FBZ0Q7UUFNbEUsWUFDdUIsbUJBQTBELEVBQzlELGVBQWtELEVBQ2hELGlCQUE2QyxFQUNqRCxhQUE4QyxFQUMzQyxnQkFBbUMsRUFDL0Isb0JBQTRELEVBQ2xFLGNBQWdEO1lBRWpFLEtBQUssRUFBRSxDQUFDO1lBUitCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDN0Msb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3hDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDaEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBRXRCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBWGpELGFBQVEsR0FBRyxJQUFJLGlCQUFXLEVBQXVCLENBQUM7WUFDbEQsOEJBQXlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG1DQUEy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