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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/base/common/event", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/objects"], function (require, exports, editor_1, sideBySideEditorInput_1, lifecycle_1, storage_1, platform_1, event_1, editorGroupsService_1, arrays_1, map_1, objects_1) {
    "use strict";
    var EditorsObserver_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorsObserver = void 0;
    /**
     * A observer of opened editors across all editor groups by most recently used.
     * Rules:
     * - the last editor in the list is the one most recently activated
     * - the first editor in the list is the one that was activated the longest time ago
     * - an editor that opens inactive will be placed behind the currently active editor
     *
     * The observer may start to close editors based on the workbench.editor.limit setting.
     */
    let EditorsObserver = class EditorsObserver extends lifecycle_1.Disposable {
        static { EditorsObserver_1 = this; }
        static { this.STORAGE_KEY = 'editors.mru'; }
        get count() {
            return this.mostRecentEditorsMap.size;
        }
        get editors() {
            return [...this.mostRecentEditorsMap.values()];
        }
        hasEditor(editor) {
            const editors = this.editorsPerResourceCounter.get(editor.resource);
            return editors?.has(this.toIdentifier(editor)) ?? false;
        }
        hasEditors(resource) {
            return this.editorsPerResourceCounter.has(resource);
        }
        toIdentifier(arg1, editorId) {
            if (typeof arg1 !== 'string') {
                return this.toIdentifier(arg1.typeId, arg1.editorId);
            }
            if (editorId) {
                return `${arg1}/${editorId}`;
            }
            return arg1;
        }
        constructor(editorGroupsContainer, editorGroupService, storageService) {
            super();
            this.editorGroupService = editorGroupService;
            this.storageService = storageService;
            this.keyMap = new Map();
            this.mostRecentEditorsMap = new map_1.LinkedMap();
            this.editorsPerResourceCounter = new map_1.ResourceMap();
            this._onDidMostRecentlyActiveEditorsChange = this._register(new event_1.Emitter());
            this.onDidMostRecentlyActiveEditorsChange = this._onDidMostRecentlyActiveEditorsChange.event;
            this.editorGroupsContainer = editorGroupsContainer ?? editorGroupService;
            this.isScoped = !!editorGroupsContainer;
            this.registerListeners();
            this.loadState();
        }
        registerListeners() {
            this._register(this.editorGroupsContainer.onDidAddGroup(group => this.onGroupAdded(group)));
            this._register(this.editorGroupService.onDidChangeEditorPartOptions(e => this.onDidChangeEditorPartOptions(e)));
            this._register(this.storageService.onWillSaveState(() => this.saveState()));
        }
        onGroupAdded(group) {
            // Make sure to add any already existing editor
            // of the new group into our list in LRU order
            const groupEditorsMru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            for (let i = groupEditorsMru.length - 1; i >= 0; i--) {
                this.addMostRecentEditor(group, groupEditorsMru[i], false /* is not active */, true /* is new */);
            }
            // Make sure that active editor is put as first if group is active
            if (this.editorGroupsContainer.activeGroup === group && group.activeEditor) {
                this.addMostRecentEditor(group, group.activeEditor, true /* is active */, false /* already added before */);
            }
            // Group Listeners
            this.registerGroupListeners(group);
        }
        registerGroupListeners(group) {
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(group.onDidModelChange(e => {
                switch (e.kind) {
                    // Group gets active: put active editor as most recent
                    case 0 /* GroupModelChangeKind.GROUP_ACTIVE */: {
                        if (this.editorGroupsContainer.activeGroup === group && group.activeEditor) {
                            this.addMostRecentEditor(group, group.activeEditor, true /* is active */, false /* editor already opened */);
                        }
                        break;
                    }
                    // Editor opens: put it as second most recent
                    //
                    // Also check for maximum allowed number of editors and
                    // start to close oldest ones if needed.
                    case 4 /* GroupModelChangeKind.EDITOR_OPEN */: {
                        if (e.editor) {
                            this.addMostRecentEditor(group, e.editor, false /* is not active */, true /* is new */);
                            this.ensureOpenedEditorsLimit({ groupId: group.id, editor: e.editor }, group.id);
                        }
                        break;
                    }
                }
            }));
            // Editor closes: remove from recently opened
            groupDisposables.add(group.onDidCloseEditor(e => {
                this.removeMostRecentEditor(group, e.editor);
            }));
            // Editor gets active: put active editor as most recent
            // if group is active, otherwise second most recent
            groupDisposables.add(group.onDidActiveEditorChange(e => {
                if (e.editor) {
                    this.addMostRecentEditor(group, e.editor, this.editorGroupsContainer.activeGroup === group, false /* editor already opened */);
                }
            }));
            // Make sure to cleanup on dispose
            event_1.Event.once(group.onWillDispose)(() => (0, lifecycle_1.dispose)(groupDisposables));
        }
        onDidChangeEditorPartOptions(event) {
            if (!(0, objects_1.equals)(event.newPartOptions.limit, event.oldPartOptions.limit)) {
                const activeGroup = this.editorGroupsContainer.activeGroup;
                let exclude = undefined;
                if (activeGroup.activeEditor) {
                    exclude = { editor: activeGroup.activeEditor, groupId: activeGroup.id };
                }
                this.ensureOpenedEditorsLimit(exclude);
            }
        }
        addMostRecentEditor(group, editor, isActive, isNew) {
            const key = this.ensureKey(group, editor);
            const mostRecentEditor = this.mostRecentEditorsMap.first;
            // Active or first entry: add to end of map
            if (isActive || !mostRecentEditor) {
                this.mostRecentEditorsMap.set(key, key, mostRecentEditor ? 1 /* Touch.AsOld */ : undefined);
            }
            // Otherwise: insert before most recent
            else {
                // we have most recent editors. as such we
                // put this newly opened editor right before
                // the current most recent one because it cannot
                // be the most recently active one unless
                // it becomes active. but it is still more
                // active then any other editor in the list.
                this.mostRecentEditorsMap.set(key, key, 1 /* Touch.AsOld */);
                this.mostRecentEditorsMap.set(mostRecentEditor, mostRecentEditor, 1 /* Touch.AsOld */);
            }
            // Update in resource map if this is a new editor
            if (isNew) {
                this.updateEditorResourcesMap(editor, true);
            }
            // Event
            this._onDidMostRecentlyActiveEditorsChange.fire();
        }
        updateEditorResourcesMap(editor, add) {
            // Distill the editor resource and type id with support
            // for side by side editor's primary side too.
            let resource = undefined;
            let typeId = undefined;
            let editorId = undefined;
            if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                resource = editor.primary.resource;
                typeId = editor.primary.typeId;
                editorId = editor.primary.editorId;
            }
            else {
                resource = editor.resource;
                typeId = editor.typeId;
                editorId = editor.editorId;
            }
            if (!resource) {
                return; // require a resource
            }
            const identifier = this.toIdentifier(typeId, editorId);
            // Add entry
            if (add) {
                let editorsPerResource = this.editorsPerResourceCounter.get(resource);
                if (!editorsPerResource) {
                    editorsPerResource = new Map();
                    this.editorsPerResourceCounter.set(resource, editorsPerResource);
                }
                editorsPerResource.set(identifier, (editorsPerResource.get(identifier) ?? 0) + 1);
            }
            // Remove entry
            else {
                const editorsPerResource = this.editorsPerResourceCounter.get(resource);
                if (editorsPerResource) {
                    const counter = editorsPerResource.get(identifier) ?? 0;
                    if (counter > 1) {
                        editorsPerResource.set(identifier, counter - 1);
                    }
                    else {
                        editorsPerResource.delete(identifier);
                        if (editorsPerResource.size === 0) {
                            this.editorsPerResourceCounter.delete(resource);
                        }
                    }
                }
            }
        }
        removeMostRecentEditor(group, editor) {
            // Update in resource map
            this.updateEditorResourcesMap(editor, false);
            // Update in MRU list
            const key = this.findKey(group, editor);
            if (key) {
                // Remove from most recent editors
                this.mostRecentEditorsMap.delete(key);
                // Remove from key map
                const map = this.keyMap.get(group.id);
                if (map && map.delete(key.editor) && map.size === 0) {
                    this.keyMap.delete(group.id);
                }
                // Event
                this._onDidMostRecentlyActiveEditorsChange.fire();
            }
        }
        findKey(group, editor) {
            const groupMap = this.keyMap.get(group.id);
            if (!groupMap) {
                return undefined;
            }
            return groupMap.get(editor);
        }
        ensureKey(group, editor) {
            let groupMap = this.keyMap.get(group.id);
            if (!groupMap) {
                groupMap = new Map();
                this.keyMap.set(group.id, groupMap);
            }
            let key = groupMap.get(editor);
            if (!key) {
                key = { groupId: group.id, editor };
                groupMap.set(editor, key);
            }
            return key;
        }
        async ensureOpenedEditorsLimit(exclude, groupId) {
            if (!this.editorGroupService.partOptions.limit?.enabled ||
                typeof this.editorGroupService.partOptions.limit.value !== 'number' ||
                this.editorGroupService.partOptions.limit.value <= 0) {
                return; // return early if not enabled or invalid
            }
            const limit = this.editorGroupService.partOptions.limit.value;
            // In editor group
            if (this.editorGroupService.partOptions.limit?.perEditorGroup) {
                // For specific editor groups
                if (typeof groupId === 'number') {
                    const group = this.editorGroupsContainer.getGroup(groupId);
                    if (group) {
                        await this.doEnsureOpenedEditorsLimit(limit, group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).map(editor => ({ editor, groupId })), exclude);
                    }
                }
                // For all editor groups
                else {
                    for (const group of this.editorGroupsContainer.groups) {
                        await this.ensureOpenedEditorsLimit(exclude, group.id);
                    }
                }
            }
            // Across all editor groups
            else {
                await this.doEnsureOpenedEditorsLimit(limit, [...this.mostRecentEditorsMap.values()], exclude);
            }
        }
        async doEnsureOpenedEditorsLimit(limit, mostRecentEditors, exclude) {
            // Check for `excludeDirty` setting and apply it by excluding
            // any recent editor that is dirty from the opened editors limit
            let mostRecentEditorsCountingForLimit;
            if (this.editorGroupService.partOptions.limit?.excludeDirty) {
                mostRecentEditorsCountingForLimit = mostRecentEditors.filter(({ editor }) => {
                    if ((editor.isDirty() && !editor.isSaving()) || editor.hasCapability(512 /* EditorInputCapabilities.Scratchpad */)) {
                        return false; // not dirty editors (unless in the process of saving) or scratchpads
                    }
                    return true;
                });
            }
            else {
                mostRecentEditorsCountingForLimit = mostRecentEditors;
            }
            if (limit >= mostRecentEditorsCountingForLimit.length) {
                return; // only if opened editors exceed setting and is valid and enabled
            }
            // Extract least recently used editors that can be closed
            const leastRecentlyClosableEditors = mostRecentEditorsCountingForLimit.reverse().filter(({ editor, groupId }) => {
                if ((editor.isDirty() && !editor.isSaving()) || editor.hasCapability(512 /* EditorInputCapabilities.Scratchpad */)) {
                    return false; // not dirty editors (unless in the process of saving) or scratchpads
                }
                if (exclude && editor === exclude.editor && groupId === exclude.groupId) {
                    return false; // never the editor that should be excluded
                }
                if (this.editorGroupsContainer.getGroup(groupId)?.isSticky(editor)) {
                    return false; // never sticky editors
                }
                return true;
            });
            // Close editors until we reached the limit again
            let editorsToCloseCount = mostRecentEditorsCountingForLimit.length - limit;
            const mapGroupToEditorsToClose = new Map();
            for (const { groupId, editor } of leastRecentlyClosableEditors) {
                let editorsInGroupToClose = mapGroupToEditorsToClose.get(groupId);
                if (!editorsInGroupToClose) {
                    editorsInGroupToClose = [];
                    mapGroupToEditorsToClose.set(groupId, editorsInGroupToClose);
                }
                editorsInGroupToClose.push(editor);
                editorsToCloseCount--;
                if (editorsToCloseCount === 0) {
                    break; // limit reached
                }
            }
            for (const [groupId, editors] of mapGroupToEditorsToClose) {
                const group = this.editorGroupsContainer.getGroup(groupId);
                if (group) {
                    await group.closeEditors(editors, { preserveFocus: true });
                }
            }
        }
        saveState() {
            if (this.isScoped) {
                return; // do not persist state when scoped
            }
            if (this.mostRecentEditorsMap.isEmpty()) {
                this.storageService.remove(EditorsObserver_1.STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
            }
            else {
                this.storageService.store(EditorsObserver_1.STORAGE_KEY, JSON.stringify(this.serialize()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
        }
        serialize() {
            const registry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
            const entries = [...this.mostRecentEditorsMap.values()];
            const mapGroupToSerializableEditorsOfGroup = new Map();
            return {
                entries: (0, arrays_1.coalesce)(entries.map(({ editor, groupId }) => {
                    // Find group for entry
                    const group = this.editorGroupsContainer.getGroup(groupId);
                    if (!group) {
                        return undefined;
                    }
                    // Find serializable editors of group
                    let serializableEditorsOfGroup = mapGroupToSerializableEditorsOfGroup.get(group);
                    if (!serializableEditorsOfGroup) {
                        serializableEditorsOfGroup = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */).filter(editor => {
                            const editorSerializer = registry.getEditorSerializer(editor);
                            return editorSerializer?.canSerialize(editor);
                        });
                        mapGroupToSerializableEditorsOfGroup.set(group, serializableEditorsOfGroup);
                    }
                    // Only store the index of the editor of that group
                    // which can be undefined if the editor is not serializable
                    const index = serializableEditorsOfGroup.indexOf(editor);
                    if (index === -1) {
                        return undefined;
                    }
                    return { groupId, index };
                }))
            };
        }
        async loadState() {
            if (this.editorGroupsContainer === this.editorGroupService.mainPart || this.editorGroupsContainer === this.editorGroupService) {
                await this.editorGroupService.whenReady;
            }
            // Previous state: Load editors map from persisted state
            // unless we are running in scoped mode
            let hasRestorableState = false;
            if (!this.isScoped) {
                const serialized = this.storageService.get(EditorsObserver_1.STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
                if (serialized) {
                    hasRestorableState = true;
                    this.deserialize(JSON.parse(serialized));
                }
            }
            // No previous state: best we can do is add each editor
            // from oldest to most recently used editor group
            if (!hasRestorableState) {
                const groups = this.editorGroupsContainer.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
                for (let i = groups.length - 1; i >= 0; i--) {
                    const group = groups[i];
                    const groupEditorsMru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
                    for (let i = groupEditorsMru.length - 1; i >= 0; i--) {
                        this.addMostRecentEditor(group, groupEditorsMru[i], true /* enforce as active to preserve order */, true /* is new */);
                    }
                }
            }
            // Ensure we listen on group changes for those that exist on startup
            for (const group of this.editorGroupsContainer.groups) {
                this.registerGroupListeners(group);
            }
        }
        deserialize(serialized) {
            const mapValues = [];
            for (const { groupId, index } of serialized.entries) {
                // Find group for entry
                const group = this.editorGroupsContainer.getGroup(groupId);
                if (!group) {
                    continue;
                }
                // Find editor for entry
                const editor = group.getEditorByIndex(index);
                if (!editor) {
                    continue;
                }
                // Make sure key is registered as well
                const editorIdentifier = this.ensureKey(group, editor);
                mapValues.push([editorIdentifier, editorIdentifier]);
                // Update in resource map
                this.updateEditorResourcesMap(editor, true);
            }
            // Fill map with deserialized values
            this.mostRecentEditorsMap.fromJSON(mapValues);
        }
    };
    exports.EditorsObserver = EditorsObserver;
    exports.EditorsObserver = EditorsObserver = EditorsObserver_1 = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, storage_1.IStorageService)
    ], EditorsObserver);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yc09ic2VydmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvcnNPYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRzs7Ozs7Ozs7T0FRRztJQUNJLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsc0JBQVU7O2lCQUV0QixnQkFBVyxHQUFHLGFBQWEsQUFBaEIsQ0FBaUI7UUFTcEQsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDVixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRUQsU0FBUyxDQUFDLE1BQXNDO1lBQy9DLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXBFLE9BQU8sT0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDO1FBQ3pELENBQUM7UUFFRCxVQUFVLENBQUMsUUFBYTtZQUN2QixPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUlPLFlBQVksQ0FBQyxJQUE2QyxFQUFFLFFBQTZCO1lBQ2hHLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzlCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUks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