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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/host/browser/host", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/log/common/log", "vs/platform/markers/common/markers", "vs/base/common/map", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, lifecycle_1, filesConfigurationService_1, host_1, editorService_1, editorGroupsService_1, workingCopyService_1, log_1, markers_1, map_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorAutoSave = void 0;
    let EditorAutoSave = class EditorAutoSave extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.editorAutoSave'; }
        constructor(filesConfigurationService, hostService, editorService, editorGroupService, workingCopyService, logService, markerService, uriIdentityService) {
            super();
            this.filesConfigurationService = filesConfigurationService;
            this.hostService = hostService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.workingCopyService = workingCopyService;
            this.logService = logService;
            this.markerService = markerService;
            this.uriIdentityService = uriIdentityService;
            // Auto save: after delay
            this.scheduledAutoSavesAfterDelay = new Map();
            // Auto save: focus change & window change
            this.lastActiveEditor = undefined;
            this.lastActiveGroupId = undefined;
            this.lastActiveEditorControlDisposable = this._register(new lifecycle_1.DisposableStore());
            // Auto save: waiting on specific condition
            this.waitingOnConditionAutoSaveWorkingCopies = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.waitingOnConditionAutoSaveEditors = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            // Fill in initial dirty working copies
            for (const dirtyWorkingCopy of this.workingCopyService.dirtyWorkingCopies) {
                this.onDidRegister(dirtyWorkingCopy);
            }
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.hostService.onDidChangeFocus(focused => this.onWindowFocusChange(focused)));
            this._register(this.hostService.onDidChangeActiveWindow(() => this.onActiveWindowChange()));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onDidActiveEditorChange()));
            this._register(this.filesConfigurationService.onDidChangeAutoSaveConfiguration(() => this.onDidChangeAutoSaveConfiguration()));
            // Working Copy events
            this._register(this.workingCopyService.onDidRegister(workingCopy => this.onDidRegister(workingCopy)));
            this._register(this.workingCopyService.onDidUnregister(workingCopy => this.onDidUnregister(workingCopy)));
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.onDidChangeDirty(workingCopy)));
            this._register(this.workingCopyService.onDidChangeContent(workingCopy => this.onDidChangeContent(workingCopy)));
            // Condition changes
            this._register(this.markerService.onMarkerChanged(e => this.onConditionChanged(e, 3 /* AutoSaveDisabledReason.ERRORS */)));
            this._register(this.filesConfigurationService.onDidChangeAutoSaveDisabled(resource => this.onConditionChanged([resource], 4 /* AutoSaveDisabledReason.DISABLED */)));
        }
        onConditionChanged(resources, condition) {
            for (const resource of resources) {
                // Waiting working copies
                const workingCopyResult = this.waitingOnConditionAutoSaveWorkingCopies.get(resource);
                if (workingCopyResult?.condition === condition) {
                    if (workingCopyResult.workingCopy.isDirty() &&
                        this.filesConfigurationService.getAutoSaveMode(workingCopyResult.workingCopy.resource, workingCopyResult.reason).mode !== 0 /* AutoSaveMode.OFF */) {
                        this.discardAutoSave(workingCopyResult.workingCopy);
                        this.logService.info(`[editor auto save] running auto save from condition change event`, workingCopyResult.workingCopy.resource.toString(), workingCopyResult.workingCopy.typeId);
                        workingCopyResult.workingCopy.save({ reason: workingCopyResult.reason });
                    }
                }
                // Waiting editors
                else {
                    const editorResult = this.waitingOnConditionAutoSaveEditors.get(resource);
                    if (editorResult?.condition === condition &&
                        !editorResult.editor.editor.isDisposed() &&
                        editorResult.editor.editor.isDirty() &&
                        this.filesConfigurationService.getAutoSaveMode(editorResult.editor.editor, editorResult.reason).mode !== 0 /* AutoSaveMode.OFF */) {
                        this.waitingOnConditionAutoSaveEditors.delete(resource);
                        this.logService.info(`[editor auto save] running auto save from condition change event with reason ${editorResult.reason}`);
                        this.editorService.save(editorResult.editor, { reason: editorResult.reason });
                    }
                }
            }
        }
        onWindowFocusChange(focused) {
            if (!focused) {
                this.maybeTriggerAutoSave(4 /* SaveReason.WINDOW_CHANGE */);
            }
        }
        onActiveWindowChange() {
            this.maybeTriggerAutoSave(4 /* SaveReason.WINDOW_CHANGE */);
        }
        onDidActiveEditorChange() {
            // Treat editor change like a focus change for our last active editor if any
            if (this.lastActiveEditor && typeof this.lastActiveGroupId === 'number') {
                this.maybeTriggerAutoSave(3 /* SaveReason.FOCUS_CHANGE */, { groupId: this.lastActiveGroupId, editor: this.lastActiveEditor });
            }
            // Remember as last active
            const activeGroup = this.editorGroupService.activeGroup;
            const activeEditor = this.lastActiveEditor = activeGroup.activeEditor ?? undefined;
            this.lastActiveGroupId = activeGroup.id;
            // Dispose previous active control listeners
            this.lastActiveEditorControlDisposable.clear();
            // Listen to focus changes on control for auto save
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditor && activeEditorPane) {
                this.lastActiveEditorControlDisposable.add(activeEditorPane.onDidBlur(() => {
                    this.maybeTriggerAutoSave(3 /* SaveReason.FOCUS_CHANGE */, { groupId: activeGroup.id, editor: activeEditor });
                }));
            }
        }
        maybeTriggerAutoSave(reason, editorIdentifier) {
            if (editorIdentifier) {
                if (!editorIdentifier.editor.isDirty() ||
                    editorIdentifier.editor.isReadonly() ||
                    editorIdentifier.editor.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                    return; // no auto save for non-dirty, readonly or untitled editors
                }
                const autoSaveMode = this.filesConfigurationService.getAutoSaveMode(editorIdentifier.editor, reason);
                if (autoSaveMode.mode !== 0 /* AutoSaveMode.OFF */) {
                    // Determine if we need to save all. In case of a window focus change we also save if
                    // auto save mode is configured to be ON_FOCUS_CHANGE (editor focus change)
                    if ((reason === 4 /* SaveReason.WINDOW_CHANGE */ && (autoSaveMode.mode === 3 /* AutoSaveMode.ON_FOCUS_CHANGE */ || autoSaveMode.mode === 4 /* AutoSaveMode.ON_WINDOW_CHANGE */)) ||
                        (reason === 3 /* SaveReason.FOCUS_CHANGE */ && autoSaveMode.mode === 3 /* AutoSaveMode.ON_FOCUS_CHANGE */)) {
                        this.logService.trace(`[editor auto save] triggering auto save with reason ${reason}`);
                        this.editorService.save(editorIdentifier, { reason });
                    }
                }
                else if (editorIdentifier.editor.resource && (autoSaveMode.reason === 3 /* AutoSaveDisabledReason.ERRORS */ || autoSaveMode.reason === 4 /* AutoSaveDisabledReason.DISABLED */)) {
                    this.waitingOnConditionAutoSaveEditors.set(editorIdentifier.editor.resource, { editor: editorIdentifier, reason, condition: autoSaveMode.reason });
                }
            }
            else {
                this.saveAllDirtyAutoSaveables(reason);
            }
        }
        onDidChangeAutoSaveConfiguration() {
            // Trigger a save-all when auto save is enabled
            let reason = undefined;
            switch (this.filesConfigurationService.getAutoSaveMode(undefined).mode) {
                case 3 /* AutoSaveMode.ON_FOCUS_CHANGE */:
                    reason = 3 /* SaveReason.FOCUS_CHANGE */;
                    break;
                case 4 /* AutoSaveMode.ON_WINDOW_CHANGE */:
                    reason = 4 /* SaveReason.WINDOW_CHANGE */;
                    break;
                case 1 /* AutoSaveMode.AFTER_SHORT_DELAY */:
                case 2 /* AutoSaveMode.AFTER_LONG_DELAY */:
                    reason = 2 /* SaveReason.AUTO */;
                    break;
            }
            if (reason) {
                this.saveAllDirtyAutoSaveables(reason);
            }
        }
        saveAllDirtyAutoSaveables(reason) {
            for (const workingCopy of this.workingCopyService.dirtyWorkingCopies) {
                if (workingCopy.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) {
                    continue; // we never auto save untitled working copies
                }
                const autoSaveMode = this.filesConfigurationService.getAutoSaveMode(workingCopy.resource, reason);
                if (autoSaveMode.mode !== 0 /* AutoSaveMode.OFF */) {
                    workingCopy.save({ reason });
                }
                else if (autoSaveMode.reason === 3 /* AutoSaveDisabledReason.ERRORS */ || autoSaveMode.reason === 4 /* AutoSaveDisabledReason.DISABLED */) {
                    this.waitingOnConditionAutoSaveWorkingCopies.set(workingCopy.resource, { workingCopy, reason, condition: autoSaveMode.reason });
                }
            }
        }
        onDidRegister(workingCopy) {
            if (workingCopy.isDirty()) {
                this.scheduleAutoSave(workingCopy);
            }
        }
        onDidUnregister(workingCopy) {
            this.discardAutoSave(workingCopy);
        }
        onDidChangeDirty(workingCopy) {
            if (workingCopy.isDirty()) {
                this.scheduleAutoSave(workingCopy);
            }
            else {
                this.discardAutoSave(workingCopy);
            }
        }
        onDidChangeContent(workingCopy) {
            if (workingCopy.isDirty()) {
                // this listener will make sure that the auto save is
                // pushed out for as long as the user is still changing
                // the content of the working copy.
                this.scheduleAutoSave(workingCopy);
            }
        }
        scheduleAutoSave(workingCopy) {
            if (workingCopy.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) {
                return; // we never auto save untitled working copies
            }
            const autoSaveAfterDelay = this.filesConfigurationService.getAutoSaveConfiguration(workingCopy.resource).autoSaveDelay;
            if (typeof autoSaveAfterDelay !== 'number') {
                return; // auto save after delay must be enabled
            }
            // Clear any running auto save operation
            this.discardAutoSave(workingCopy);
            this.logService.trace(`[editor auto save] scheduling auto save after ${autoSaveAfterDelay}ms`, workingCopy.resource.toString(), workingCopy.typeId);
            // Schedule new auto save
            const handle = setTimeout(() => {
                // Clear pending
                this.discardAutoSave(workingCopy);
                // Save if dirty and unless prevented by other conditions such as error markers
                if (workingCopy.isDirty()) {
                    const reason = 2 /* SaveReason.AUTO */;
                    const autoSaveMode = this.filesConfigurationService.getAutoSaveMode(workingCopy.resource, reason);
                    if (autoSaveMode.mode !== 0 /* AutoSaveMode.OFF */) {
                        this.logService.trace(`[editor auto save] running auto save`, workingCopy.resource.toString(), workingCopy.typeId);
                        workingCopy.save({ reason });
                    }
                    else if (autoSaveMode.reason === 3 /* AutoSaveDisabledReason.ERRORS */ || autoSaveMode.reason === 4 /* AutoSaveDisabledReason.DISABLED */) {
                        this.waitingOnConditionAutoSaveWorkingCopies.set(workingCopy.resource, { workingCopy, reason, condition: autoSaveMode.reason });
                    }
                }
            }, autoSaveAfterDelay);
            // Keep in map for disposal as needed
            this.scheduledAutoSavesAfterDelay.set(workingCopy, (0, lifecycle_1.toDisposable)(() => {
                this.logService.trace(`[editor auto save] clearing pending auto save`, workingCopy.resource.toString(), workingCopy.typeId);
                clearTimeout(handle);
            }));
        }
        discardAutoSave(workingCopy) {
            (0, lifecycle_1.dispose)(this.scheduledAutoSavesAfterDelay.get(workingCopy));
            this.scheduledAutoSavesAfterDelay.delete(workingCopy);
            this.waitingOnConditionAutoSaveWorkingCopies.delete(workingCopy.resource);
            this.waitingOnConditionAutoSaveEditors.delete(workingCopy.resource);
        }
    };
    exports.EditorAutoSave = EditorAutoSave;
    exports.EditorAutoSave = EditorAutoSave = __decorate([
        __param(0, filesConfigurationService_1.IFilesConfigurationService),
        __param(1, host_1.IHostService),
        __param(2, editorService_1.IEditorService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, workingCopyService_1.IWorkingCopyService),
        __param(5, log_1.ILogService),
        __param(6, markers_1.IMarkerService),
        __param(7, uriIdentity_1.IUriIdentityService)
    ], EditorAutoSave);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQXV0b1NhdmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yQXV0b1NhdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsc0JBQVU7aUJBRTdCLE9BQUUsR0FBRyxrQ0FBa0MsQUFBckMsQ0FBc0M7UUFjeEQsWUFDNkIseUJBQXNFLEVBQ3BGLFdBQTBDLEVBQ3hDLGFBQThDLEVBQ3hDLGtCQUF5RCxFQUMxRCxrQkFBd0QsRUFDaEUsVUFBd0MsRUFDckMsYUFBOEMsRUFDekMsa0JBQXdEO1lBRTdFLEtBQUssRUFBRSxDQUFDO1lBVHFDLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBNEI7WUFDbkUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDdkIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDekMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMvQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3BCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN4Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBcEI5RSx5QkFBeUI7WUFDUixpQ0FBNEIsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztZQUVyRiwwQ0FBMEM7WUFDbEMscUJBQWdCLEdBQTRCLFNBQVMsQ0FBQztZQUN0RCxzQkFBaUIsR0FBZ0MsU0FBUyxDQUFDO1lBQ2xELHNDQUFpQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUUzRiwyQ0FBMkM7WUFDMUIsNENBQXVDLEdBQUcsSUFBSSxp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