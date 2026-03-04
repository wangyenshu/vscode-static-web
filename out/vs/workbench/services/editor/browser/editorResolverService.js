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
define(["require", "exports", "vs/base/common/glob", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/editor/common/editor", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/network", "vs/workbench/services/editor/common/editorResolverService", "vs/platform/quickinput/common/quickInput", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/services/editor/common/editorGroupFinder", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/event"], function (require, exports, glob, arrays_1, lifecycle_1, resources_1, uri_1, configuration_1, editor_1, editor_2, editorGroupsService_1, network_1, editorResolverService_1, quickInput_1, nls_1, notification_1, telemetry_1, extensions_1, storage_1, extensions_2, log_1, editorGroupFinder_1, instantiation_1, sideBySideEditorInput_1, event_1) {
    "use strict";
    var EditorResolverService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorResolverService = void 0;
    let EditorResolverService = class EditorResolverService extends lifecycle_1.Disposable {
        static { EditorResolverService_1 = this; }
        // Constants
        static { this.configureDefaultID = 'promptOpenWith.configureDefault'; }
        static { this.cacheStorageID = 'editorOverrideService.cache'; }
        static { this.conflictingDefaultsStorageID = 'editorOverrideService.conflictingDefaults'; }
        constructor(editorGroupService, instantiationService, configurationService, quickInputService, notificationService, telemetryService, storageService, extensionService, logService) {
            super();
            this.editorGroupService = editorGroupService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.logService = logService;
            // Events
            this._onDidChangeEditorRegistrations = this._register(new event_1.PauseableEmitter());
            this.onDidChangeEditorRegistrations = this._onDidChangeEditorRegistrations.event;
            // Data Stores
            this._editors = new Map();
            this._flattenedEditors = new Map();
            this._shouldReFlattenEditors = true;
            // Read in the cache on statup
            this.cache = new Set(JSON.parse(this.storageService.get(EditorResolverService_1.cacheStorageID, 0 /* StorageScope.PROFILE */, JSON.stringify([]))));
            this.storageService.remove(EditorResolverService_1.cacheStorageID, 0 /* StorageScope.PROFILE */);
            this._register(this.storageService.onWillSaveState(() => {
                // We want to store the glob patterns we would activate on, this allows us to know if we need to await the ext host on startup for opening a resource
                this.cacheEditors();
            }));
            // When extensions have registered we no longer need the cache
            this._register(this.extensionService.onDidRegisterExtensions(() => {
                this.cache = undefined;
            }));
        }
        resolveUntypedInputAndGroup(editor, preferredGroup) {
            const untypedEditor = editor;
            // Use the untyped editor to find a group
            const findGroupResult = this.instantiationService.invokeFunction(editorGroupFinder_1.findGroup, untypedEditor, preferredGroup);
            if (findGroupResult instanceof Promise) {
                return findGroupResult.then(([group, activation]) => [untypedEditor, group, activation]);
            }
            else {
                const [group, activation] = findGroupResult;
                return [untypedEditor, group, activation];
            }
        }
        async resolveEditor(editor, preferredGroup) {
            // Update the flattened editors
            this._flattenedEditors = this._flattenEditorsMap();
            // Special case: side by side editors requires us to
            // independently resolve both sides and then build
            // a side by side editor with the result
            if ((0, editor_2.isResourceSideBySideEditorInput)(editor)) {
                return this.doResolveSideBySideEditor(editor, preferredGroup);
            }
            let resolvedUntypedAndGroup;
            const resolvedUntypedAndGroupResult = this.resolveUntypedInputAndGroup(editor, preferredGroup);
            if (resolvedUntypedAndGroupResult instanceof Promise) {
                resolvedUntypedAndGroup = await resolvedUntypedAndGroupResult;
            }
            else {
                resolvedUntypedAndGroup = resolvedUntypedAndGroupResult;
            }
            if (!resolvedUntypedAndGroup) {
                return 2 /* ResolvedStatus.NONE */;
            }
            // Get the resolved untyped editor, group, and activation
            const [untypedEditor, group, activation] = resolvedUntypedAndGroup;
            if (activation) {
                untypedEditor.options = { ...untypedEditor.options, activation };
            }
            let resource = editor_2.EditorResourceAccessor.getCanonicalUri(untypedEditor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            // If it was resolved before we await for the extensions to activate and then proceed with resolution or else the backing extensions won't be registered
            if (this.cache && resource && this.resourceMatchesCache(resource)) {
                await this.extensionService.whenInstalledExtensionsRegistered();
            }
            // Undefined resource -> untilted. Other malformed URI's are unresolvable
            if (resource === undefined) {
                resource = uri_1.URI.from({ scheme: network_1.Schemas.untitled });
            }
            else if (resource.scheme === undefined || resource === null) {
                return 2 /* ResolvedStatus.NONE */;
            }
            if (untypedEditor.options?.override === editor_1.EditorResolution.PICK) {
                const picked = await this.doPickEditor(untypedEditor);
                // If the picker was cancelled we will stop resolving the editor
                if (!picked) {
                    return 1 /* ResolvedStatus.ABORT */;
                }
                // Populate the options with the new ones
                untypedEditor.options = picked;
            }
            // Resolved the editor ID as much as possible, now find a given editor (cast here is ok because we resolve down to a string above)
            let { editor: selectedEditor, conflictingDefault } = this.getEditor(resource, untypedEditor.options?.override);
            // If no editor was found and this was a typed editor or an editor with an explicit override we could not resolve it
            if (!selectedEditor && (untypedEditor.options?.override || (0, editor_2.isEditorInputWithOptions)(editor))) {
                return 2 /* ResolvedStatus.NONE */;
            }
            else if (!selectedEditor) {
                // Simple untyped editors that we could not resolve will be resolved to the default editor
                const resolvedEditor = this.getEditor(resource, editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
                selectedEditor = resolvedEditor?.editor;
                conflictingDefault = resolvedEditor?.conflictingDefault;
                if (!selectedEditor) {
                    return 2 /* ResolvedStatus.NONE */;
                }
            }
            // In the special case of diff editors we do some more work to determine the correct editor for both sides
            if ((0, editor_2.isResourceDiffEditorInput)(untypedEditor) && untypedEditor.options?.override === undefined) {
                let resource2 = editor_2.EditorResourceAccessor.getCanonicalUri(untypedEditor, { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
                if (!resource2) {
                    resource2 = uri_1.URI.from({ scheme: network_1.Schemas.untitled });
                }
                const { editor: selectedEditor2 } = this.getEditor(resource2, undefined);
                if (!selectedEditor2 || selectedEditor.editorInfo.id !== selectedEditor2.editorInfo.id) {
                    const { editor: selectedDiff, conflictingDefault: conflictingDefaultDiff } = this.getEditor(resource, editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
                    selectedEditor = selectedDiff;
                    conflictingDefault = conflictingDefaultDiff;
                }
                if (!selectedEditor) {
                    return 2 /* ResolvedStatus.NONE */;
                }
            }
            // If no override we take the selected editor id so that matches works with the isActive check
            untypedEditor.options = { override: selectedEditor.editorInfo.id, ...untypedEditor.options };
            // Check if diff can be created based on prescene of factory function
            if (selectedEditor.editorFactoryObject.createDiffEditorInput === undefined && (0, editor_2.isResourceDiffEditorInput)(untypedEditor)) {
                return 2 /* ResolvedStatus.NONE */;
            }
            const input = await this.doResolveEditor(untypedEditor, group, selectedEditor);
            if (conflictingDefault && input) {
                // Show the conflicting default dialog
                await this.doHandleConflictingDefaults(resource, selectedEditor.editorInfo.label, untypedEditor, input.editor, group);
            }
            if (input) {
                this.sendEditorResolutionTelemetry(input.editor);
                if (input.editor.editorId !== selectedEditor.editorInfo.id) {
                    this.logService.warn(`Editor ID Mismatch: ${input.editor.editorId} !== ${selectedEditor.editorInfo.id}. This will cause bugs. Please ensure editorInput.editorId matches the registered id`);
                }
                return { ...input, group };
            }
            return 1 /* ResolvedStatus.ABORT */;
        }
        async doResolveSideBySideEditor(editor, preferredGroup) {
            const primaryResolvedEditor = await this.resolveEditor(editor.primary, preferredGroup);
            if (!(0, editor_2.isEditorInputWithOptionsAndGroup)(primaryResolvedEditor)) {
                return 2 /* ResolvedStatus.NONE */;
            }
            const secondaryResolvedEditor = await this.resolveEditor(editor.secondary, primaryResolvedEditor.group ?? preferredGroup);
            if (!(0, editor_2.isEditorInputWithOptionsAndGroup)(secondaryResolvedEditor)) {
                return 2 /* ResolvedStatus.NONE */;
            }
            return {
                group: primaryResolvedEditor.group ?? secondaryResolvedEditor.group,
                editor: this.instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, editor.label, editor.description, secondaryResolvedEditor.editor, primaryResolvedEditor.editor),
                options: editor.options
            };
        }
        bufferChangeEvents(callback) {
            this._onDidChangeEditorRegistrations.pause();
            try {
                callback();
            }
            finally {
                this._onDidChangeEditorRegistrations.resume();
            }
        }
        registerEditor(globPattern, editorInfo, options, editorFactoryObject) {
            let registeredEditor = this._editors.get(globPattern);
            if (registeredEditor === undefined) {
                registeredEditor = new Map();
                this._editors.set(globPattern, registeredEditor);
            }
            let editorsWithId = registeredEditor.get(editorInfo.id);
            if (editorsWithId === undefined) {
                editorsWithId = [];
            }
            const remove = (0, arrays_1.insert)(editorsWithId, {
                globPattern,
                editorInfo,
                options,
                editorFactoryObject
            });
            registeredEditor.set(editorInfo.id, editorsWithId);
            this._shouldReFlattenEditors = true;
            this._onDidChangeEditorRegistrations.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                remove();
                if (editorsWithId && editorsWithId.length === 0) {
                    registeredEditor?.delete(editorInfo.id);
                }
                this._shouldReFlattenEditors = true;
                this._onDidChangeEditorRegistrations.fire();
            });
        }
        getAssociationsForResource(resource) {
            const associations = this.getAllUserAssociations();
            let matchingAssociations = associations.filter(association => association.filenamePattern && (0, editorResolverService_1.globMatchesResource)(association.filenamePattern, resource));
            // Sort matching associations based on glob length as a longer glob will be more specific
            matchingAssociations = matchingAssociations.sort((a, b) => (b.filenamePattern?.length ?? 0) - (a.filenamePattern?.length ?? 0));
            const allEditors = this._registeredEditors;
            // Ensure that the settings are valid editors
            return matchingAssociations.filter(association => allEditors.find(c => c.editorInfo.id === association.viewType));
        }
        getAllUserAssociations() {
            const inspectedEditorAssociations = this.configurationService.inspect(editorResolverService_1.editorsAssociationsSettingId) || {};
            const defaultAssociations = inspectedEditorAssociations.defaultValue ?? {};
            const workspaceAssociations = inspectedEditorAssociations.workspaceValue ?? {};
            const userAssociations = inspectedEditorAssociations.userValue ?? {};
            const rawAssociations = { ...workspaceAssociations };
            // We want to apply the default associations and user associations on top of the workspace associations but ignore duplicate keys.
            for (const [key, value] of Object.entries({ ...defaultAssociations, ...userAssociations })) {
                if (rawAssociations[key] === undefined) {
                    rawAssociations[key] = value;
                }
            }
            const associations = [];
            for (const [key, value] of Object.entries(rawAssociations)) {
                const association = {
                    filenamePattern: key,
                    viewType: value
                };
                associations.push(association);
            }
            return associations;
        }
        /**
         * Given the nested nature of the editors map, we merge factories of the same glob and id to make it flat
         * and easier to work with
         */
        _flattenEditorsMap() {
            // If we shouldn't be re-flattening (due to lack of update) then return early
            if (!this._shouldReFlattenEditors) {
                return this._flattenedEditors;
            }
            this._shouldReFlattenEditors = false;
            const editors = new Map();
            for (const [glob, value] of this._editors) {
                const registeredEditors = [];
                for (const editors of value.values()) {
                    let registeredEditor = undefined;
                    // Merge all editors with the same id and glob pattern together
                    for (const editor of editors) {
                        if (!registeredEditor) {
                            registeredEditor = {
                                editorInfo: editor.editorInfo,
                                globPattern: editor.globPattern,
                                options: {},
                                editorFactoryObject: {}
                            };
                        }
                        // Merge options and factories
                        registeredEditor.options = { ...registeredEditor.options, ...editor.options };
                        registeredEditor.editorFactoryObject = { ...registeredEditor.editorFactoryObject, ...editor.editorFactoryObject };
                    }
                    if (registeredEditor) {
                        registeredEditors.push(registeredEditor);
                    }
                }
                editors.set(glob, registeredEditors);
            }
            return editors;
        }
        /**
         * Returns all editors as an array. Possible to contain duplicates
         */
        get _registeredEditors() {
            return (0, arrays_1.flatten)(Array.from(this._flattenedEditors.values()));
        }
        updateUserAssociations(globPattern, editorID) {
            const newAssociation = { viewType: editorID, filenamePattern: globPattern };
            const currentAssociations = this.getAllUserAssociations();
            const newSettingObject = Object.create(null);
            // Form the new setting object including the newest associations
            for (const association of [...currentAssociations, newAssociation]) {
                if (association.filenamePattern) {
                    newSettingObject[association.filenamePattern] = association.viewType;
                }
            }
            this.configurationService.updateValue(editorResolverService_1.editorsAssociationsSettingId, newSettingObject);
        }
        findMatchingEditors(resource) {
            // The user setting should be respected even if the editor doesn't specify that resource in package.json
            const userSettings = this.getAssociationsForResource(resource);
            const matchingEditors = [];
            // Then all glob patterns
            for (const [key, editors] of this._flattenedEditors) {
                for (const editor of editors) {
                    const foundInSettings = userSettings.find(setting => setting.viewType === editor.editorInfo.id);
                    if ((foundInSettings && editor.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive) || (0, editorResolverService_1.globMatchesResource)(key, resource)) {
                        matchingEditors.push(editor);
                    }
                }
            }
            // Return the editors sorted by their priority
            return matchingEditors.sort((a, b) => {
                // Very crude if priorities match longer glob wins as longer globs are normally more specific
                if ((0, editorResolverService_1.priorityToRank)(b.editorInfo.priority) === (0, editorResolverService_1.priorityToRank)(a.editorInfo.priority) && typeof b.globPattern === 'string' && typeof a.globPattern === 'string') {
                    return b.globPattern.length - a.globPattern.length;
                }
                return (0, editorResolverService_1.priorityToRank)(b.editorInfo.priority) - (0, editorResolverService_1.priorityToRank)(a.editorInfo.priority);
            });
        }
        getEditors(resource) {
            this._flattenedEditors = this._flattenEditorsMap();
            // By resource
            if (uri_1.URI.isUri(resource)) {
                const editors = this.findMatchingEditors(resource);
                if (editors.find(e => e.editorInfo.priority === editorResolverService_1.RegisteredEditorPriority.exclusive)) {
                    return [];
                }
                return editors.map(editor => editor.editorInfo);
            }
            // All
            return (0, arrays_1.distinct)(this._registeredEditors.map(editor => editor.editorInfo), editor => editor.id);
        }
        /**
         * Given a resource and an editorId selects the best possible editor
         * @returns The editor and whether there was another default which conflicted with it
         */
        getEditor(resource, editorId) {
            const findMatchingEditor = (editors, viewType) => {
                return editors.find((editor) => {
                    if (editor.options && editor.options.canSupportResource !== undefined) {
                        return editor.editorInfo.id === viewType && editor.options.canSupportResource(resource);
                    }
                    return editor.editorInfo.id === viewType;
                });
            };
            if (editorId && editorId !== editor_1.EditorResolution.EXCLUSIVE_ONLY) {
                // Specific id passed in doesn't have to match the resource, it can be anything
                const registeredEditors = this._registeredEditors;
                return {
                    editor: findMatchingEditor(registeredEditors, editorId),
                    conflictingDefault: false
                };
            }
            const editors = this.findMatchingEditors(resource);
            const associationsFromSetting = this.getAssociationsForResource(resource);
            // We only want minPriority+ if no user defined setting is found, else we won't resolve an editor
            const minPriority = editorId === editor_1.EditorResolution.EXCLUSIVE_ONLY ? editorResolverService_1.RegisteredEditorPriority.exclusive : editorResolverService_1.RegisteredEditorPriority.builtin;
            let possibleEditors = editors.filter(editor => (0, editorResolverService_1.priorityToRank)(editor.editorInfo.priority) >= (0, editorResolverService_1.priorityToRank)(minPriority) && editor.editorInfo.id !== editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
            if (possibleEditors.length === 0) {
                return {
                    editor: associationsFromSetting[0] && minPriority !== editorResolverService_1.RegisteredEditorPriority.exclusive ? findMatchingEditor(editors, associationsFromSetting[0].viewType) : undefined,
                    conflictingDefault: false
                };
            }
            // If the editor is exclusive we use that, else use the user setting, else use the built-in+ editor
            const selectedViewType = possibleEditors[0].editorInfo.priority === editorResolverService_1.RegisteredEditorPriority.exclusive ?
                possibleEditors[0].editorInfo.id :
                associationsFromSetting[0]?.viewType || possibleEditors[0].editorInfo.id;
            let conflictingDefault = false;
            // Filter out exclusive before we check for conflicts as exclusive editors cannot be manually chosen
            possibleEditors = possibleEditors.filter(editor => editor.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive);
            if (associationsFromSetting.length === 0 && possibleEditors.length > 1) {
                conflictingDefault = true;
            }
            return {
                editor: findMatchingEditor(editors, selectedViewType),
                conflictingDefault
            };
        }
        async doResolveEditor(editor, group, selectedEditor) {
            let options = editor.options;
            const resource = editor_2.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            // If no activation option is provided, populate it.
            if (options && typeof options.activation === 'undefined') {
                options = { ...options, activation: options.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined };
            }
            // If it's a merge editor we trigger the create merge editor input
            if ((0, editor_2.isResourceMergeEditorInput)(editor)) {
                if (!selectedEditor.editorFactoryObject.createMergeEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.editorFactoryObject.createMergeEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: inputWithOptions.options ?? options };
            }
            // If it's a diff editor we trigger the create diff editor input
            if ((0, editor_2.isResourceDiffEditorInput)(editor)) {
                if (!selectedEditor.editorFactoryObject.createDiffEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.editorFactoryObject.createDiffEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: inputWithOptions.options ?? options };
            }
            // If it's a diff list editor we trigger the create diff list editor input
            if ((0, editor_2.isResourceMultiDiffEditorInput)(editor)) {
                if (!selectedEditor.editorFactoryObject.createMultiDiffEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.editorFactoryObject.createMultiDiffEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: inputWithOptions.options ?? options };
            }
            if ((0, editor_2.isResourceSideBySideEditorInput)(editor)) {
                throw new Error(`Untyped side by side editor input not supported here.`);
            }
            if ((0, editor_2.isUntitledResourceEditorInput)(editor)) {
                if (!selectedEditor.editorFactoryObject.createUntitledEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.editorFactoryObject.createUntitledEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: inputWithOptions.options ?? options };
            }
            // Should no longer have an undefined resource so lets throw an error if that's somehow the case
            if (resource === undefined) {
                throw new Error(`Undefined resource on non untitled editor input.`);
            }
            // If the editor states it can only be opened once per resource we must close all existing ones except one and move the new one into the group
            const singleEditorPerResource = typeof selectedEditor.options?.singlePerResource === 'function' ? selectedEditor.options.singlePerResource() : selectedEditor.options?.singlePerResource;
            if (singleEditorPerResource) {
                const existingEditors = this.findExistingEditorsForResource(resource, selectedEditor.editorInfo.id);
                if (existingEditors.length) {
                    const editor = await this.moveExistingEditorForResource(existingEditors, group);
                    if (editor) {
                        return { editor, options };
                    }
                    else {
                        return; // failed to move
                    }
                }
            }
            // If no factory is above, return flow back to caller letting them know we could not resolve it
            if (!selectedEditor.editorFactoryObject.createEditorInput) {
                return;
            }
            // Respect options passed back
            const inputWithOptions = await selectedEditor.editorFactoryObject.createEditorInput(editor, group);
            options = inputWithOptions.options ?? options;
            const input = inputWithOptions.editor;
            return { editor: input, options };
        }
        /**
         * Moves the first existing editor for a resource to the target group unless already opened there.
         * Additionally will close any other editors that are open for that resource and viewtype besides the first one found
         * @param resource The resource of the editor
         * @param viewType the viewtype of the editor
         * @param targetGroup The group to move it to
         * @returns The moved editor input or `undefined` if the editor could not be moved
         */
        async moveExistingEditorForResource(existingEditorsForResource, targetGroup) {
            const editorToUse = existingEditorsForResource[0];
            // We should only have one editor but if there are multiple we close the others
            for (const { editor, group } of existingEditorsForResource) {
                if (editor !== editorToUse.editor) {
                    const closed = await group.closeEditor(editor);
                    if (!closed) {
                        return;
                    }
                }
            }
            // Move the editor already opened to the target group
            if (targetGroup.id !== editorToUse.group.id) {
                const moved = editorToUse.group.moveEditor(editorToUse.editor, targetGroup);
                if (!moved) {
                    return;
                }
            }
            return editorToUse.editor;
        }
        /**
         * Given a resource and an editorId, returns all editors open for that resource and editorId.
         * @param resource The resource specified
         * @param editorId The editorID
         * @returns A list of editors
         */
        findExistingEditorsForResource(resource, editorId) {
            const out = [];
            const orderedGroups = (0, arrays_1.distinct)([
                ...this.editorGroupService.groups,
            ]);
            for (const group of orderedGroups) {
                for (const editor of group.editors) {
                    if ((0, resources_1.isEqual)(editor.resource, resource) && editor.editorId === editorId) {
                        out.push({ editor, group });
                    }
                }
            }
            return out;
        }
        async doHandleConflictingDefaults(resource, editorName, untypedInput, currentEditor, group) {
            const editors = this.findMatchingEditors(resource);
            const storedChoices = JSON.parse(this.storageService.get(EditorResolverService_1.conflictingDefaultsStorageID, 0 /* StorageScope.PROFILE */, '{}'));
            const globForResource = `*${(0, resources_1.extname)(resource)}`;
            // Writes to the storage service that a choice has been made for the currently installed editors
            const writeCurrentEditorsToStorage = () => {
                storedChoices[globForResource] = [];
                editors.forEach(editor => storedChoices[globForResource].push(editor.editorInfo.id));
                this.storageService.store(EditorResolverService_1.conflictingDefaultsStorageID, JSON.stringify(storedChoices), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            };
            // If the user has already made a choice for this editor we don't want to ask them again
            if (storedChoices[globForResource] && storedChoices[globForResource].find(editorID => editorID === currentEditor.editorId)) {
                return;
            }
            const handle = this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('editorResolver.conflictingDefaults', 'There are multiple default editors available for the resource.'), [{
                    label: (0, nls_1.localize)('editorResolver.configureDefault', 'Configure Default'),
                    run: async () => {
                        // Show the picker and tell it to update the setting to whatever the user selected
                        const picked = await this.doPickEditor(untypedInput, true);
                        if (!picked) {
                            return;
                        }
                        untypedInput.options = picked;
                        const replacementEditor = await this.resolveEditor(untypedInput, group);
                        if (replacementEditor === 1 /* ResolvedStatus.ABORT */ || replacementEditor === 2 /* ResolvedStatus.NONE */) {
                            return;
                        }
                        // Replace the current editor with the picked one
                        group.replaceEditors([
                            {
                                editor: currentEditor,
                                replacement: replacementEditor.editor,
                                options: replacementEditor.options ?? picked,
                            }
                        ]);
                    }
                },
                {
                    label: (0, nls_1.localize)('editorResolver.keepDefault', 'Keep {0}', editorName),
                    run: writeCurrentEditorsToStorage
                }
            ]);
            // If the user pressed X we assume they want to keep the current editor as default
            const onCloseListener = handle.onDidClose(() => {
                writeCurrentEditorsToStorage();
                onCloseListener.dispose();
            });
        }
        mapEditorsToQuickPickEntry(resource, showDefaultPicker) {
            const currentEditor = (0, arrays_1.firstOrDefault)(this.editorGroupService.activeGroup.findEditors(resource));
            // If untitled, we want all registered editors
            let registeredEditors = resource.scheme === network_1.Schemas.untitled ? this._registeredEditors.filter(e => e.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive) : this.findMatchingEditors(resource);
            // We don't want duplicate Id entries
            registeredEditors = (0, arrays_1.distinct)(registeredEditors, c => c.editorInfo.id);
            const defaultSetting = this.getAssociationsForResource(resource)[0]?.viewType;
            // Not the most efficient way to do this, but we want to ensure the text editor is at the top of the quickpick
            registeredEditors = registeredEditors.sort((a, b) => {
                if (a.editorInfo.id === editor_2.DEFAULT_EDITOR_ASSOCIATION.id) {
                    return -1;
                }
                else if (b.editorInfo.id === editor_2.DEFAULT_EDITOR_ASSOCIATION.id) {
                    return 1;
                }
                else {
                    return (0, editorResolverService_1.priorityToRank)(b.editorInfo.priority) - (0, editorResolverService_1.priorityToRank)(a.editorInfo.priority);
                }
            });
            const quickPickEntries = [];
            const currentlyActiveLabel = (0, nls_1.localize)('promptOpenWith.currentlyActive', "Active");
            const currentDefaultLabel = (0, nls_1.localize)('promptOpenWith.currentDefault', "Default");
            const currentDefaultAndActiveLabel = (0, nls_1.localize)('promptOpenWith.currentDefaultAndActive', "Active and Default");
            // Default order = setting -> highest priority -> text
            let defaultViewType = defaultSetting;
            if (!defaultViewType && registeredEditors.length > 2 && registeredEditors[1]?.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.option) {
                defaultViewType = registeredEditors[1]?.editorInfo.id;
            }
            if (!defaultViewType) {
                defaultViewType = editor_2.DEFAULT_EDITOR_ASSOCIATION.id;
            }
            // Map the editors to quickpick entries
            registeredEditors.forEach(editor => {
                const currentViewType = currentEditor?.editorId ?? editor_2.DEFAULT_EDITOR_ASSOCIATION.id;
                const isActive = currentEditor ? editor.editorInfo.id === currentViewType : false;
                const isDefault = editor.editorInfo.id === defaultViewType;
                const quickPickEntry = {
                    id: editor.editorInfo.id,
                    label: editor.editorInfo.label,
                    description: isActive && isDefault ? currentDefaultAndActiveLabel : isActive ? currentlyActiveLabel : isDefault ? currentDefaultLabel : undefined,
                    detail: editor.editorInfo.detail ?? editor.editorInfo.priority,
                };
                quickPickEntries.push(quickPickEntry);
            });
            if (!showDefaultPicker && (0, resources_1.extname)(resource) !== '') {
                const separator = { type: 'separator' };
                quickPickEntries.push(separator);
                const configureDefaultEntry = {
                    id: EditorResolverService_1.configureDefaultID,
                    label: (0, nls_1.localize)('promptOpenWith.configureDefault', "Configure default editor for '{0}'...", `*${(0, resources_1.extname)(resource)}`),
                };
                quickPickEntries.push(configureDefaultEntry);
            }
            return quickPickEntries;
        }
        async doPickEditor(editor, showDefaultPicker) {
            let resource = editor_2.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            if (resource === undefined) {
                resource = uri_1.URI.from({ scheme: network_1.Schemas.untitled });
            }
            // Get all the editors for the resource as quickpick entries
            const editorPicks = this.mapEditorsToQuickPickEntry(resource, showDefaultPicker);
            // Create the editor picker
            const editorPicker = this.quickInputService.createQuickPick();
            const placeHolderMessage = showDefaultPicker ?
                (0, nls_1.localize)('promptOpenWith.updateDefaultPlaceHolder', "Select new default editor for '{0}'", `*${(0, resources_1.extname)(resource)}`) :
                (0, nls_1.localize)('promptOpenWith.placeHolder', "Select editor for '{0}'", (0, resources_1.basename)(resource));
            editorPicker.placeholder = placeHolderMessage;
            editorPicker.canAcceptInBackground = true;
            editorPicker.items = editorPicks;
            const firstItem = editorPicker.items.find(item => item.type === 'item');
            if (firstItem) {
                editorPicker.selectedItems = [firstItem];
            }
            // Prompt the user to select an editor
            const picked = await new Promise(resolve => {
                editorPicker.onDidAccept(e => {
                    let result = undefined;
                    if (editorPicker.selectedItems.length === 1) {
                        result = {
                            item: editorPicker.selectedItems[0],
                            keyMods: editorPicker.keyMods,
                            openInBackground: e.inBackground
                        };
                    }
                    // If asked to always update the setting then update it even if the gear isn't clicked
                    if (resource && showDefaultPicker && result?.item.id) {
                        this.updateUserAssociations(`*${(0, resources_1.extname)(resource)}`, result.item.id);
                    }
                    resolve(result);
                });
                editorPicker.onDidHide(() => resolve(undefined));
                editorPicker.onDidTriggerItemButton(e => {
                    // Trigger opening and close picker
                    resolve({ item: e.item, openInBackground: false });
                    // Persist setting
                    if (resource && e.item && e.item.id) {
                        this.updateUserAssociations(`*${(0, resources_1.extname)(resource)}`, e.item.id);
                    }
                });
                editorPicker.show();
            });
            // Close picker
            editorPicker.dispose();
            // If the user picked an editor, look at how the picker was
            // used (e.g. modifier keys, open in background) and create the
            // options and group to use accordingly
            if (picked) {
                // If the user selected to configure default we trigger this picker again and tell it to show the default picker
                if (picked.item.id === EditorResolverService_1.configureDefaultID) {
                    return this.doPickEditor(editor, true);
                }
                // Figure out options
                const targetOptions = {
                    ...editor.options,
                    override: picked.item.id,
                    preserveFocus: picked.openInBackground || editor.options?.preserveFocus,
                };
                return targetOptions;
            }
            return undefined;
        }
        sendEditorResolutionTelemetry(chosenInput) {
            if (chosenInput.editorId) {
                this.telemetryService.publicLog2('override.viewType', { viewType: chosenInput.editorId });
            }
        }
        cacheEditors() {
            // Create a set to store glob patterns
            const cacheStorage = new Set();
            // Store just the relative pattern pieces without any path info
            for (const [globPattern, contribPoint] of this._flattenedEditors) {
                const nonOptional = !!contribPoint.find(c => c.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.option && c.editorInfo.id !== editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
                // Don't keep a cache of the optional ones as those wouldn't be opened on start anyways
                if (!nonOptional) {
                    continue;
                }
                if (glob.isRelativePattern(globPattern)) {
                    cacheStorage.add(`${globPattern.pattern}`);
                }
                else {
                    cacheStorage.add(globPattern);
                }
            }
            // Also store the users settings as those would have to activate on startup as well
            const userAssociations = this.getAllUserAssociations();
            for (const association of userAssociations) {
                if (association.filenamePattern) {
                    cacheStorage.add(association.filenamePattern);
                }
            }
            this.storageService.store(EditorResolverService_1.cacheStorageID, JSON.stringify(Array.from(cacheStorage)), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        resourceMatchesCache(resource) {
            if (!this.cache) {
                return false;
            }
            for (const cacheEntry of this.cache) {
                if ((0, editorResolverService_1.globMatchesResource)(cacheEntry, resource)) {
                    return true;
                }
            }
            return false;
        }
    };
    exports.EditorResolverService = EditorResolverService;
    exports.EditorResolverService = EditorResolverService = EditorResolverService_1 = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, notification_1.INotificationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, extensions_2.IExtensionService),
        __param(8, log_1.ILogService)
    ], EditorResolverService);
    (0, extensions_1.registerSingleton)(editorResolverService_1.IEditorResolverService, EditorResolverService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2VkaXRvci9icm93c2VyL2VkaXRvclJlc29sdmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcUN6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVOztRQU9wRCxZQUFZO2lCQUNZLHVCQUFrQixHQUFHLGlDQUFpQyxBQUFwQyxDQUFxQztpQkFDdkQsbUJBQWMsR0FBRyw2QkFBNkIsQUFBaEMsQ0FBaUM7aUJBQy9DLGlDQUE0QixHQUFHLDJDQUEyQyxBQUE5QyxDQUErQztRQVFuRyxZQUN1QixrQkFBeUQsRUFDeEQsb0JBQTRELEVBQzVELG9CQUE0RCxFQUMvRCxpQkFBc0QsRUFDcEQsbUJBQTBELEVBQzdELGdCQUFvRCxFQUN0RCxjQUFnRCxFQUM5QyxnQkFBb0QsRUFDMUQsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFWK0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQUN2Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDOUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNuQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQzVDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDckMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzdCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDekMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQXhCdEQsU0FBUztZQUNRLG9DQUErQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFB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