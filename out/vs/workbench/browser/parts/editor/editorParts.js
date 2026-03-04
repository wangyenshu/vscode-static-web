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
define(["require", "exports", "vs/nls", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/browser/parts/editor/editorPart", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/base/common/arrays", "vs/workbench/browser/parts/editor/auxiliaryEditorPart", "vs/workbench/browser/part", "vs/base/common/async", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService", "vs/base/common/uuid"], function (require, exports, nls_1, editorGroupsService_1, event_1, lifecycle_1, editorPart_1, extensions_1, instantiation_1, arrays_1, auxiliaryEditorPart_1, part_1, async_1, storage_1, themeService_1, auxiliaryWindowService_1, uuid_1) {
    "use strict";
    var EditorParts_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorParts = void 0;
    let EditorParts = class EditorParts extends part_1.MultiWindowParts {
        static { EditorParts_1 = this; }
        constructor(instantiationService, storageService, themeService, auxiliaryWindowService) {
            super('workbench.editorParts', themeService, storageService);
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.auxiliaryWindowService = auxiliaryWindowService;
            this.mainPart = this._register(this.createMainEditorPart());
            this.mostRecentActiveParts = [this.mainPart];
            //#region Auxiliary Editor Parts
            this._onDidCreateAuxiliaryEditorPart = this._register(new event_1.Emitter());
            this.onDidCreateAuxiliaryEditorPart = this._onDidCreateAuxiliaryEditorPart.event;
            this.workspaceMemento = this.getMemento(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            this._isReady = false;
            this.whenReadyPromise = new async_1.DeferredPromise();
            this.whenReady = this.whenReadyPromise.p;
            this.whenRestoredPromise = new async_1.DeferredPromise();
            this.whenRestored = this.whenRestoredPromise.p;
            this.editorWorkingSets = (() => {
                const workingSetsRaw = this.storageService.get(EditorParts_1.EDITOR_WORKING_SETS_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
                if (workingSetsRaw) {
                    return JSON.parse(workingSetsRaw);
                }
                return [];
            })();
            //#endregion
            //#region Events
            this._onDidActiveGroupChange = this._register(new event_1.Emitter());
            this.onDidChangeActiveGroup = this._onDidActiveGroupChange.event;
            this._onDidAddGroup = this._register(new event_1.Emitter());
            this.onDidAddGroup = this._onDidAddGroup.event;
            this._onDidRemoveGroup = this._register(new event_1.Emitter());
            this.onDidRemoveGroup = this._onDidRemoveGroup.event;
            this._onDidMoveGroup = this._register(new event_1.Emitter());
            this.onDidMoveGroup = this._onDidMoveGroup.event;
            this._onDidActivateGroup = this._register(new event_1.Emitter());
            this.onDidActivateGroup = this._onDidActivateGroup.event;
            this._onDidChangeGroupIndex = this._register(new event_1.Emitter());
            this.onDidChangeGroupIndex = this._onDidChangeGroupIndex.event;
            this._onDidChangeGroupLocked = this._register(new event_1.Emitter());
            this.onDidChangeGroupLocked = this._onDidChangeGroupLocked.event;
            this._onDidChangeGroupMaximized = this._register(new event_1.Emitter());
            this.onDidChangeGroupMaximized = this._onDidChangeGroupMaximized.event;
            this._register(this.registerPart(this.mainPart));
            this.restoreParts();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.onDidChangeMementoValue(1 /* StorageScope.WORKSPACE */, this._store)(e => this.onDidChangeMementoState(e)));
        }
        createMainEditorPart() {
            return this.instantiationService.createInstance(editorPart_1.MainEditorPart, this);
        }
        async createAuxiliaryEditorPart(options) {
            const { part, instantiationService, disposables } = await this.instantiationService.createInstance(auxiliaryEditorPart_1.AuxiliaryEditorPart, this).create(this.getGroupsLabel(this._parts.size), options);
            // Events
            this._onDidAddGroup.fire(part.activeGroup);
            const eventDisposables = disposables.add(new lifecycle_1.DisposableStore());
            this._onDidCreateAuxiliaryEditorPart.fire({ part, instantiationService, disposables: eventDisposables });
            return part;
        }
        //#endregion
        //#region Registration
        registerPart(part) {
            const disposables = this._register(new lifecycle_1.DisposableStore());
            disposables.add(super.registerPart(part));
            this.registerEditorPartListeners(part, disposables);
            return disposables;
        }
        unregisterPart(part) {
            super.unregisterPart(part);
            // Notify all parts about a groups label change
            // given it is computed based on the index
            this.parts.forEach((part, index) => {
                if (part === this.mainPart) {
                    return;
                }
                part.notifyGroupsLabelChange(this.getGroupsLabel(index));
            });
        }
        registerEditorPartListeners(part, disposables) {
            disposables.add(part.onDidFocus(() => {
                this.doUpdateMostRecentActive(part, true);
                if (this._parts.size > 1) {
                    this._onDidActiveGroupChange.fire(this.activeGroup); // this can only happen when we have more than 1 editor part
                }
            }));
            disposables.add((0, lifecycle_1.toDisposable)(() => this.doUpdateMostRecentActive(part)));
            disposables.add(part.onDidChangeActiveGroup(group => this._onDidActiveGroupChange.fire(group)));
            disposables.add(part.onDidAddGroup(group => this._onDidAddGroup.fire(group)));
            disposables.add(part.onDidRemoveGroup(group => this._onDidRemoveGroup.fire(group)));
            disposables.add(part.onDidMoveGroup(group => this._onDidMoveGroup.fire(group)));
            disposables.add(part.onDidActivateGroup(group => this._onDidActivateGroup.fire(group)));
            disposables.add(part.onDidChangeGroupMaximized(maximized => this._onDidChangeGroupMaximized.fire(maximized)));
            disposables.add(part.onDidChangeGroupIndex(group => this._onDidChangeGroupIndex.fire(group)));
            disposables.add(part.onDidChangeGroupLocked(group => this._onDidChangeGroupLocked.fire(group)));
        }
        doUpdateMostRecentActive(part, makeMostRecentlyActive) {
            const index = this.mostRecentActiveParts.indexOf(part);
            // Remove from MRU list
            if (index !== -1) {
                this.mostRecentActiveParts.splice(index, 1);
            }
            // Add to front as needed
            if (makeMostRecentlyActive) {
                this.mostRecentActiveParts.unshift(part);
            }
        }
        getGroupsLabel(index) {
            return (0, nls_1.localize)('groupLabel', "Window {0}", index + 1);
        }
        getPart(groupOrElement) {
            if (this._parts.size > 1) {
                if (groupOrElement instanceof HTMLElement) {
                    const element = groupOrElement;
                    return this.getPartByDocument(element.ownerDocument);
                }
                else {
                    const group = groupOrElement;
                    let id;
                    if (typeof group === 'number') {
                        id = group;
                    }
                    else {
                        id = group.id;
                    }
                    for (const part of this._parts) {
                        if (part.hasGroup(id)) {
                            return part;
                        }
                    }
                }
            }
            return this.mainPart;
        }
        //#endregion
        //#region Lifecycle / State
        static { this.EDITOR_PARTS_UI_STATE_STORAGE_KEY = 'editorparts.state'; }
        get isReady() { return this._isReady; }
        async restoreParts() {
            // Join on the main part being ready to pick
            // the right moment to begin restoring.
            // The main part is automatically being created
            // as part of the overall startup process.
            await this.mainPart.whenReady;
            // Only attempt to restore auxiliary editor parts
            // when the main part did restore. It is possible
            // that restoring was not attempted because specific
            // editors were opened.
            if (this.mainPart.willRestoreState) {
                const state = this.loadState();
                if (state) {
                    await this.restoreState(state);
                }
            }
            const mostRecentActivePart = (0, arrays_1.firstOrDefault)(this.mostRecentActiveParts);
            mostRecentActivePart?.activeGroup.focus();
            this._isReady = true;
            this.whenReadyPromise.complete();
            // Await restored
            await Promise.allSettled(this.parts.map(part => part.whenRestored));
            this.whenRestoredPromise.complete();
        }
        loadState() {
            return this.workspaceMemento[EditorParts_1.EDITOR_PARTS_UI_STATE_STORAGE_KEY];
        }
        saveState() {
            const state = this.createState();
            if (state.auxiliary.length === 0) {
                delete this.workspaceMemento[EditorParts_1.EDITOR_PARTS_UI_STATE_STORAGE_KEY];
            }
            else {
                this.workspaceMemento[EditorParts_1.EDITOR_PARTS_UI_STATE_STORAGE_KEY] = state;
            }
        }
        createState() {
            return {
                auxiliary: this.parts.filter(part => part !== this.mainPart).map(part => {
                    const auxiliaryWindow = this.auxiliaryWindowService.getWindow(part.windowId);
                    return {
                        state: part.createState(),
                        ...auxiliaryWindow?.createState()
                    };
                }),
                mru: this.mostRecentActiveParts.map(part => this.parts.indexOf(part))
            };
        }
        async restoreState(state) {
            if (state.auxiliary.length) {
                const auxiliaryEditorPartPromises = [];
                // Create auxiliary editor parts
                for (const auxiliaryEditorPartState of state.auxiliary) {
                    auxiliaryEditorPartPromises.push(this.createAuxiliaryEditorPart(auxiliaryEditorPartState));
                }
                // Await creation
                await Promise.allSettled(auxiliaryEditorPartPromises);
                // Update MRU list
                if (state.mru.length === this.parts.length) {
                    this.mostRecentActiveParts = state.mru.map(index => this.parts[index]);
                }
                else {
                    this.mostRecentActiveParts = [...this.parts];
                }
                // Await ready
                await Promise.allSettled(this.parts.map(part => part.whenReady));
            }
        }
        get hasRestorableState() {
            return this.parts.some(part => part.hasRestorableState);
        }
        onDidChangeMementoState(e) {
            if (e.external && e.scope === 1 /* StorageScope.WORKSPACE */) {
                this.reloadMemento(e.scope);
                const state = this.loadState();
                if (state) {
                    this.applyState(state);
                }
            }
        }
        async applyState(state) {
            // Before closing windows, try to close as many editors as
            // possible, but skip over those that would trigger a dialog
            // (for example when being dirty). This is to be able to have
            // them merge into the main part.
            for (const part of this.parts) {
                if (part === this.mainPart) {
                    continue; // main part takes care on its own
                }
                for (const group of part.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                    await group.closeAllEditors({ excludeConfirming: true });
                }
                const closed = part.close(); // will move remaining editors to main part
                if (!closed) {
                    return false; // this indicates that closing was vetoed
                }
            }
            // Restore auxiliary state unless we are in an empty state
            if (state !== 'empty') {
                await this.restoreState(state);
            }
            return true;
        }
        //#endregion
        //#region Working Sets
        static { this.EDITOR_WORKING_SETS_STORAGE_KEY = 'editor.workingSets'; }
        saveWorkingSet(name) {
            const workingSet = {
                id: (0, uuid_1.generateUuid)(),
                name,
                main: this.mainPart.createState(),
                auxiliary: this.createState()
            };
            this.editorWorkingSets.push(workingSet);
            this.saveWorkingSets();
            return {
                id: workingSet.id,
                name: workingSet.name
            };
        }
        getWorkingSets() {
            return this.editorWorkingSets.map(workingSet => ({ id: workingSet.id, name: workingSet.name }));
        }
        deleteWorkingSet(workingSet) {
            const index = this.indexOfWorkingSet(workingSet);
            if (typeof index === 'number') {
                this.editorWorkingSets.splice(index, 1);
                this.saveWorkingSets();
            }
        }
        async applyWorkingSet(workingSet) {
            let workingSetState;
            if (workingSet === 'empty') {
                workingSetState = 'empty';
            }
            else {
                workingSetState = this.editorWorkingSets[this.indexOfWorkingSet(workingSet) ?? -1];
            }
            if (!workingSetState) {
                return false;
            }
            // Apply state: begin with auxiliary windows first because it helps to keep
            // editors around that need confirmation by moving them into the main part.
            // Also, in rare cases, the auxiliary part may not be able to apply the state
            // for certain editors that cannot move to the main part.
            const applied = await this.applyState(workingSetState === 'empty' ? workingSetState : workingSetState.auxiliary);
            if (!applied) {
                return false;
            }
            await this.mainPart.applyState(workingSetState === 'empty' ? workingSetState : workingSetState.main);
            // Restore Focus
            const mostRecentActivePart = (0, arrays_1.firstOrDefault)(this.mostRecentActiveParts);
            if (mostRecentActivePart) {
                await mostRecentActivePart.whenReady;
                mostRecentActivePart.activeGroup.focus();
            }
            return true;
        }
        indexOfWorkingSet(workingSet) {
            for (let i = 0; i < this.editorWorkingSets.length; i++) {
                if (this.editorWorkingSets[i].id === workingSet.id) {
                    return i;
                }
            }
            return undefined;
        }
        saveWorkingSets() {
            this.storageService.store(EditorParts_1.EDITOR_WORKING_SETS_STORAGE_KEY, JSON.stringify(this.editorWorkingSets), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        //#endregion
        //#region Editor Groups Service
        get activeGroup() {
            return this.activePart.activeGroup;
        }
        get sideGroup() {
            return this.activePart.sideGroup;
        }
        get groups() {
            return this.getGroups();
        }
        get count() {
            return this.groups.length;
        }
        getGroups(order = 0 /* GroupsOrder.CREATION_TIME */) {
            if (this._parts.size > 1) {
                let parts;
                switch (order) {
                    case 2 /* GroupsOrder.GRID_APPEARANCE */: // we currently do not have a way to compute by appearance over multiple windows
                    case 0 /* GroupsOrder.CREATION_TIME */:
                        parts = this.parts;
                        break;
                    case 1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */:
                        parts = (0, arrays_1.distinct)([...this.mostRecentActiveParts, ...this.parts]); // always ensure all parts are included
                        break;
                }
                return parts.map(part => part.getGroups(order)).flat();
            }
            return this.mainPart.getGroups(order);
        }
        getGroup(identifier) {
            if (this._parts.size > 1) {
                for (const part of this._parts) {
                    const group = part.getGroup(identifier);
                    if (group) {
                        return group;
                    }
                }
            }
            return this.mainPart.getGroup(identifier);
        }
        assertGroupView(group) {
            let groupView;
            if (typeof group === 'number') {
                groupView = this.getGroup(group);
            }
            else {
                groupView = group;
            }
            if (!groupView) {
                throw new Error('Invalid editor group provided!');
            }
            return groupView;
        }
        activateGroup(group) {
            return this.getPart(group).activateGroup(group);
        }
        getSize(group) {
            return this.getPart(group).getSize(group);
        }
        setSize(group, size) {
            this.getPart(group).setSize(group, size);
        }
        arrangeGroups(arrangement, group = this.activePart.activeGroup) {
            this.getPart(group).arrangeGroups(arrangement, group);
        }
        toggleMaximizeGroup(group = this.activePart.activeGroup) {
            this.getPart(group).toggleMaximizeGroup(group);
        }
        toggleExpandGroup(group = this.activePart.activeGroup) {
            this.getPart(group).toggleExpandGroup(group);
        }
        restoreGroup(group) {
            return this.getPart(group).restoreGroup(group);
        }
        applyLayout(layout) {
            this.activePart.applyLayout(layout);
        }
        getLayout() {
            return this.activePart.getLayout();
        }
        get orientation() {
            return this.activePart.orientation;
        }
        setGroupOrientation(orientation) {
            this.activePart.setGroupOrientation(orientation);
        }
        findGroup(scope, source = this.activeGroup, wrap) {
            const sourcePart = this.getPart(source);
            if (this._parts.size > 1) {
                const groups = this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
                // Ensure that FIRST/LAST dispatches globally over all parts
                if (scope.location === 0 /* GroupLocation.FIRST */ || scope.location === 1 /* GroupLocation.LAST */) {
                    return scope.location === 0 /* GroupLocation.FIRST */ ? groups[0] : groups[groups.length - 1];
                }
                // Try to find in target part first without wrapping
                const group = sourcePart.findGroup(scope, source, false);
                if (group) {
                    return group;
                }
                // Ensure that NEXT/PREVIOUS dispatches globally over all parts
                if (scope.location === 2 /* GroupLocation.NEXT */ || scope.location === 3 /* GroupLocation.PREVIOUS */) {
                    const sourceGroup = this.assertGroupView(source);
                    const index = groups.indexOf(sourceGroup);
                    if (scope.location === 2 /* GroupLocation.NEXT */) {
                        let nextGroup = groups[index + 1];
                        if (!nextGroup && wrap) {
                            nextGroup = groups[0];
                        }
                        return nextGroup;
                    }
                    else {
                        let previousGroup = groups[index - 1];
                        if (!previousGroup && wrap) {
                            previousGroup = groups[groups.length - 1];
                        }
                        return previousGroup;
                    }
                }
            }
            return sourcePart.findGroup(scope, source, wrap);
        }
        addGroup(location, direction) {
            return this.getPart(location).addGroup(location, direction);
        }
        removeGroup(group) {
            this.getPart(group).removeGroup(group);
        }
        moveGroup(group, location, direction) {
            return this.getPart(group).moveGroup(group, location, direction);
        }
        mergeGroup(group, target, options) {
            return this.getPart(group).mergeGroup(group, target, options);
        }
        mergeAllGroups(target) {
            return this.activePart.mergeAllGroups(target);
        }
        copyGroup(group, location, direction) {
            return this.getPart(group).copyGroup(group, location, direction);
        }
        createEditorDropTarget(container, delegate) {
            return this.getPart(container).createEditorDropTarget(container, delegate);
        }
        //#endregion
        //#region Main Editor Part Only
        get partOptions() { return this.mainPart.partOptions; }
        get onDidChangeEditorPartOptions() { return this.mainPart.onDidChangeEditorPartOptions; }
    };
    exports.EditorParts = EditorParts;
    exports.EditorParts = EditorParts = EditorParts_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, storage_1.IStorageService),
        __param(2, themeService_1.IThemeService),
        __param(3, auxiliaryWindowService_1.IAuxiliaryWindowService)
    ], EditorParts);
    (0, extensions_1.registerSingleton)(editorGroupsService_1.IEditorGroupsService, EditorParts, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFydHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yUGFydHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1DekYsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLHVCQUE0Qjs7UUFRNUQsWUFDd0Isb0JBQTRELEVBQ2xFLGNBQWdELEVBQ2xELFlBQTJCLEVBQ2pCLHNCQUFnRTtZQUV6RixLQUFLLENBQUMsdUJBQXVCLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBTHJCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBRXZCLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFSakYsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztZQUV4RCwwQkFBcUIsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQXdCaEQsZ0NBQWdDO1lBRWYsb0NBQStCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBbUMsQ0FBQyxDQUFDO1lBQ3pHLG1DQUE4QixHQUFHLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxLQUFLLENBQUM7WUF3SHBFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxVQUFVLDREQUE0QyxDQUFDO1lBRXhGLGFBQVEsR0FBRyxLQUFLLENBQUM7WUFHUixxQkFBZ0IsR0FBRyxJQUFJLHVCQUFlLEVBQVEsQ0FBQztZQUN2RCxjQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUU1Qix3QkFBbUIsR0FBRyxJQUFJLHVC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