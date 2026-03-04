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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/map", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/resources", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/editor/browser/editorBrowser", "vs/platform/instantiation/common/extensions", "vs/base/common/types", "vs/workbench/browser/parts/editor/editorsObserver", "vs/base/common/async", "vs/platform/workspace/common/workspace", "vs/base/common/extpath", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/editor/common/editorResolverService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/host/browser/host", "vs/workbench/services/editor/common/editorGroupFinder", "vs/workbench/services/textfile/common/textEditorService", "vs/platform/instantiation/common/descriptors"], function (require, exports, instantiation_1, editor_1, editorInput_1, sideBySideEditorInput_1, map_1, files_1, event_1, uri_1, resources_1, diffEditorInput_1, editorGroupsService_1, editorService_1, configuration_1, lifecycle_1, arrays_1, editorBrowser_1, extensions_1, types_1, editorsObserver_1, async_1, workspace_1, extpath_1, uriIdentity_1, editorResolverService_1, workspaceTrust_1, host_1, editorGroupFinder_1, textEditorService_1, descriptors_1) {
    "use strict";
    var EditorService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorService = void 0;
    let EditorService = EditorService_1 = class EditorService extends lifecycle_1.Disposable {
        constructor(editorGroupsContainer, editorGroupService, instantiationService, fileService, configurationService, contextService, uriIdentityService, editorResolverService, workspaceTrustRequestService, hostService, textEditorService) {
            super();
            this.editorGroupService = editorGroupService;
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this.editorResolverService = editorResolverService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.hostService = hostService;
            this.textEditorService = textEditorService;
            //#region events
            this._onDidActiveEditorChange = this._register(new event_1.Emitter());
            this.onDidActiveEditorChange = this._onDidActiveEditorChange.event;
            this._onDidVisibleEditorsChange = this._register(new event_1.Emitter());
            this.onDidVisibleEditorsChange = this._onDidVisibleEditorsChange.event;
            this._onDidEditorsChange = this._register(new event_1.Emitter());
            this.onDidEditorsChange = this._onDidEditorsChange.event;
            this._onWillOpenEditor = this._register(new event_1.Emitter());
            this.onWillOpenEditor = this._onWillOpenEditor.event;
            this._onDidCloseEditor = this._register(new event_1.Emitter());
            this.onDidCloseEditor = this._onDidCloseEditor.event;
            this._onDidOpenEditorFail = this._register(new event_1.Emitter());
            this.onDidOpenEditorFail = this._onDidOpenEditorFail.event;
            this._onDidMostRecentlyActiveEditorsChange = this._register(new event_1.Emitter());
            this.onDidMostRecentlyActiveEditorsChange = this._onDidMostRecentlyActiveEditorsChange.event;
            //#region Editor & group event handlers
            this.lastActiveEditor = undefined;
            //#endregion
            //#region Visible Editors Change: Install file watchers for out of workspace resources that became visible
            this.activeOutOfWorkspaceWatchers = new map_1.ResourceMap();
            this.closeOnFileDelete = false;
            this.editorGroupsContainer = editorGroupsContainer ?? editorGroupService;
            this.editorsObserver = this._register(this.instantiationService.createInstance(editorsObserver_1.EditorsObserver, this.editorGroupsContainer));
            this.onConfigurationUpdated();
            this.registerListeners();
        }
        createScoped(editorGroupsContainer, disposables) {
            return disposables.add(new EditorService_1(editorGroupsContainer === 'main' ? this.editorGroupService.mainPart : editorGroupsContainer, this.editorGroupService, this.instantiationService, this.fileService, this.configurationService, this.contextService, this.uriIdentityService, this.editorResolverService, this.workspaceTrustRequestService, this.hostService, this.textEditorService));
        }
        registerListeners() {
            // Editor & group changes
            if (this.editorGroupsContainer === this.editorGroupService.mainPart || this.editorGroupsContainer === this.editorGroupService) {
                this.editorGroupService.whenReady.then(() => this.onEditorGroupsReady());
            }
            else {
                this.onEditorGroupsReady();
            }
            this._register(this.editorGroupsContainer.onDidChangeActiveGroup(group => this.handleActiveEditorChange(group)));
            this._register(this.editorGroupsContainer.onDidAddGroup(group => this.registerGroupListeners(group)));
            this._register(this.editorsObserver.onDidMostRecentlyActiveEditorsChange(() => this._onDidMostRecentlyActiveEditorsChange.fire()));
            // Out of workspace file watchers
            this._register(this.onDidVisibleEditorsChange(() => this.handleVisibleEditorsChange()));
            // File changes & operations
            // Note: there is some duplication with the two file event handlers- Since we cannot always rely on the disk events
            // carrying all necessary data in all environments, we also use the file operation events to make sure operations are handled.
            // In any case there is no guarantee if the local event is fired first or the disk one. Thus, code must handle the case
            // that the event ordering is random as well as might not carry all information needed.
            this._register(this.fileService.onDidRunOperation(e => this.onDidRunFileOperation(e)));
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // Configuration
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
        }
        onEditorGroupsReady() {
            // Register listeners to each opened group
            for (const group of this.editorGroupsContainer.groups) {
                this.registerGroupListeners(group);
            }
            // Fire initial set of editor events if there is an active editor
            if (this.activeEditor) {
                this.doHandleActiveEditorChangeEvent();
                this._onDidVisibleEditorsChange.fire();
            }
        }
        handleActiveEditorChange(group) {
            if (group !== this.editorGroupsContainer.activeGroup) {
                return; // ignore if not the active group
            }
            if (!this.lastActiveEditor && !group.activeEditor) {
                return; // ignore if we still have no active editor
            }
            this.doHandleActiveEditorChangeEvent();
        }
        doHandleActiveEditorChangeEvent() {
            // Remember as last active
            const activeGroup = this.editorGroupsContainer.activeGroup;
            this.lastActiveEditor = activeGroup.activeEditor ?? undefined;
            // Fire event to outside parties
            this._onDidActiveEditorChange.fire();
        }
        registerGroupListeners(group) {
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(group.onDidModelChange(e => {
                this._onDidEditorsChange.fire({ groupId: group.id, event: e });
            }));
            groupDisposables.add(group.onDidActiveEditorChange(() => {
                this.handleActiveEditorChange(group);
                this._onDidVisibleEditorsChange.fire();
            }));
            groupDisposables.add(group.onWillOpenEditor(e => {
                this._onWillOpenEditor.fire(e);
            }));
            groupDisposables.add(group.onDidCloseEditor(e => {
                this._onDidCloseEditor.fire(e);
            }));
            groupDisposables.add(group.onDidOpenEditorFail(editor => {
                this._onDidOpenEditorFail.fire({ editor, groupId: group.id });
            }));
            event_1.Event.once(group.onWillDispose)(() => {
                (0, lifecycle_1.dispose)(groupDisposables);
            });
        }
        handleVisibleEditorsChange() {
            const visibleOutOfWorkspaceResources = new map_1.ResourceSet();
            for (const editor of this.visibleEditors) {
                const resources = (0, arrays_1.distinct)((0, arrays_1.coalesce)([
                    editor_1.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }),
                    editor_1.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY })
                ]), resource => resource.toString());
                for (const resource of resources) {
                    if (this.fileService.hasProvider(resource) && !this.contextService.isInsideWorkspace(resource)) {
                        visibleOutOfWorkspaceResources.add(resource);
                    }
                }
            }
            // Handle no longer visible out of workspace resources
            for (const resource of this.activeOutOfWorkspaceWatchers.keys()) {
                if (!visibleOutOfWorkspaceResources.has(resource)) {
                    (0, lifecycle_1.dispose)(this.activeOutOfWorkspaceWatchers.get(resource));
                    this.activeOutOfWorkspaceWatchers.delete(resource);
                }
            }
            // Handle newly visible out of workspace resources
            for (const resource of visibleOutOfWorkspaceResources.keys()) {
                if (!this.activeOutOfWorkspaceWatchers.get(resource)) {
                    const disposable = this.fileService.watch(resource);
                    this.activeOutOfWorkspaceWatchers.set(resource, disposable);
                }
            }
        }
        //#endregion
        //#region File Changes: Move & Deletes to move or close opend editors
        async onDidRunFileOperation(e) {
            // Handle moves specially when file is opened
            if (e.isOperation(2 /* FileOperation.MOVE */)) {
                this.handleMovedFile(e.resource, e.target.resource);
            }
            // Handle deletes
            if (e.isOperation(1 /* FileOperation.DELETE */) || e.isOperation(2 /* FileOperation.MOVE */)) {
                this.handleDeletedFile(e.resource, false, e.target ? e.target.resource : undefined);
            }
        }
        onDidFilesChange(e) {
            if (e.gotDeleted()) {
                this.handleDeletedFile(e, true);
            }
        }
        async handleMovedFile(source, target) {
            for (const group of this.editorGroupsContainer.groups) {
                const replacements = [];
                for (const editor of group.editors) {
                    const resource = editor.resource;
                    if (!resource || !this.uriIdentityService.extUri.isEqualOrParent(resource, source)) {
                        continue; // not matching our resource
                    }
                    // Determine new resulting target resource
                    let targetResource;
                    if (this.uriIdentityService.extUri.isEqual(source, resource)) {
                        targetResource = target; // file got moved
                    }
                    else {
                        const index = (0, extpath_1.indexOfPath)(resource.path, source.path, this.uriIdentityService.extUri.ignorePathCasing(resource));
                        targetResource = (0, resources_1.joinPath)(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                    }
                    // Delegate rename() to editor instance
                    const moveResult = await editor.rename(group.id, targetResource);
                    if (!moveResult) {
                        return; // not target - ignore
                    }
                    const optionOverrides = {
                        preserveFocus: true,
                        pinned: group.isPinned(editor),
                        sticky: group.isSticky(editor),
                        index: group.getIndexOfEditor(editor),
                        inactive: !group.isActive(editor)
                    };
                    // Construct a replacement with our extra options mixed in
                    if ((0, editor_1.isEditorInput)(moveResult.editor)) {
                        replacements.push({
                            editor,
                            replacement: moveResult.editor,
                            options: {
                                ...moveResult.options,
                                ...optionOverrides
                            }
                        });
                    }
                    else {
                        replacements.push({
                            editor,
                            replacement: {
                                ...moveResult.editor,
                                options: {
                                    ...moveResult.editor.options,
                                    ...optionOverrides
                                }
                            }
                        });
                    }
                }
                // Apply replacements
                if (replacements.length) {
                    this.replaceEditors(replacements, group);
                }
            }
        }
        onConfigurationUpdated(e) {
            if (e && !e.affectsConfiguration('workbench.editor.closeOnFileDelete')) {
                return;
            }
            const configuration = this.configurationService.getValue();
            if (typeof configuration.workbench?.editor?.closeOnFileDelete === 'boolean') {
                this.closeOnFileDelete = configuration.workbench.editor.closeOnFileDelete;
            }
            else {
                this.closeOnFileDelete = false; // default
            }
        }
        handleDeletedFile(arg1, isExternal, movedTo) {
            for (const editor of this.getAllNonDirtyEditors({ includeUntitled: false, supportSideBySide: true })) {
                (async () => {
                    const resource = editor.resource;
                    if (!resource) {
                        return;
                    }
                    // Handle deletes in opened editors depending on:
                    // - we close any editor when `closeOnFileDelete: true`
                    // - we close any editor when the delete occurred from within VSCode
                    if (this.closeOnFileDelete || !isExternal) {
                        // Do NOT close any opened editor that matches the resource path (either equal or being parent) of the
                        // resource we move to (movedTo). Otherwise we would close a resource that has been renamed to the same
                        // path but different casing.
                        if (movedTo && this.uriIdentityService.extUri.isEqualOrParent(resource, movedTo)) {
                            return;
                        }
                        let matches = false;
                        if (arg1 instanceof files_1.FileChangesEvent) {
                            matches = arg1.contains(resource, 2 /* FileChangeType.DELETED */);
                        }
                        else {
                            matches = this.uriIdentityService.extUri.isEqualOrParent(resource, arg1);
                        }
                        if (!matches) {
                            return;
                        }
                        // We have received reports of users seeing delete events even though the file still
                        // exists (network shares issue: https://github.com/microsoft/vscode/issues/13665).
                        // Since we do not want to close an editor without reason, we have to check if the
                        // file is really gone and not just a faulty file event.
                        // This only applies to external file events, so we need to check for the isExternal
                        // flag.
                        let exists = false;
                        if (isExternal && this.fileService.hasProvider(resource)) {
                            await (0, async_1.timeout)(100);
                            exists = await this.fileService.exists(resource);
                        }
                        if (!exists && !editor.isDisposed()) {
                            editor.dispose();
                        }
                    }
                })();
            }
        }
        getAllNonDirtyEditors(options) {
            const editors = [];
            function conditionallyAddEditor(editor) {
                if (editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) && !options.includeUntitled) {
                    return;
                }
                if (editor.isDirty()) {
                    return;
                }
                editors.push(editor);
            }
            for (const editor of this.editors) {
                if (options.supportSideBySide && editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                    conditionallyAddEditor(editor.primary);
                    conditionallyAddEditor(editor.secondary);
                }
                else {
                    conditionallyAddEditor(editor);
                }
            }
            return editors;
        }
        get activeEditorPane() {
            return this.editorGroupsContainer.activeGroup?.activeEditorPane;
        }
        get activeTextEditorControl() {
            const activeEditorPane = this.activeEditorPane;
            if (activeEditorPane) {
                const activeControl = activeEditorPane.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(activeControl) || (0, editorBrowser_1.isDiffEditor)(activeControl)) {
                    return activeControl;
                }
                if ((0, editorBrowser_1.isCompositeEditor)(activeControl) && (0, editorBrowser_1.isCodeEditor)(activeControl.activeCodeEditor)) {
                    return activeControl.activeCodeEditor;
                }
            }
            return undefined;
        }
        get activeTextEditorLanguageId() {
            let activeCodeEditor = undefined;
            const activeTextEditorControl = this.activeTextEditorControl;
            if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                activeCodeEditor = activeTextEditorControl.getModifiedEditor();
            }
            else {
                activeCodeEditor = activeTextEditorControl;
            }
            return activeCodeEditor?.getModel()?.getLanguageId();
        }
        get count() {
            return this.editorsObserver.count;
        }
        get editors() {
            return this.getEditors(1 /* EditorsOrder.SEQUENTIAL */).map(({ editor }) => editor);
        }
        getEditors(order, options) {
            switch (order) {
                // MRU
                case 0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */:
                    if (options?.excludeSticky) {
                        return this.editorsObserver.editors.filter(({ groupId, editor }) => !this.editorGroupsContainer.getGroup(groupId)?.isSticky(editor));
                    }
                    return this.editorsObserver.editors;
                // Sequential
                case 1 /* EditorsOrder.SEQUENTIAL */: {
                    const editors = [];
                    for (const group of this.editorGroupsContainer.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)) {
                        editors.push(...group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, options).map(editor => ({ editor, groupId: group.id })));
                    }
                    return editors;
                }
            }
        }
        get activeEditor() {
            const activeGroup = this.editorGroupsContainer.activeGroup;
            return activeGroup ? activeGroup.activeEditor ?? undefined : undefined;
        }
        get visibleEditorPanes() {
            return (0, arrays_1.coalesce)(this.editorGroupsContainer.groups.map(group => group.activeEditorPane));
        }
        get visibleTextEditorControls() {
            const visibleTextEditorControls = [];
            for (const visibleEditorPane of this.visibleEditorPanes) {
                const control = visibleEditorPane.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(control) || (0, editorBrowser_1.isDiffEditor)(control)) {
                    visibleTextEditorControls.push(control);
                }
            }
            return visibleTextEditorControls;
        }
        get visibleEditors() {
            return (0, arrays_1.coalesce)(this.editorGroupsContainer.groups.map(group => group.activeEditor));
        }
        async openEditor(editor, optionsOrPreferredGroup, preferredGroup) {
            let typedEditor = undefined;
            let options = (0, editor_1.isEditorInput)(editor) ? optionsOrPreferredGroup : editor.options;
            let group = undefined;
            if ((0, editorService_1.isPreferredGroup)(optionsOrPreferredGroup)) {
                preferredGroup = optionsOrPreferredGroup;
            }
            // Resolve override unless disabled
            if (!(0, editor_1.isEditorInput)(editor)) {
                const resolvedEditor = await this.editorResolverService.resolveEditor(editor, preferredGroup);
                if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                    return; // skip editor if override is aborted
                }
                // We resolved an editor to use
                if ((0, editor_1.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                    typedEditor = resolvedEditor.editor;
                    options = resolvedEditor.options;
                    group = resolvedEditor.group;
                }
            }
            // Override is disabled or did not apply: fallback to default
            if (!typedEditor) {
                typedEditor = (0, editor_1.isEditorInput)(editor) ? editor : await this.textEditorService.resolveTextEditor(editor);
            }
            // If group still isn't defined because of a disabled override we resolve it
            if (!group) {
                let activation = undefined;
                const findGroupResult = this.instantiationService.invokeFunction(editorGroupFinder_1.findGroup, { editor: typedEditor, options }, preferredGroup);
                if (findGroupResult instanceof Promise) {
                    ([group, activation] = await findGroupResult);
                }
                else {
                    ([group, activation] = findGroupResult);
                }
                // Mixin editor group activation if returned
                if (activation) {
                    options = { ...options, activation };
                }
            }
            return group.openEditor(typedEditor, options);
        }
        async openEditors(editors, preferredGroup, options) {
            // Pass all editors to trust service to determine if
            // we should proceed with opening the editors if we
            // are asked to validate trust.
            if (options?.validateTrust) {
                const editorsTrusted = await this.handleWorkspaceTrust(editors);
                if (!editorsTrusted) {
                    return [];
                }
            }
            // Find target groups for editors to open
            const mapGroupToTypedEditors = new Map();
            for (const editor of editors) {
                let typedEditor = undefined;
                let group = undefined;
                // Resolve override unless disabled
                if (!(0, editor_1.isEditorInputWithOptions)(editor)) {
                    const resolvedEditor = await this.editorResolverService.resolveEditor(editor, preferredGroup);
                    if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                        continue; // skip editor if override is aborted
                    }
                    // We resolved an editor to use
                    if ((0, editor_1.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                        typedEditor = resolvedEditor;
                        group = resolvedEditor.group;
                    }
                }
                // Override is disabled or did not apply: fallback to default
                if (!typedEditor) {
                    typedEditor = (0, editor_1.isEditorInputWithOptions)(editor) ? editor : { editor: await this.textEditorService.resolveTextEditor(editor), options: editor.options };
                }
                // If group still isn't defined because of a disabled override we resolve it
                if (!group) {
                    const findGroupResult = this.instantiationService.invokeFunction(editorGroupFinder_1.findGroup, typedEditor, preferredGroup);
                    if (findGroupResult instanceof Promise) {
                        ([group] = await findGroupResult);
                    }
                    else {
                        ([group] = findGroupResult);
                    }
                }
                // Update map of groups to editors
                let targetGroupEditors = mapGroupToTypedEditors.get(group);
                if (!targetGroupEditors) {
                    targetGroupEditors = [];
                    mapGroupToTypedEditors.set(group, targetGroupEditors);
                }
                targetGroupEditors.push(typedEditor);
            }
            // Open in target groups
            const result = [];
            for (const [group, editors] of mapGroupToTypedEditors) {
                result.push(group.openEditors(editors));
            }
            return (0, arrays_1.coalesce)(await async_1.Promises.settled(result));
        }
        async handleWorkspaceTrust(editors) {
            const { resources, diffMode, mergeMode } = this.extractEditorResources(editors);
            const trustResult = await this.workspaceTrustRequestService.requestOpenFilesTrust(resources);
            switch (trustResult) {
                case 1 /* WorkspaceTrustUriResponse.Open */:
                    return true;
                case 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */:
                    await this.hostService.openWindow(resources.map(resource => ({ fileUri: resource })), { forceNewWindow: true, diffMode, mergeMode });
                    return false;
                case 3 /* WorkspaceTrustUriResponse.Cancel */:
                    return false;
            }
        }
        extractEditorResources(editors) {
            const resources = new map_1.ResourceSet();
            let diffMode = false;
            let mergeMode = false;
            for (const editor of editors) {
                // Typed Editor
                if ((0, editor_1.isEditorInputWithOptions)(editor)) {
                    const resource = editor_1.EditorResourceAccessor.getOriginalUri(editor.editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH });
                    if (uri_1.URI.isUri(resource)) {
                        resources.add(resource);
                    }
                    else if (resource) {
                        if (resource.primary) {
                            resources.add(resource.primary);
                        }
                        if (resource.secondary) {
                            resources.add(resource.secondary);
                        }
                        diffMode = editor.editor instanceof diffEditorInput_1.DiffEditorInput;
                    }
                }
                // Untyped editor
                else {
                    if ((0, editor_1.isResourceMergeEditorInput)(editor)) {
                        if (uri_1.URI.isUri(editor.input1)) {
                            resources.add(editor.input1.resource);
                        }
                        if (uri_1.URI.isUri(editor.input2)) {
                            resources.add(editor.input2.resource);
                        }
                        if (uri_1.URI.isUri(editor.base)) {
                            resources.add(editor.base.resource);
                        }
                        if (uri_1.URI.isUri(editor.result)) {
                            resources.add(editor.result.resource);
                        }
                        mergeMode = true;
                    }
                    if ((0, editor_1.isResourceDiffEditorInput)(editor)) {
                        if (uri_1.URI.isUri(editor.original.resource)) {
                            resources.add(editor.original.resource);
                        }
                        if (uri_1.URI.isUri(editor.modified.resource)) {
                            resources.add(editor.modified.resource);
                        }
                        diffMode = true;
                    }
                    else if ((0, editor_1.isResourceEditorInput)(editor)) {
                        resources.add(editor.resource);
                    }
                }
            }
            return {
                resources: Array.from(resources.keys()),
                diffMode,
                mergeMode
            };
        }
        //#endregion
        //#region isOpened() / isVisible()
        isOpened(editor) {
            return this.editorsObserver.hasEditor({
                resource: this.uriIdentityService.asCanonicalUri(editor.resource),
                typeId: editor.typeId,
                editorId: editor.editorId
            });
        }
        isVisible(editor) {
            for (const group of this.editorGroupsContainer.groups) {
                if (group.activeEditor?.matches(editor)) {
                    return true;
                }
            }
            return false;
        }
        //#endregion
        //#region closeEditor()
        async closeEditor({ editor, groupId }, options) {
            const group = this.editorGroupsContainer.getGroup(groupId);
            await group?.closeEditor(editor, options);
        }
        //#endregion
        //#region closeEditors()
        async closeEditors(editors, options) {
            const mapGroupToEditors = new Map();
            for (const { editor, groupId } of editors) {
                const group = this.editorGroupsContainer.getGroup(groupId);
                if (!group) {
                    continue;
                }
                let editors = mapGroupToEditors.get(group);
                if (!editors) {
                    editors = [];
                    mapGroupToEditors.set(group, editors);
                }
                editors.push(editor);
            }
            for (const [group, editors] of mapGroupToEditors) {
                await group.closeEditors(editors, options);
            }
        }
        findEditors(arg1, options, arg2) {
            const resource = uri_1.URI.isUri(arg1) ? arg1 : arg1.resource;
            const typeId = uri_1.URI.isUri(arg1) ? undefined : arg1.typeId;
            // Do a quick check for the resource via the editor observer
            // which is a very efficient way to find an editor by resource.
            // However, we can only do that unless we are asked to find an
            // editor on the secondary side of a side by side editor, because
            // the editor observer provides fast lookups only for primary
            // editors.
            if (options?.supportSideBySide !== editor_1.SideBySideEditor.ANY && options?.supportSideBySide !== editor_1.SideBySideEditor.SECONDARY) {
                if (!this.editorsObserver.hasEditors(resource)) {
                    if (uri_1.URI.isUri(arg1) || (0, types_1.isUndefined)(arg2)) {
                        return [];
                    }
                    return undefined;
                }
            }
            // Search only in specific group
            if (!(0, types_1.isUndefined)(arg2)) {
                const targetGroup = typeof arg2 === 'number' ? this.editorGroupsContainer.getGroup(arg2) : arg2;
                // Resource provided: result is an array
                if (uri_1.URI.isUri(arg1)) {
                    if (!targetGroup) {
                        return [];
                    }
                    return targetGroup.findEditors(resource, options);
                }
                // Editor identifier provided, result is single
                else {
                    if (!targetGroup) {
                        return undefined;
                    }
                    const editors = targetGroup.findEditors(resource, options);
                    for (const editor of editors) {
                        if (editor.typeId === typeId) {
                            return editor;
                        }
                    }
                    return undefined;
                }
            }
            // Search across all groups in MRU order
            else {
                const result = [];
                for (const group of this.editorGroupsContainer.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                    const editors = [];
                    // Resource provided: result is an array
                    if (uri_1.URI.isUri(arg1)) {
                        editors.push(...this.findEditors(arg1, options, group));
                    }
                    // Editor identifier provided, result is single
                    else {
                        const editor = this.findEditors(arg1, options, group);
                        if (editor) {
                            editors.push(editor);
                        }
                    }
                    result.push(...editors.map(editor => ({ editor, groupId: group.id })));
                }
                return result;
            }
        }
        async replaceEditors(replacements, group) {
            const targetGroup = typeof group === 'number' ? this.editorGroupsContainer.getGroup(group) : group;
            // Convert all replacements to typed editors unless already
            // typed and handle overrides properly.
            const typedReplacements = [];
            for (const replacement of replacements) {
                let typedReplacement = undefined;
                // Resolve override unless disabled
                if (!(0, editor_1.isEditorInput)(replacement.replacement)) {
                    const resolvedEditor = await this.editorResolverService.resolveEditor(replacement.replacement, targetGroup);
                    if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                        continue; // skip editor if override is aborted
                    }
                    // We resolved an editor to use
                    if ((0, editor_1.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                        typedReplacement = {
                            editor: replacement.editor,
                            replacement: resolvedEditor.editor,
                            options: resolvedEditor.options,
                            forceReplaceDirty: replacement.forceReplaceDirty
                        };
                    }
                }
                // Override is disabled or did not apply: fallback to default
                if (!typedReplacement) {
                    typedReplacement = {
                        editor: replacement.editor,
                        replacement: (0, editorGroupsService_1.isEditorReplacement)(replacement) ? replacement.replacement : await this.textEditorService.resolveTextEditor(replacement.replacement),
                        options: (0, editorGroupsService_1.isEditorReplacement)(replacement) ? replacement.options : replacement.replacement.options,
                        forceReplaceDirty: replacement.forceReplaceDirty
                    };
                }
                typedReplacements.push(typedReplacement);
            }
            return targetGroup?.replaceEditors(typedReplacements);
        }
        //#endregion
        //#region save/revert
        async save(editors, options) {
            // Convert to array
            if (!Array.isArray(editors)) {
                editors = [editors];
            }
            // Make sure to not save the same editor multiple times
            // by using the `matches()` method to find duplicates
            const uniqueEditors = this.getUniqueEditors(editors);
            // Split editors up into a bucket that is saved in parallel
            // and sequentially. Unless "Save As", all non-untitled editors
            // can be saved in parallel to speed up the operation. Remaining
            // editors are potentially bringing up some UI and thus run
            // sequentially.
            const editorsToSaveParallel = [];
            const editorsToSaveSequentially = [];
            if (options?.saveAs) {
                editorsToSaveSequentially.push(...uniqueEditors);
            }
            else {
                for (const { groupId, editor } of uniqueEditors) {
                    if (editor.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                        editorsToSaveSequentially.push({ groupId, editor });
                    }
                    else {
                        editorsToSaveParallel.push({ groupId, editor });
                    }
                }
            }
            // Editors to save in parallel
            const saveResults = await async_1.Promises.settled(editorsToSaveParallel.map(({ groupId, editor }) => {
                // Use save as a hint to pin the editor if used explicitly
                if (options?.reason === 1 /* SaveReason.EXPLICIT */) {
                    this.editorGroupsContainer.getGroup(groupId)?.pinEditor(editor);
                }
                // Save
                return editor.save(groupId, options);
            }));
            // Editors to save sequentially
            for (const { groupId, editor } of editorsToSaveSequentially) {
                if (editor.isDisposed()) {
                    continue; // might have been disposed from the save already
                }
                // Preserve view state by opening the editor first if the editor
                // is untitled or we "Save As". This also allows the user to review
                // the contents of the editor before making a decision.
                const editorPane = await this.openEditor(editor, groupId);
                const editorOptions = {
                    pinned: true,
                    viewState: editorPane?.getViewState()
                };
                const result = options?.saveAs ? await editor.saveAs(groupId, options) : await editor.save(groupId, options);
                saveResults.push(result);
                if (!result) {
                    break; // failed or cancelled, abort
                }
                // Replace editor preserving viewstate (either across all groups or
                // only selected group) if the resulting editor is different from the
                // current one.
                if (!editor.matches(result)) {
                    const targetGroups = editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) ? this.editorGroupsContainer.groups.map(group => group.id) /* untitled replaces across all groups */ : [groupId];
                    for (const targetGroup of targetGroups) {
                        if (result instanceof editorInput_1.EditorInput) {
                            await this.replaceEditors([{ editor, replacement: result, options: editorOptions }], targetGroup);
                        }
                        else {
                            await this.replaceEditors([{ editor, replacement: { ...result, options: editorOptions } }], targetGroup);
                        }
                    }
                }
            }
            return {
                success: saveResults.every(result => !!result),
                editors: (0, arrays_1.coalesce)(saveResults)
            };
        }
        saveAll(options) {
            return this.save(this.getAllModifiedEditors(options), options);
        }
        async revert(editors, options) {
            // Convert to array
            if (!Array.isArray(editors)) {
                editors = [editors];
            }
            // Make sure to not revert the same editor multiple times
            // by using the `matches()` method to find duplicates
            const uniqueEditors = this.getUniqueEditors(editors);
            await async_1.Promises.settled(uniqueEditors.map(async ({ groupId, editor }) => {
                // Use revert as a hint to pin the editor
                this.editorGroupsContainer.getGroup(groupId)?.pinEditor(editor);
                return editor.revert(groupId, options);
            }));
            return !uniqueEditors.some(({ editor }) => editor.isDirty());
        }
        async revertAll(options) {
            return this.revert(this.getAllModifiedEditors(options), options);
        }
        getAllModifiedEditors(options) {
            const editors = [];
            for (const group of this.editorGroupsContainer.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                for (const editor of group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                    if (!editor.isModified()) {
                        continue;
                    }
                    if ((typeof options?.includeUntitled === 'boolean' || !options?.includeUntitled?.includeScratchpad)
                        && editor.hasCapability(512 /* EditorInputCapabilities.Scratchpad */)) {
                        continue;
                    }
                    if (!options?.includeUntitled && editor.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                        continue;
                    }
                    if (options?.excludeSticky && group.isSticky(editor)) {
                        continue;
                    }
                    editors.push({ groupId: group.id, editor });
                }
            }
            return editors;
        }
        getUniqueEditors(editors) {
            const uniqueEditors = [];
            for (const { editor, groupId } of editors) {
                if (uniqueEditors.some(uniqueEditor => uniqueEditor.editor.matches(editor))) {
                    continue;
                }
                uniqueEditors.push({ editor, groupId });
            }
            return uniqueEditors;
        }
        //#endregion
        dispose() {
            super.dispose();
            // Dispose remaining watchers if any
            this.activeOutOfWorkspaceWatchers.forEach(disposable => (0, lifecycle_1.dispose)(disposable));
            this.activeOutOfWorkspaceWatchers.clear();
        }
    };
    exports.EditorService = EditorService;
    exports.EditorService = EditorService = EditorService_1 = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, files_1.IFileService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, editorResolverService_1.IEditorResolverService),
        __param(8, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(9, host_1.IHostService),
        __param(10, textEditorService_1.ITextEditorService)
    ], EditorService);
    (0, extensions_1.registerSingleton)(editorService_1.IEditorService, new descriptors_1.SyncDescriptor(EditorService, [undefined], false));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lZGl0b3IvYnJvd3Nlci9lZGl0b3JTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFrQ3pGLElBQU0sYUFBYSxxQkFBbkIsTUFBTSxhQUFjLFNBQVEsc0JBQVU7UUErQjVDLFlBQ0MscUJBQXlELEVBQ25DLGtCQUF5RCxFQUN4RCxvQkFBNEQsRUFDckUsV0FBMEMsRUFDakMsb0JBQTRELEVBQ3pELGNBQXlELEVBQzlELGtCQUF3RCxFQUNyRCxxQkFBOEQsRUFDdkQsNEJBQTRFLEVBQzdGLFdBQTBDLEVBQ3BDLGlCQUFzRDtZQUUxRSxLQUFLLEVBQUUsQ0FBQztZQVgrQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXNCO1lBQ3ZDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDaEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUN4QyxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDN0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNwQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3RDLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUFDNUUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQXRDM0UsZ0JBQWdCO1lBRUMsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDdkUsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztZQUV0RCwrQkFBMEIsR0FBRyxJQUFJ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