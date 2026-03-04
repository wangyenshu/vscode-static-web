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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/history/common/history", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/search/common/search", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/layout/browser/layoutService", "vs/platform/contextkey/common/contextkey", "vs/base/common/arrays", "vs/platform/instantiation/common/extensions", "vs/base/browser/dom", "vs/platform/workspaces/common/workspaces", "vs/base/common/network", "vs/base/common/errors", "vs/workbench/common/resources", "vs/workbench/services/path/common/pathService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/base/browser/window"], function (require, exports, nls_1, uri_1, editor_1, editorService_1, history_1, files_1, workspace_1, lifecycle_1, storage_1, event_1, configuration_1, editorGroupsService_1, search_1, instantiation_1, layoutService_1, contextkey_1, arrays_1, extensions_1, dom_1, workspaces_1, network_1, errors_1, resources_1, pathService_1, uriIdentity_1, lifecycle_2, log_1, window_1) {
    "use strict";
    var HistoryService_1, EditorNavigationStack_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorNavigationStack = exports.HistoryService = void 0;
    let HistoryService = class HistoryService extends lifecycle_1.Disposable {
        static { HistoryService_1 = this; }
        static { this.MOUSE_NAVIGATION_SETTING = 'workbench.editor.mouseBackForwardToNavigate'; }
        static { this.NAVIGATION_SCOPE_SETTING = 'workbench.editor.navigationScope'; }
        constructor(editorService, editorGroupService, contextService, storageService, configurationService, fileService, workspacesService, instantiationService, layoutService, contextKeyService, logService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.contextService = contextService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.workspacesService = workspacesService;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.contextKeyService = contextKeyService;
            this.logService = logService;
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.lastActiveEditor = undefined;
            this.editorHelper = this.instantiationService.createInstance(EditorHelper);
            //#region History Context Keys
            this.canNavigateBackContextKey = (new contextkey_1.RawContextKey('canNavigateBack', false, (0, nls_1.localize)('canNavigateBack', "Whether it is possible to navigate back in editor history"))).bindTo(this.contextKeyService);
            this.canNavigateForwardContextKey = (new contextkey_1.RawContextKey('canNavigateForward', false, (0, nls_1.localize)('canNavigateForward', "Whether it is possible to navigate forward in editor history"))).bindTo(this.contextKeyService);
            this.canNavigateBackInNavigationsContextKey = (new contextkey_1.RawContextKey('canNavigateBackInNavigationLocations', false, (0, nls_1.localize)('canNavigateBackInNavigationLocations', "Whether it is possible to navigate back in editor navigation locations history"))).bindTo(this.contextKeyService);
            this.canNavigateForwardInNavigationsContextKey = (new contextkey_1.RawContextKey('canNavigateForwardInNavigationLocations', false, (0, nls_1.localize)('canNavigateForwardInNavigationLocations', "Whether it is possible to navigate forward in editor navigation locations history"))).bindTo(this.contextKeyService);
            this.canNavigateToLastNavigationLocationContextKey = (new contextkey_1.RawContextKey('canNavigateToLastNavigationLocation', false, (0, nls_1.localize)('canNavigateToLastNavigationLocation', "Whether it is possible to navigate to the last editor navigation location"))).bindTo(this.contextKeyService);
            this.canNavigateBackInEditsContextKey = (new contextkey_1.RawContextKey('canNavigateBackInEditLocations', false, (0, nls_1.localize)('canNavigateBackInEditLocations', "Whether it is possible to navigate back in editor edit locations history"))).bindTo(this.contextKeyService);
            this.canNavigateForwardInEditsContextKey = (new contextkey_1.RawContextKey('canNavigateForwardInEditLocations', false, (0, nls_1.localize)('canNavigateForwardInEditLocations', "Whether it is possible to navigate forward in editor edit locations history"))).bindTo(this.contextKeyService);
            this.canNavigateToLastEditLocationContextKey = (new contextkey_1.RawContextKey('canNavigateToLastEditLocation', false, (0, nls_1.localize)('canNavigateToLastEditLocation', "Whether it is possible to navigate to the last editor edit location"))).bindTo(this.contextKeyService);
            this.canReopenClosedEditorContextKey = (new contextkey_1.RawContextKey('canReopenClosedEditor', false, (0, nls_1.localize)('canReopenClosedEditor', "Whether it is possible to reopen the last closed editor"))).bindTo(this.contextKeyService);
            //#endregion
            //#region Editor History Navigation (limit: 50)
            this._onDidChangeEditorNavigationStack = this._register(new event_1.Emitter());
            this.onDidChangeEditorNavigationStack = this._onDidChangeEditorNavigationStack.event;
            this.defaultScopedEditorNavigationStack = undefined;
            this.editorGroupScopedNavigationStacks = new Map();
            this.editorScopedNavigationStacks = new Map();
            this.editorNavigationScope = 0 /* GoScope.DEFAULT */;
            //#endregion
            //#region Navigation: Next/Previous Used Editor
            this.recentlyUsedEditorsStack = undefined;
            this.recentlyUsedEditorsStackIndex = 0;
            this.recentlyUsedEditorsInGroupStack = undefined;
            this.recentlyUsedEditorsInGroupStackIndex = 0;
            this.navigatingInRecentlyUsedEditorsStack = false;
            this.navigatingInRecentlyUsedEditorsInGroupStack = false;
            this.recentlyClosedEditors = [];
            this.ignoreEditorCloseEvent = false;
            this.history = undefined;
            this.editorHistoryListeners = new Map();
            this.resourceExcludeMatcher = this._register(new dom_1.WindowIdleValue(window_1.mainWindow, () => {
                const matcher = this._register(this.instantiationService.createInstance(resources_1.ResourceGlobMatcher, root => (0, search_1.getExcludes)(root ? this.configurationService.getValue({ resource: root }) : this.configurationService.getValue()) || Object.create(null), event => event.affectsConfiguration(files_1.FILES_EXCLUDE_CONFIG) || event.affectsConfiguration(search_1.SEARCH_EXCLUDE_CONFIG)));
                this._register(matcher.onExpressionChange(() => this.removeExcludedFromHistory()));
                return matcher;
            }));
            this.registerListeners();
            // if the service is created late enough that an editor is already opened
            // make sure to trigger the onActiveEditorChanged() to track the editor
            // properly (fixes https://github.com/microsoft/vscode/issues/59908)
            if (this.editorService.activeEditorPane) {
                this.onDidActiveEditorChange();
            }
        }
        registerListeners() {
            // Mouse back/forward support
            this.registerMouseNavigationListener();
            // Editor changes
            this._register(this.editorService.onDidActiveEditorChange(() => this.onDidActiveEditorChange()));
            this._register(this.editorService.onDidOpenEditorFail(event => this.remove(event.editor)));
            this._register(this.editorService.onDidCloseEditor(event => this.onDidCloseEditor(event)));
            this._register(this.editorService.onDidMostRecentlyActiveEditorsChange(() => this.handleEditorEventInRecentEditorsStack()));
            // Editor group changes
            this._register(this.editorGroupService.onDidRemoveGroup(e => this.onDidRemoveGroup(e)));
            // File changes
            this._register(this.fileService.onDidFilesChange(event => this.onDidFilesChange(event)));
            this._register(this.fileService.onDidRunOperation(event => this.onDidFilesChange(event)));
            // Storage
            this._register(this.storageService.onWillSaveState(() => this.saveState()));
            // Configuration
            this.registerEditorNavigationScopeChangeListener();
            // Context keys
            this._register(this.onDidChangeEditorNavigationStack(() => this.updateContextKeys()));
            this._register(this.editorGroupService.onDidChangeActiveGroup(() => this.updateContextKeys()));
        }
        onDidCloseEditor(e) {
            this.handleEditorCloseEventInHistory(e);
            this.handleEditorCloseEventInReopen(e);
        }
        registerMouseNavigationListener() {
            const mouseBackForwardSupportListener = this._register(new lifecycle_1.DisposableStore());
            const handleMouseBackForwardSupport = () => {
                mouseBackForwardSupportListener.clear();
                if (this.configurationService.getValue(HistoryService_1.MOUSE_NAVIGATION_SETTING)) {
                    this._register(event_1.Event.runAndSubscribe(this.layoutService.onDidAddContainer, ({ container, disposables }) => {
                        const eventDisposables = disposables.add(new lifecycle_1.DisposableStore());
                        eventDisposables.add((0, dom_1.addDisposableListener)(container, dom_1.EventType.MOUSE_DOWN, e => this.onMouseDownOrUp(e, true)));
                        eventDisposables.add((0, dom_1.addDisposableListener)(container, dom_1.EventType.MOUSE_UP, e => this.onMouseDownOrUp(e, false)));
                        mouseBackForwardSupportListener.add(eventDisposables);
                    }, { container: this.layoutService.mainContainer, disposables: this._store }));
                }
            };
            this._register(this.configurationService.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration(HistoryService_1.MOUSE_NAVIGATION_SETTING)) {
                    handleMouseBackForwardSupport();
                }
            }));
            handleMouseBackForwardSupport();
        }
        onMouseDownOrUp(event, isMouseDown) {
            // Support to navigate in history when mouse buttons 4/5 are pressed
            // We want to trigger this on mouse down for a faster experience
            // but we also need to prevent mouse up from triggering the default
            // which is to navigate in the browser history.
            switch (event.button) {
                case 3:
                    dom_1.EventHelper.stop(event);
                    if (isMouseDown) {
                        this.goBack();
                    }
                    break;
                case 4:
                    dom_1.EventHelper.stop(event);
                    if (isMouseDown) {
                        this.goForward();
                    }
                    break;
            }
        }
        onDidRemoveGroup(group) {
            this.handleEditorGroupRemoveInNavigationStacks(group);
        }
        onDidActiveEditorChange() {
            const activeEditorGroup = this.editorGroupService.activeGroup;
            const activeEditorPane = activeEditorGroup.activeEditorPane;
            if (this.lastActiveEditor && this.editorHelper.matchesEditorIdentifier(this.lastActiveEditor, activeEditorPane)) {
                return; // return if the active editor is still the same
            }
            // Remember as last active editor (can be undefined if none opened)
            this.lastActiveEditor = activeEditorPane?.input ? { editor: activeEditorPane.input, groupId: activeEditorPane.group.id } : undefined;
            // Dispose old listeners
            this.activeEditorListeners.clear();
            // Handle editor change unless the editor is transient
            if (!activeEditorPane?.group.isTransient(activeEditorPane.input)) {
                this.handleActiveEditorChange(activeEditorGroup, activeEditorPane);
            }
            else {
                this.logService.trace(`[History]: ignoring transient editor change (editor: ${activeEditorPane.input?.resource?.toString()}})`);
            }
            // Listen to selection changes unless the editor is transient
            if ((0, editor_1.isEditorPaneWithSelection)(activeEditorPane)) {
                this.activeEditorListeners.add(activeEditorPane.onDidChangeSelection(e => {
                    if (!activeEditorPane.group.isTransient(activeEditorPane.input)) {
                        this.handleActiveEditorSelectionChangeEvent(activeEditorGroup, activeEditorPane, e);
                    }
                    else {
                        this.logService.trace(`[History]: ignoring transient editor selection change (editor: ${activeEditorPane.input?.resource?.toString()}})`);
                    }
                }));
            }
            // Context keys
            this.updateContextKeys();
        }
        onDidFilesChange(event) {
            // External file changes (watcher)
            if (event instanceof files_1.FileChangesEvent) {
                if (event.gotDeleted()) {
                    this.remove(event);
                }
            }
            // Internal file changes (e.g. explorer)
            else {
                // Delete
                if (event.isOperation(1 /* FileOperation.DELETE */)) {
                    this.remove(event);
                }
                // Move
                else if (event.isOperation(2 /* FileOperation.MOVE */) && event.target.isFile) {
                    this.move(event);
                }
            }
        }
        handleActiveEditorChange(group, editorPane) {
            this.handleActiveEditorChangeInHistory(editorPane);
            this.handleActiveEditorChangeInNavigationStacks(group, editorPane);
        }
        handleActiveEditorSelectionChangeEvent(group, editorPane, event) {
            this.handleActiveEditorSelectionChangeInNavigationStacks(group, editorPane, event);
        }
        move(event) {
            this.moveInHistory(event);
            this.moveInEditorNavigationStacks(event);
        }
        remove(arg1) {
            this.removeFromHistory(arg1);
            this.removeFromEditorNavigationStacks(arg1);
            this.removeFromRecentlyClosedEditors(arg1);
            this.removeFromRecentlyOpened(arg1);
        }
        removeFromRecentlyOpened(arg1) {
            let resource = undefined;
            if ((0, editor_1.isEditorInput)(arg1)) {
                resource = editor_1.EditorResourceAccessor.getOriginalUri(arg1);
            }
            else if (arg1 instanceof files_1.FileChangesEvent) {
                // Ignore for now (recently opened are most often out of workspace files anyway for which there are no file events)
            }
            else {
                resource = arg1.resource;
            }
            if (resource) {
                this.workspacesService.removeRecentlyOpened([resource]);
            }
        }
        clear() {
            // History
            this.clearRecentlyOpened();
            // Navigation (next, previous)
            this.clearEditorNavigationStacks();
            // Recently closed editors
            this.recentlyClosedEditors = [];
            // Context Keys
            this.updateContextKeys();
        }
        updateContextKeys() {
            this.contextKeyService.bufferChangeEvents(() => {
                const activeStack = this.getStack();
                this.canNavigateBackContextKey.set(activeStack.canGoBack(0 /* GoFilter.NONE */));
                this.canNavigateForwardContextKey.set(activeStack.canGoForward(0 /* GoFilter.NONE */));
                this.canNavigateBackInNavigationsContextKey.set(activeStack.canGoBack(2 /* GoFilter.NAVIGATION */));
                this.canNavigateForwardInNavigationsContextKey.set(activeStack.canGoForward(2 /* GoFilter.NAVIGATION */));
                this.canNavigateToLastNavigationLocationContextKey.set(activeStack.canGoLast(2 /* GoFilter.NAVIGATION */));
                this.canNavigateBackInEditsContextKey.set(activeStack.canGoBack(1 /* GoFilter.EDITS */));
                this.canNavigateForwardInEditsContextKey.set(activeStack.canGoForward(1 /* GoFilter.EDITS */));
                this.canNavigateToLastEditLocationContextKey.set(activeStack.canGoLast(1 /* GoFilter.EDITS */));
                this.canReopenClosedEditorContextKey.set(this.recentlyClosedEditors.length > 0);
            });
        }
        registerEditorNavigationScopeChangeListener() {
            const handleEditorNavigationScopeChange = () => {
                // Ensure to start fresh when setting changes
                this.disposeEditorNavigationStacks();
                // Update scope
                const configuredScope = this.configurationService.getValue(HistoryService_1.NAVIGATION_SCOPE_SETTING);
                if (configuredScope === 'editorGroup') {
                    this.editorNavigationScope = 1 /* GoScope.EDITOR_GROUP */;
                }
                else if (configuredScope === 'editor') {
                    this.editorNavigationScope = 2 /* GoScope.EDITOR */;
                }
                else {
                    this.editorNavigationScope = 0 /* GoScope.DEFAULT */;
                }
            };
            this._register(this.configurationService.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration(HistoryService_1.NAVIGATION_SCOPE_SETTING)) {
                    handleEditorNavigationScopeChange();
                }
            }));
            handleEditorNavigationScopeChange();
        }
        getStack(group = this.editorGroupService.activeGroup, editor = group.activeEditor) {
            switch (this.editorNavigationScope) {
                // Per Editor
                case 2 /* GoScope.EDITOR */: {
                    if (!editor) {
                        return new NoOpEditorNavigationStacks();
                    }
                    let stacksForGroup = this.editorScopedNavigationStacks.get(group.id);
                    if (!stacksForGroup) {
                        stacksForGroup = new Map();
                        this.editorScopedNavigationStacks.set(group.id, stacksForGroup);
                    }
                    let stack = stacksForGroup.get(editor)?.stack;
                    if (!stack) {
                        const disposable = new lifecycle_1.DisposableStore();
                        stack = disposable.add(this.instantiationService.createInstance(EditorNavigationStacks, 2 /* GoScope.EDITOR */));
                        disposable.add(stack.onDidChange(() => this._onDidChangeEditorNavigationStack.fire()));
                        stacksForGroup.set(editor, { stack, disposable });
                    }
                    return stack;
                }
                // Per Editor Group
                case 1 /* GoScope.EDITOR_GROUP */: {
                    let stack = this.editorGroupScopedNavigationStacks.get(group.id)?.stack;
                    if (!stack) {
                        const disposable = new lifecycle_1.DisposableStore();
                        stack = disposable.add(this.instantiationService.createInstance(EditorNavigationStacks, 1 /* GoScope.EDITOR_GROUP */));
                        disposable.add(stack.onDidChange(() => this._onDidChangeEditorNavigationStack.fire()));
                        this.editorGroupScopedNavigationStacks.set(group.id, { stack, disposable });
                    }
                    return stack;
                }
                // Global
                case 0 /* GoScope.DEFAULT */: {
                    if (!this.defaultScopedEditorNavigationStack) {
                        this.defaultScopedEditorNavigationStack = this._register(this.instantiationService.createInstance(EditorNavigationStacks, 0 /* GoScope.DEFAULT */));
                        this._register(this.defaultScopedEditorNavigationStack.onDidChange(() => this._onDidChangeEditorNavigationStack.fire()));
                    }
                    return this.defaultScopedEditorNavigationStack;
                }
            }
        }
        goForward(filter) {
            return this.getStack().goForward(filter);
        }
        goBack(filter) {
            return this.getStack().goBack(filter);
        }
        goPrevious(filter) {
            return this.getStack().goPrevious(filter);
        }
        goLast(filter) {
            return this.getStack().goLast(filter);
        }
        handleActiveEditorChangeInNavigationStacks(group, editorPane) {
            this.getStack(group, editorPane?.input).handleActiveEditorChange(editorPane);
        }
        handleActiveEditorSelectionChangeInNavigationStacks(group, editorPane, event) {
            this.getStack(group, editorPane.input).handleActiveEditorSelectionChange(editorPane, event);
        }
        handleEditorCloseEventInHistory(e) {
            const editors = this.editorScopedNavigationStacks.get(e.groupId);
            if (editors) {
                const editorStack = editors.get(e.editor);
                if (editorStack) {
                    editorStack.disposable.dispose();
                    editors.delete(e.editor);
                }
                if (editors.size === 0) {
                    this.editorScopedNavigationStacks.delete(e.groupId);
                }
            }
        }
        handleEditorGroupRemoveInNavigationStacks(group) {
            // Global
            this.defaultScopedEditorNavigationStack?.remove(group.id);
            // Editor groups
            const editorGroupStack = this.editorGroupScopedNavigationStacks.get(group.id);
            if (editorGroupStack) {
                editorGroupStack.disposable.dispose();
                this.editorGroupScopedNavigationStacks.delete(group.id);
            }
        }
        clearEditorNavigationStacks() {
            this.withEachEditorNavigationStack(stack => stack.clear());
        }
        removeFromEditorNavigationStacks(arg1) {
            this.withEachEditorNavigationStack(stack => stack.remove(arg1));
        }
        moveInEditorNavigationStacks(event) {
            this.withEachEditorNavigationStack(stack => stack.move(event));
        }
        withEachEditorNavigationStack(fn) {
            // Global
            if (this.defaultScopedEditorNavigationStack) {
                fn(this.defaultScopedEditorNavigationStack);
            }
            // Per editor group
            for (const [, entry] of this.editorGroupScopedNavigationStacks) {
                fn(entry.stack);
            }
            // Per editor
            for (const [, entries] of this.editorScopedNavigationStacks) {
                for (const [, entry] of entries) {
                    fn(entry.stack);
                }
            }
        }
        disposeEditorNavigationStacks() {
            // Global
            this.defaultScopedEditorNavigationStack?.dispose();
            this.defaultScopedEditorNavigationStack = undefined;
            // Per Editor group
            for (const [, stack] of this.editorGroupScopedNavigationStacks) {
                stack.disposable.dispose();
            }
            this.editorGroupScopedNavigationStacks.clear();
            // Per Editor
            for (const [, stacks] of this.editorScopedNavigationStacks) {
                for (const [, stack] of stacks) {
                    stack.disposable.dispose();
                }
            }
            this.editorScopedNavigationStacks.clear();
        }
        openNextRecentlyUsedEditor(groupId) {
            const [stack, index] = this.ensureRecentlyUsedStack(index => index - 1, groupId);
            return this.doNavigateInRecentlyUsedEditorsStack(stack[index], groupId);
        }
        openPreviouslyUsedEditor(groupId) {
            const [stack, index] = this.ensureRecentlyUsedStack(index => index + 1, groupId);
            return this.doNavigateInRecentlyUsedEditorsStack(stack[index], groupId);
        }
        async doNavigateInRecentlyUsedEditorsStack(editorIdentifier, groupId) {
            if (editorIdentifier) {
                const acrossGroups = typeof groupId !== 'number' || !this.editorGroupService.getGroup(groupId);
                if (acrossGroups) {
                    this.navigatingInRecentlyUsedEditorsStack = true;
                }
                else {
                    this.navigatingInRecentlyUsedEditorsInGroupStack = true;
                }
                const group = this.editorGroupService.getGroup(editorIdentifier.groupId) ?? this.editorGroupService.activeGroup;
                try {
                    await group.openEditor(editorIdentifier.editor);
                }
                finally {
                    if (acrossGroups) {
                        this.navigatingInRecentlyUsedEditorsStack = false;
                    }
                    else {
                        this.navigatingInRecentlyUsedEditorsInGroupStack = false;
                    }
                }
            }
        }
        ensureRecentlyUsedStack(indexModifier, groupId) {
            let editors;
            let index;
            const group = typeof groupId === 'number' ? this.editorGroupService.getGroup(groupId) : undefined;
            // Across groups
            if (!group) {
                editors = this.recentlyUsedEditorsStack || this.editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
                index = this.recentlyUsedEditorsStackIndex;
            }
            // Within group
            else {
                editors = this.recentlyUsedEditorsInGroupStack || group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).map(editor => ({ groupId: group.id, editor }));
                index = this.recentlyUsedEditorsInGroupStackIndex;
            }
            // Adjust index
            let newIndex = indexModifier(index);
            if (newIndex < 0) {
                newIndex = 0;
            }
            else if (newIndex > editors.length - 1) {
                newIndex = editors.length - 1;
            }
            // Remember index and editors
            if (!group) {
                this.recentlyUsedEditorsStack = editors;
                this.recentlyUsedEditorsStackIndex = newIndex;
            }
            else {
                this.recentlyUsedEditorsInGroupStack = editors;
                this.recentlyUsedEditorsInGroupStackIndex = newIndex;
            }
            return [editors, newIndex];
        }
        handleEditorEventInRecentEditorsStack() {
            // Drop all-editors stack unless navigating in all editors
            if (!this.navigatingInRecentlyUsedEditorsStack) {
                this.recentlyUsedEditorsStack = undefined;
                this.recentlyUsedEditorsStackIndex = 0;
            }
            // Drop in-group-editors stack unless navigating in group
            if (!this.navigatingInRecentlyUsedEditorsInGroupStack) {
                this.recentlyUsedEditorsInGroupStack = undefined;
                this.recentlyUsedEditorsInGroupStackIndex = 0;
            }
        }
        //#endregion
        //#region File: Reopen Closed Editor (limit: 20)
        static { this.MAX_RECENTLY_CLOSED_EDITORS = 20; }
        handleEditorCloseEventInReopen(event) {
            if (this.ignoreEditorCloseEvent) {
                return; // blocked
            }
            const { editor, context } = event;
            if (context === editor_1.EditorCloseContext.REPLACE || context === editor_1.EditorCloseContext.MOVE) {
                return; // ignore if editor was replaced or moved
            }
            const untypedEditor = editor.toUntyped();
            if (!untypedEditor) {
                return; // we need a untyped editor to restore from going forward
            }
            const associatedResources = [];
            const editorResource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH });
            if (uri_1.URI.isUri(editorResource)) {
                associatedResources.push(editorResource);
            }
            else if (editorResource) {
                associatedResources.push(...(0, arrays_1.coalesce)([editorResource.primary, editorResource.secondary]));
            }
            // Remove from list of recently closed before...
            this.removeFromRecentlyClosedEditors(editor);
            // ...adding it as last recently closed
            this.recentlyClosedEditors.push({
                editorId: editor.editorId,
                editor: untypedEditor,
                resource: editor_1.EditorResourceAccessor.getOriginalUri(editor),
                associatedResources,
                index: event.index,
                sticky: event.sticky
            });
            // Bounding
            if (this.recentlyClosedEditors.length > HistoryService_1.MAX_RECENTLY_CLOSED_EDITORS) {
                this.recentlyClosedEditors.shift();
            }
            // Context
            this.canReopenClosedEditorContextKey.set(true);
        }
        async reopenLastClosedEditor() {
            // Open editor if we have one
            const lastClosedEditor = this.recentlyClosedEditors.pop();
            let reopenClosedEditorPromise = undefined;
            if (lastClosedEditor) {
                reopenClosedEditorPromise = this.doReopenLastClosedEditor(lastClosedEditor);
            }
            // Update context
            this.canReopenClosedEditorContextKey.set(this.recentlyClosedEditors.length > 0);
            return reopenClosedEditorPromise;
        }
        async doReopenLastClosedEditor(lastClosedEditor) {
            const options = { pinned: true, sticky: lastClosedEditor.sticky, index: lastClosedEditor.index, ignoreError: true };
            // Special sticky handling: remove the index property from options
            // if that would result in sticky state to not preserve or apply
            // wrongly.
            if ((lastClosedEditor.sticky && !this.editorGroupService.activeGroup.isSticky(lastClosedEditor.index)) ||
                (!lastClosedEditor.sticky && this.editorGroupService.activeGroup.isSticky(lastClosedEditor.index))) {
                options.index = undefined;
            }
            // Re-open editor unless already opened
            let editorPane = undefined;
            if (!this.editorGroupService.activeGroup.contains(lastClosedEditor.editor)) {
                // Fix for https://github.com/microsoft/vscode/issues/107850
                // If opening an editor fails, it is possible that we get
                // another editor-close event as a result. But we really do
                // want to ignore that in our list of recently closed editors
                //  to prevent endless loops.
                this.ignoreEditorCloseEvent = true;
                try {
                    editorPane = await this.editorService.openEditor({
                        ...lastClosedEditor.editor,
                        options: {
                            ...lastClosedEditor.editor.options,
                            ...options
                        }
                    });
                }
                finally {
                    this.ignoreEditorCloseEvent = false;
                }
            }
            // If no editor was opened, try with the next one
            if (!editorPane) {
                // Fix for https://github.com/microsoft/vscode/issues/67882
                // If opening of the editor fails, make sure to try the next one
                // but make sure to remove this one from the list to prevent
                // endless loops.
                (0, arrays_1.remove)(this.recentlyClosedEditors, lastClosedEditor);
                // Try with next one
                this.reopenLastClosedEditor();
            }
        }
        removeFromRecentlyClosedEditors(arg1) {
            this.recentlyClosedEditors = this.recentlyClosedEditors.filter(recentlyClosedEditor => {
                if ((0, editor_1.isEditorInput)(arg1) && recentlyClosedEditor.editorId !== arg1.editorId) {
                    return true; // keep: different editor identifiers
                }
                if (recentlyClosedEditor.resource && this.editorHelper.matchesFile(recentlyClosedEditor.resource, arg1)) {
                    return false; // remove: editor matches directly
                }
                if (recentlyClosedEditor.associatedResources.some(associatedResource => this.editorHelper.matchesFile(associatedResource, arg1))) {
                    return false; // remove: an associated resource matches
                }
                return true; // keep
            });
            // Update context
            this.canReopenClosedEditorContextKey.set(this.recentlyClosedEditors.length > 0);
        }
        //#endregion
        //#region Go to: Recently Opened Editor (limit: 200, persisted)
        static { this.MAX_HISTORY_ITEMS = 200; }
        static { this.HISTORY_STORAGE_KEY = 'history.entries'; }
        handleActiveEditorChangeInHistory(editorPane) {
            // Ensure we have not configured to exclude input and don't track invalid inputs
            const editor = editorPane?.input;
            if (!editor || editor.isDisposed() || !this.includeInHistory(editor)) {
                return;
            }
            // Remove any existing entry and add to the beginning
            this.removeFromHistory(editor);
            this.addToHistory(editor);
        }
        addToHistory(editor, insertFirst = true) {
            this.ensureHistoryLoaded(this.history);
            const historyInput = this.editorHelper.preferResourceEditorInput(editor);
            if (!historyInput) {
                return;
            }
            // Insert based on preference
            if (insertFirst) {
                this.history.unshift(historyInput);
            }
            else {
                this.history.push(historyInput);
            }
            // Respect max entries setting
            if (this.history.length > HistoryService_1.MAX_HISTORY_ITEMS) {
                this.editorHelper.clearOnEditorDispose(this.history.pop(), this.editorHistoryListeners);
            }
            // React to editor input disposing
            if ((0, editor_1.isEditorInput)(editor)) {
                this.editorHelper.onEditorDispose(editor, () => this.updateHistoryOnEditorDispose(historyInput), this.editorHistoryListeners);
            }
        }
        updateHistoryOnEditorDispose(editor) {
            if ((0, editor_1.isEditorInput)(editor)) {
                // Any non side-by-side editor input gets removed directly on dispose
                if (!(0, editor_1.isSideBySideEditorInput)(editor)) {
                    this.removeFromHistory(editor);
                }
                // Side-by-side editors get special treatment: we try to distill the
                // possibly untyped resource inputs from both sides to be able to
                // offer these entries from the history to the user still.
                else {
                    const resourceInputs = [];
                    const sideInputs = editor.primary.matches(editor.secondary) ? [editor.primary] : [editor.primary, editor.secondary];
                    for (const sideInput of sideInputs) {
                        const candidateResourceInput = this.editorHelper.preferResourceEditorInput(sideInput);
                        if ((0, editor_1.isResourceEditorInput)(candidateResourceInput)) {
                            resourceInputs.push(candidateResourceInput);
                        }
                    }
                    // Insert the untyped resource inputs where our disposed
                    // side-by-side editor input is in the history stack
                    this.replaceInHistory(editor, ...resourceInputs);
                }
            }
            else {
                // Remove any editor that should not be included in history
                if (!this.includeInHistory(editor)) {
                    this.removeFromHistory(editor);
                }
            }
        }
        includeInHistory(editor) {
            if ((0, editor_1.isEditorInput)(editor)) {
                return true; // include any non files
            }
            return !this.resourceExcludeMatcher.value.matches(editor.resource);
        }
        removeExcludedFromHistory() {
            this.ensureHistoryLoaded(this.history);
            this.history = this.history.filter(entry => {
                const include = this.includeInHistory(entry);
                // Cleanup any listeners associated with the input when removing from history
                if (!include) {
                    this.editorHelper.clearOnEditorDispose(entry, this.editorHistoryListeners);
                }
                return include;
            });
        }
        moveInHistory(event) {
            if (event.isOperation(2 /* FileOperation.MOVE */)) {
                const removed = this.removeFromHistory(event);
                if (removed) {
                    this.addToHistory({ resource: event.target.resource });
                }
            }
        }
        removeFromHistory(arg1) {
            let removed = false;
            this.ensureHistoryLoaded(this.history);
            this.history = this.history.filter(entry => {
                const matches = this.editorHelper.matchesEditor(arg1, entry);
                // Cleanup any listeners associated with the input when removing from history
                if (matches) {
                    this.editorHelper.clearOnEditorDispose(arg1, this.editorHistoryListeners);
                    removed = true;
                }
                return !matches;
            });
            return removed;
        }
        replaceInHistory(editor, ...replacements) {
            this.ensureHistoryLoaded(this.history);
            let replaced = false;
            const newHistory = [];
            for (const entry of this.history) {
                // Entry matches and is going to be disposed + replaced
                if (this.editorHelper.matchesEditor(editor, entry)) {
                    // Cleanup any listeners associated with the input when replacing from history
                    this.editorHelper.clearOnEditorDispose(editor, this.editorHistoryListeners);
                    // Insert replacements but only once
                    if (!replaced) {
                        newHistory.push(...replacements);
                        replaced = true;
                    }
                }
                // Entry does not match, but only add it if it didn't match
                // our replacements already
                else if (!replacements.some(replacement => this.editorHelper.matchesEditor(replacement, entry))) {
                    newHistory.push(entry);
                }
            }
            // If the target editor to replace was not found, make sure to
            // insert the replacements to the end to ensure we got them
            if (!replaced) {
                newHistory.push(...replacements);
            }
            this.history = newHistory;
        }
        clearRecentlyOpened() {
            this.history = [];
            for (const [, disposable] of this.editorHistoryListeners) {
                (0, lifecycle_1.dispose)(disposable);
            }
            this.editorHistoryListeners.clear();
        }
        getHistory() {
            this.ensureHistoryLoaded(this.history);
            return this.history;
        }
        ensureHistoryLoaded(history) {
            if (!this.history) {
                // Until history is loaded, it is just empty
                this.history = [];
                // We want to seed history from opened editors
                // too as well as previous stored state, so we
                // need to wait for the editor groups being ready
                if (this.editorGroupService.isReady) {
                    this.loadHistory();
                }
                else {
                    (async () => {
                        await this.editorGroupService.whenReady;
                        this.loadHistory();
                    })();
                }
            }
        }
        loadHistory() {
            // Init as empty before adding - since we are about to
            // populate the history from opened editors, we capture
            // the right order here.
            this.history = [];
            // All stored editors from previous session
            const storedEditorHistory = this.loadHistoryFromStorage();
            // All restored editors from previous session
            // in reverse editor from least to most recently
            // used.
            const openedEditorsLru = [...this.editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)].reverse();
            // We want to merge the opened editors from the last
            // session with the stored editors from the last
            // session. Because not all editors can be serialised
            // we want to make sure to include all opened editors
            // too.
            // Opened editors should always be first in the history
            const handledEditors = new Set();
            // Add all opened editors first
            for (const { editor } of openedEditorsLru) {
                if (!this.includeInHistory(editor)) {
                    continue;
                }
                // Add into history
                this.addToHistory(editor);
                // Remember as added
                if (editor.resource) {
                    handledEditors.add(`${editor.resource.toString()}/${editor.editorId}`);
                }
            }
            // Add remaining from storage if not there already
            // We check on resource and `editorId` (from `override`)
            // to figure out if the editor has been already added.
            for (const editor of storedEditorHistory) {
                if (!handledEditors.has(`${editor.resource.toString()}/${editor.options?.override}`) &&
                    this.includeInHistory(editor)) {
                    this.addToHistory(editor, false /* at the end */);
                }
            }
        }
        loadHistoryFromStorage() {
            const entries = [];
            const entriesRaw = this.storageService.get(HistoryService_1.HISTORY_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
            if (entriesRaw) {
                try {
                    const entriesParsed = JSON.parse(entriesRaw);
                    for (const entryParsed of entriesParsed) {
                        if (!entryParsed.editor || !entryParsed.editor.resource) {
                            continue; // unexpected data format
                        }
                        try {
                            entries.push({
                                ...entryParsed.editor,
                                resource: typeof entryParsed.editor.resource === 'string' ?
                                    uri_1.URI.parse(entryParsed.editor.resource) : //  from 1.67.x: URI is stored efficiently as URI.toString()
                                    uri_1.URI.from(entryParsed.editor.resource) // until 1.66.x: URI was stored very verbose as URI.toJSON()
                            });
                        }
                        catch (error) {
                            (0, errors_1.onUnexpectedError)(error); // do not fail entire history when one entry fails
                        }
                    }
                }
                catch (error) {
                    (0, errors_1.onUnexpectedError)(error); // https://github.com/microsoft/vscode/issues/99075
                }
            }
            return entries;
        }
        saveState() {
            if (!this.history) {
                return; // nothing to save because history was not used
            }
            const entries = [];
            for (const editor of this.history) {
                if ((0, editor_1.isEditorInput)(editor) || !(0, editor_1.isResourceEditorInput)(editor)) {
                    continue; // only save resource editor inputs
                }
                entries.push({
                    editor: {
                        ...editor,
                        resource: editor.resource.toString()
                    }
                });
            }
            this.storageService.store(HistoryService_1.HISTORY_STORAGE_KEY, JSON.stringify(entries), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        //#endregion
        //#region Last Active Workspace/File
        getLastActiveWorkspaceRoot(schemeFilter, authorityFilter) {
            // No Folder: return early
            const folders = this.contextService.getWorkspace().folders;
            if (folders.length === 0) {
                return undefined;
            }
            // Single Folder: return early
            if (folders.length === 1) {
                const resource = folders[0].uri;
                if ((!schemeFilter || resource.scheme === schemeFilter) && (!authorityFilter || resource.authority === authorityFilter)) {
                    return resource;
                }
                return undefined;
            }
            // Multiple folders: find the last active one
            for (const input of this.getHistory()) {
                if ((0, editor_1.isEditorInput)(input)) {
                    continue;
                }
                if (schemeFilter && input.resource.scheme !== schemeFilter) {
                    continue;
                }
                if (authorityFilter && input.resource.authority !== authorityFilter) {
                    continue;
                }
                const resourceWorkspace = this.contextService.getWorkspaceFolder(input.resource);
                if (resourceWorkspace) {
                    return resourceWorkspace.uri;
                }
            }
            // Fallback to first workspace matching scheme filter if any
            for (const folder of folders) {
                const resource = folder.uri;
                if ((!schemeFilter || resource.scheme === schemeFilter) && (!authorityFilter || resource.authority === authorityFilter)) {
                    return resource;
                }
            }
            return undefined;
        }
        getLastActiveFile(filterByScheme, filterByAuthority) {
            for (const input of this.getHistory()) {
                let resource;
                if ((0, editor_1.isEditorInput)(input)) {
                    resource = editor_1.EditorResourceAccessor.getOriginalUri(input, { filterByScheme });
                }
                else {
                    resource = input.resource;
                }
                if (resource && resource.scheme === filterByScheme && (!filterByAuthority || resource.authority === filterByAuthority)) {
                    return resource;
                }
            }
            return undefined;
        }
        //#endregion
        dispose() {
            super.dispose();
            for (const [, stack] of this.editorGroupScopedNavigationStacks) {
                stack.disposable.dispose();
            }
            for (const [, editors] of this.editorScopedNavigationStacks) {
                for (const [, stack] of editors) {
                    stack.disposable.dispose();
                }
            }
            for (const [, listener] of this.editorHistoryListeners) {
                listener.dispose();
            }
        }
    };
    exports.HistoryService = HistoryService;
    exports.HistoryService = HistoryService = HistoryService_1 = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, files_1.IFileService),
        __param(6, workspaces_1.IWorkspacesService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, log_1.ILogService)
    ], HistoryService);
    (0, extensions_1.registerSingleton)(history_1.IHistoryService, HistoryService, 0 /* InstantiationType.Eager */);
    class EditorSelectionState {
        constructor(editorIdentifier, selection, reason) {
            this.editorIdentifier = editorIdentifier;
            this.selection = selection;
            this.reason = reason;
        }
        justifiesNewNavigationEntry(other) {
            if (this.editorIdentifier.groupId !== other.editorIdentifier.groupId) {
                return true; // different group
            }
            if (!this.editorIdentifier.editor.matches(other.editorIdentifier.editor)) {
                return true; // different editor
            }
            if (!this.selection || !other.selection) {
                return true; // unknown selections
            }
            const result = this.selection.compare(other.selection);
            if (result === 2 /* EditorPaneSelectionCompareResult.SIMILAR */ && (other.reason === 4 /* EditorPaneSelectionChangeReason.NAVIGATION */ || other.reason === 5 /* EditorPaneSelectionChangeReason.JUMP */)) {
                // let navigation sources win even if the selection is `SIMILAR`
                // (e.g. "Go to definition" should add a history entry)
                return true;
            }
            return result === 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
        }
    }
    let EditorNavigationStacks = class EditorNavigationStacks extends lifecycle_1.Disposable {
        constructor(scope, instantiationService) {
            super();
            this.scope = scope;
            this.instantiationService = instantiationService;
            this.selectionsStack = this._register(this.instantiationService.createInstance(EditorNavigationStack, 0 /* GoFilter.NONE */, this.scope));
            this.editsStack = this._register(this.instantiationService.createInstance(EditorNavigationStack, 1 /* GoFilter.EDITS */, this.scope));
            this.navigationsStack = this._register(this.instantiationService.createInstance(EditorNavigationStack, 2 /* GoFilter.NAVIGATION */, this.scope));
            this.stacks = [
                this.selectionsStack,
                this.editsStack,
                this.navigationsStack
            ];
            this.onDidChange = event_1.Event.any(this.selectionsStack.onDidChange, this.editsStack.onDidChange, this.navigationsStack.onDidChange);
        }
        canGoForward(filter) {
            return this.getStack(filter).canGoForward();
        }
        goForward(filter) {
            return this.getStack(filter).goForward();
        }
        canGoBack(filter) {
            return this.getStack(filter).canGoBack();
        }
        goBack(filter) {
            return this.getStack(filter).goBack();
        }
        goPrevious(filter) {
            return this.getStack(filter).goPrevious();
        }
        canGoLast(filter) {
            return this.getStack(filter).canGoLast();
        }
        goLast(filter) {
            return this.getStack(filter).goLast();
        }
        getStack(filter = 0 /* GoFilter.NONE */) {
            switch (filter) {
                case 0 /* GoFilter.NONE */: return this.selectionsStack;
                case 1 /* GoFilter.EDITS */: return this.editsStack;
                case 2 /* GoFilter.NAVIGATION */: return this.navigationsStack;
            }
        }
        handleActiveEditorChange(editorPane) {
            // Always send to selections navigation stack
            this.selectionsStack.notifyNavigation(editorPane);
        }
        handleActiveEditorSelectionChange(editorPane, event) {
            const previous = this.selectionsStack.current;
            // Always send to selections navigation stack
            this.selectionsStack.notifyNavigation(editorPane, event);
            // Check for edits
            if (event.reason === 3 /* EditorPaneSelectionChangeReason.EDIT */) {
                this.editsStack.notifyNavigation(editorPane, event);
            }
            // Check for navigations
            //
            // Note: ignore if selections navigation stack is navigating because
            // in that case we do not want to receive repeated entries in
            // the navigation stack.
            else if ((event.reason === 4 /* EditorPaneSelectionChangeReason.NAVIGATION */ || event.reason === 5 /* EditorPaneSelectionChangeReason.JUMP */) &&
                !this.selectionsStack.isNavigating()) {
                // A "JUMP" navigation selection change always has a source and
                // target. As such, we add the previous entry of the selections
                // navigation stack so that our navigation stack receives both
                // entries unless the user is currently navigating.
                if (event.reason === 5 /* EditorPaneSelectionChangeReason.JUMP */ && !this.navigationsStack.isNavigating()) {
                    if (previous) {
                        this.navigationsStack.addOrReplace(previous.groupId, previous.editor, previous.selection);
                    }
                }
                this.navigationsStack.notifyNavigation(editorPane, event);
            }
        }
        clear() {
            for (const stack of this.stacks) {
                stack.clear();
            }
        }
        remove(arg1) {
            for (const stack of this.stacks) {
                stack.remove(arg1);
            }
        }
        move(event) {
            for (const stack of this.stacks) {
                stack.move(event);
            }
        }
    };
    EditorNavigationStacks = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], EditorNavigationStacks);
    class NoOpEditorNavigationStacks {
        constructor() {
            this.onDidChange = event_1.Event.None;
        }
        canGoForward() { return false; }
        async goForward() { }
        canGoBack() { return false; }
        async goBack() { }
        async goPrevious() { }
        canGoLast() { return false; }
        async goLast() { }
        handleActiveEditorChange() { }
        handleActiveEditorSelectionChange() { }
        clear() { }
        remove() { }
        move() { }
        dispose() { }
    }
    let EditorNavigationStack = class EditorNavigationStack extends lifecycle_1.Disposable {
        static { EditorNavigationStack_1 = this; }
        static { this.MAX_STACK_SIZE = 50; }
        get current() {
            return this.stack[this.index];
        }
        set current(entry) {
            if (entry) {
                this.stack[this.index] = entry;
            }
        }
        constructor(filter, scope, instantiationService, editorService, editorGroupService, logService) {
            super();
            this.filter = filter;
            this.scope = scope;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.logService = logService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.mapEditorToDisposable = new Map();
            this.mapGroupToDisposable = new Map();
            this.editorHelper = this.instantiationService.createInstance(EditorHelper);
            this.stack = [];
            this.index = -1;
            this.previousIndex = -1;
            this.navigating = false;
            this.currentSelectionState = undefined;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.onDidChange(() => this.traceStack()));
            this._register(this.logService.onDidChangeLogLevel(() => this.traceStack()));
        }
        traceStack() {
            if (this.logService.getLevel() !== log_1.LogLevel.Trace) {
                return;
            }
            const entryLabels = [];
            for (const entry of this.stack) {
                if (typeof entry.selection?.log === 'function') {
                    entryLabels.push(`- group: ${entry.groupId}, editor: ${entry.editor.resource?.toString()}, selection: ${entry.selection.log()}`);
                }
                else {
                    entryLabels.push(`- group: ${entry.groupId}, editor: ${entry.editor.resource?.toString()}, selection: <none>`);
                }
            }
            if (entryLabels.length === 0) {
                this.trace(`index: ${this.index}, navigating: ${this.isNavigating()}: <empty>`);
            }
            else {
                this.trace(`index: ${this.index}, navigating: ${this.isNavigating()}
${entryLabels.join('\n')}
			`);
            }
        }
        trace(msg, editor = null, event) {
            if (this.logService.getLevel() !== log_1.LogLevel.Trace) {
                return;
            }
            let filterLabel;
            switch (this.filter) {
                case 0 /* GoFilter.NONE */:
                    filterLabel = 'global';
                    break;
                case 1 /* GoFilter.EDITS */:
                    filterLabel = 'edits';
                    break;
                case 2 /* GoFilter.NAVIGATION */:
                    filterLabel = 'navigation';
                    break;
            }
            let scopeLabel;
            switch (this.scope) {
                case 0 /* GoScope.DEFAULT */:
                    scopeLabel = 'default';
                    break;
                case 1 /* GoScope.EDITOR_GROUP */:
                    scopeLabel = 'editorGroup';
                    break;
                case 2 /* GoScope.EDITOR */:
                    scopeLabel = 'editor';
                    break;
            }
            if (editor !== null) {
                this.logService.trace(`[History stack ${filterLabel}-${scopeLabel}]: ${msg} (editor: ${editor?.resource?.toString()}, event: ${this.traceEvent(event)})`);
            }
            else {
                this.logService.trace(`[History stack ${filterLabel}-${scopeLabel}]: ${msg}`);
            }
        }
        traceEvent(event) {
            if (!event) {
                return '<none>';
            }
            switch (event.reason) {
                case 3 /* EditorPaneSelectionChangeReason.EDIT */: return 'edit';
                case 4 /* EditorPaneSelectionChangeReason.NAVIGATION */: return 'navigation';
                case 5 /* EditorPaneSelectionChangeReason.JUMP */: return 'jump';
                case 1 /* EditorPaneSelectionChangeReason.PROGRAMMATIC */: return 'programmatic';
                case 2 /* EditorPaneSelectionChangeReason.USER */: return 'user';
            }
        }
        registerGroupListeners(groupId) {
            if (!this.mapGroupToDisposable.has(groupId)) {
                const group = this.editorGroupService.getGroup(groupId);
                if (group) {
                    this.mapGroupToDisposable.set(groupId, group.onWillMoveEditor(e => this.onWillMoveEditor(e)));
                }
            }
        }
        onWillMoveEditor(e) {
            this.trace('onWillMoveEditor()', e.editor);
            if (this.scope === 1 /* GoScope.EDITOR_GROUP */) {
                return; // ignore move events if our scope is group based
            }
            for (const entry of this.stack) {
                if (entry.groupId !== e.groupId) {
                    continue; // not in the group that reported the event
                }
                if (!this.editorHelper.matchesEditor(e.editor, entry.editor)) {
                    continue; // not the editor this event is about
                }
                // Update to target group
                entry.groupId = e.target;
            }
        }
        //#region Stack Mutation
        notifyNavigation(editorPane, event) {
            this.trace('notifyNavigation()', editorPane?.input, event);
            const isSelectionAwareEditorPane = (0, editor_1.isEditorPaneWithSelection)(editorPane);
            const hasValidEditor = editorPane?.input && !editorPane.input.isDisposed();
            // Treat editor changes that happen as part of stack navigation specially
            // we do not want to add a new stack entry as a matter of navigating the
            // stack but we need to keep our currentEditorSelectionState up to date
            // with the navigtion that occurs.
            if (this.navigating) {
                this.trace(`notifyNavigation() ignoring (navigating)`, editorPane?.input, event);
                if (isSelectionAwareEditorPane && hasValidEditor) {
                    this.trace('notifyNavigation() updating current selection state', editorPane?.input, event);
                    this.currentSelectionState = new EditorSelectionState({ groupId: editorPane.group.id, editor: editorPane.input }, editorPane.getSelection(), event?.reason);
                }
                else {
                    this.trace('notifyNavigation() dropping current selection state', editorPane?.input, event);
                    this.currentSelectionState = undefined; // we navigated to a non-selection aware or disposed editor
                }
            }
            // Normal navigation not part of stack navigation
            else {
                this.trace(`notifyNavigation() not ignoring`, editorPane?.input, event);
                // Navigation inside selection aware editor
                if (isSelectionAwareEditorPane && hasValidEditor) {
                    this.onSelectionAwareEditorNavigation(editorPane.group.id, editorPane.input, editorPane.getSelection(), event);
                }
                // Navigation to non-selection aware or disposed editor
                else {
                    this.currentSelectionState = undefined; // at this time we have no active selection aware editor
                    if (hasValidEditor) {
                        this.onNonSelectionAwareEditorNavigation(editorPane.group.id, editorPane.input);
                    }
                }
            }
        }
        onSelectionAwareEditorNavigation(groupId, editor, selection, event) {
            if (this.current?.groupId === groupId && !selection && this.editorHelper.matchesEditor(this.current.editor, editor)) {
                return; // do not push same editor input again of same group if we have no valid selection
            }
            this.trace('onSelectionAwareEditorNavigation()', editor, event);
            const stateCandidate = new EditorSelectionState({ groupId, editor }, selection, event?.reason);
            // Add to stack if we dont have a current state or this new state justifies a push
            if (!this.currentSelectionState || this.currentSelectionState.justifiesNewNavigationEntry(stateCandidate)) {
                this.doAdd(groupId, editor, stateCandidate.selection);
            }
            // Otherwise we replace the current stack entry with this one
            else {
                this.doReplace(groupId, editor, stateCandidate.selection);
            }
            // Update our current navigation editor state
            this.currentSelectionState = stateCandidate;
        }
        onNonSelectionAwareEditorNavigation(groupId, editor) {
            if (this.current?.groupId === groupId && this.editorHelper.matchesEditor(this.current.editor, editor)) {
                return; // do not push same editor input again of same group
            }
            this.trace('onNonSelectionAwareEditorNavigation()', editor);
            this.doAdd(groupId, editor);
        }
        doAdd(groupId, editor, selection) {
            if (!this.navigating) {
                this.addOrReplace(groupId, editor, selection);
            }
        }
        doReplace(groupId, editor, selection) {
            if (!this.navigating) {
                this.addOrReplace(groupId, editor, selection, true /* force replace */);
            }
        }
        addOrReplace(groupId, editorCandidate, selection, forceReplace) {
            // Ensure we listen to changes in group
            this.registerGroupListeners(groupId);
            // Check whether to replace an existing entry or not
            let replace = false;
            if (this.current) {
                if (forceReplace) {
                    replace = true; // replace if we are forced to
                }
                else if (this.shouldReplaceStackEntry(this.current, { groupId, editor: editorCandidate, selection })) {
                    replace = true; // replace if the group & input is the same and selection indicates as such
                }
            }
            const editor = this.editorHelper.preferResourceEditorInput(editorCandidate);
            if (!editor) {
                return;
            }
            if (replace) {
                this.trace('replace()', editor);
            }
            else {
                this.trace('add()', editor);
            }
            const newStackEntry = { groupId, editor, selection };
            // Replace at current position
            const removedEntries = [];
            if (replace) {
                if (this.current) {
                    removedEntries.push(this.current);
                }
                this.current = newStackEntry;
            }
            // Add to stack at current position
            else {
                // If we are not at the end of history, we remove anything after
                if (this.stack.length > this.index + 1) {
                    for (let i = this.index + 1; i < this.stack.length; i++) {
                        removedEntries.push(this.stack[i]);
                    }
                    this.stack = this.stack.slice(0, this.index + 1);
                }
                // Insert entry at index
                this.stack.splice(this.index + 1, 0, newStackEntry);
                // Check for limit
                if (this.stack.length > EditorNavigationStack_1.MAX_STACK_SIZE) {
                    removedEntries.push(this.stack.shift()); // remove first
                    if (this.previousIndex >= 0) {
                        this.previousIndex--;
                    }
                }
                else {
                    this.setIndex(this.index + 1, true /* skip event, we fire it later */);
                }
            }
            // Clear editor listeners from removed entries
            for (const removedEntry of removedEntries) {
                this.editorHelper.clearOnEditorDispose(removedEntry.editor, this.mapEditorToDisposable);
            }
            // Remove this from the stack unless the stack input is a resource
            // that can easily be restored even when the input gets disposed
            if ((0, editor_1.isEditorInput)(editor)) {
                this.editorHelper.onEditorDispose(editor, () => this.remove(editor), this.mapEditorToDisposable);
            }
            // Event
            this._onDidChange.fire();
        }
        shouldReplaceStackEntry(entry, candidate) {
            if (entry.groupId !== candidate.groupId) {
                return false; // different group
            }
            if (!this.editorHelper.matchesEditor(entry.editor, candidate.editor)) {
                return false; // different editor
            }
            if (!entry.selection) {
                return true; // always replace when we have no specific selection yet
            }
            if (!candidate.selection) {
                return false; // otherwise, prefer to keep existing specific selection over new unspecific one
            }
            // Finally, replace when selections are considered identical
            return entry.selection.compare(candidate.selection) === 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
        }
        move(event) {
            if (event.isOperation(2 /* FileOperation.MOVE */)) {
                for (const entry of this.stack) {
                    if (this.editorHelper.matchesEditor(event, entry.editor)) {
                        entry.editor = { resource: event.target.resource };
                    }
                }
            }
        }
        remove(arg1) {
            const previousStackSize = this.stack.length;
            // Remove all stack entries that match `arg1`
            this.stack = this.stack.filter(entry => {
                const matches = typeof arg1 === 'number' ? entry.groupId === arg1 : this.editorHelper.matchesEditor(arg1, entry.editor);
                // Cleanup any listeners associated with the input when removing
                if (matches) {
                    this.editorHelper.clearOnEditorDispose(entry.editor, this.mapEditorToDisposable);
                }
                return !matches;
            });
            if (previousStackSize === this.stack.length) {
                return; // nothing removed
            }
            // Given we just removed entries, we need to make sure
            // to remove entries that are now identical and next
            // to each other to prevent no-op navigations.
            this.flatten();
            // Reset indeces
            this.index = this.stack.length - 1;
            this.previousIndex = -1;
            // Clear group listener
            if (typeof arg1 === 'number') {
                this.mapGroupToDisposable.get(arg1)?.dispose();
                this.mapGroupToDisposable.delete(arg1);
            }
            // Event
            this._onDidChange.fire();
        }
        flatten() {
            const flattenedStack = [];
            let previousEntry = undefined;
            for (const entry of this.stack) {
                if (previousEntry && this.shouldReplaceStackEntry(entry, previousEntry)) {
                    continue; // skip over entry when it is considered the same
                }
                previousEntry = entry;
                flattenedStack.push(entry);
            }
            this.stack = flattenedStack;
        }
        clear() {
            this.index = -1;
            this.previousIndex = -1;
            this.stack.splice(0);
            for (const [, disposable] of this.mapEditorToDisposable) {
                (0, lifecycle_1.dispose)(disposable);
            }
            this.mapEditorToDisposable.clear();
            for (const [, disposable] of this.mapGroupToDisposable) {
                (0, lifecycle_1.dispose)(disposable);
            }
            this.mapGroupToDisposable.clear();
        }
        dispose() {
            super.dispose();
            this.clear();
        }
        //#endregion
        //#region Navigation
        canGoForward() {
            return this.stack.length > this.index + 1;
        }
        async goForward() {
            const navigated = await this.maybeGoCurrent();
            if (navigated) {
                return;
            }
            if (!this.canGoForward()) {
                return;
            }
            this.setIndex(this.index + 1);
            return this.navigate();
        }
        canGoBack() {
            return this.index > 0;
        }
        async goBack() {
            const navigated = await this.maybeGoCurrent();
            if (navigated) {
                return;
            }
            if (!this.canGoBack()) {
                return;
            }
            this.setIndex(this.index - 1);
            return this.navigate();
        }
        async goPrevious() {
            const navigated = await this.maybeGoCurrent();
            if (navigated) {
                return;
            }
            // If we never navigated, just go back
            if (this.previousIndex === -1) {
                return this.goBack();
            }
            // Otherwise jump to previous stack entry
            this.setIndex(this.previousIndex);
            return this.navigate();
        }
        canGoLast() {
            return this.stack.length > 0;
        }
        async goLast() {
            if (!this.canGoLast()) {
                return;
            }
            this.setIndex(this.stack.length - 1);
            return this.navigate();
        }
        async maybeGoCurrent() {
            // When this navigation stack works with a specific
            // filter where not every selection change is added
            // to the stack, we want to first reveal the current
            // selection before attempting to navigate in the
            // stack.
            if (this.filter === 0 /* GoFilter.NONE */) {
                return false; // only applies when  we are a filterd stack
            }
            if (this.isCurrentSelectionActive()) {
                return false; // we are at the current navigation stop
            }
            // Go to current selection
            await this.navigate();
            return true;
        }
        isCurrentSelectionActive() {
            if (!this.current?.selection) {
                return false; // we need a current selection
            }
            const pane = this.editorService.activeEditorPane;
            if (!(0, editor_1.isEditorPaneWithSelection)(pane)) {
                return false; // we need an active editor pane with selection support
            }
            if (pane.group.id !== this.current.groupId) {
                return false; // we need matching groups
            }
            if (!pane.input || !this.editorHelper.matchesEditor(pane.input, this.current.editor)) {
                return false; // we need matching editors
            }
            const paneSelection = pane.getSelection();
            if (!paneSelection) {
                return false; // we need a selection to compare with
            }
            return paneSelection.compare(this.current.selection) === 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
        }
        setIndex(newIndex, skipEvent) {
            this.previousIndex = this.index;
            this.index = newIndex;
            // Event
            if (!skipEvent) {
                this._onDidChange.fire();
            }
        }
        async navigate() {
            this.navigating = true;
            try {
                if (this.current) {
                    await this.doNavigate(this.current);
                }
            }
            finally {
                this.navigating = false;
            }
        }
        doNavigate(location) {
            let options = Object.create(null);
            // Apply selection if any
            if (location.selection) {
                options = location.selection.restore(options);
            }
            if ((0, editor_1.isEditorInput)(location.editor)) {
                return this.editorService.openEditor(location.editor, options, location.groupId);
            }
            return this.editorService.openEditor({
                ...location.editor,
                options: {
                    ...location.editor.options,
                    ...options
                }
            }, location.groupId);
        }
        isNavigating() {
            return this.navigating;
        }
    };
    exports.EditorNavigationStack = EditorNavigationStack;
    exports.EditorNavigationStack = EditorNavigationStack = EditorNavigationStack_1 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, editorService_1.IEditorService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, log_1.ILogService)
    ], EditorNavigationStack);
    let EditorHelper = class EditorHelper {
        constructor(uriIdentityService, lifecycleService, fileService, pathService) {
            this.uriIdentityService = uriIdentityService;
            this.lifecycleService = lifecycleService;
            this.fileService = fileService;
            this.pathService = pathService;
        }
        preferResourceEditorInput(editor) {
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(editor);
            // For now, only prefer well known schemes that we control to prevent
            // issues such as https://github.com/microsoft/vscode/issues/85204
            // from being used as resource inputs
            // resource inputs survive editor disposal and as such are a lot more
            // durable across editor changes and restarts
            const hasValidResourceEditorInputScheme = resource?.scheme === network_1.Schemas.file ||
                resource?.scheme === network_1.Schemas.vscodeRemote ||
                resource?.scheme === network_1.Schemas.vscodeUserData ||
                resource?.scheme === this.pathService.defaultUriScheme;
            // Scheme is valid: prefer the untyped input
            // over the typed input if possible to keep
            // the entry across restarts
            if (hasValidResourceEditorInputScheme) {
                if ((0, editor_1.isEditorInput)(editor)) {
                    const untypedInput = editor.toUntyped();
                    if ((0, editor_1.isResourceEditorInput)(untypedInput)) {
                        return untypedInput;
                    }
                }
                return editor;
            }
            // Scheme is invalid: allow the editor input
            // for as long as it is not disposed
            else {
                return (0, editor_1.isEditorInput)(editor) ? editor : undefined;
            }
        }
        matchesEditor(arg1, inputB) {
            if (arg1 instanceof files_1.FileChangesEvent || arg1 instanceof files_1.FileOperationEvent) {
                if ((0, editor_1.isEditorInput)(inputB)) {
                    return false; // we only support this for `IResourceEditorInputs` that are file based
                }
                if (arg1 instanceof files_1.FileChangesEvent) {
                    return arg1.contains(inputB.resource, 2 /* FileChangeType.DELETED */);
                }
                return this.matchesFile(inputB.resource, arg1);
            }
            if ((0, editor_1.isEditorInput)(arg1)) {
                if ((0, editor_1.isEditorInput)(inputB)) {
                    return arg1.matches(inputB);
                }
                return this.matchesFile(inputB.resource, arg1);
            }
            if ((0, editor_1.isEditorInput)(inputB)) {
                return this.matchesFile(arg1.resource, inputB);
            }
            return arg1 && inputB && this.uriIdentityService.extUri.isEqual(arg1.resource, inputB.resource);
        }
        matchesFile(resource, arg2) {
            if (arg2 instanceof files_1.FileChangesEvent) {
                return arg2.contains(resource, 2 /* FileChangeType.DELETED */);
            }
            if (arg2 instanceof files_1.FileOperationEvent) {
                return this.uriIdentityService.extUri.isEqualOrParent(resource, arg2.resource);
            }
            if ((0, editor_1.isEditorInput)(arg2)) {
                const inputResource = arg2.resource;
                if (!inputResource) {
                    return false;
                }
                if (this.lifecycleService.phase >= 3 /* LifecyclePhase.Restored */ && !this.fileService.hasProvider(inputResource)) {
                    return false; // make sure to only check this when workbench has restored (for https://github.com/microsoft/vscode/issues/48275)
                }
                return this.uriIdentityService.extUri.isEqual(inputResource, resource);
            }
            return this.uriIdentityService.extUri.isEqual(arg2?.resource, resource);
        }
        matchesEditorIdentifier(identifier, editorPane) {
            if (!editorPane?.group) {
                return false;
            }
            if (identifier.groupId !== editorPane.group.id) {
                return false;
            }
            return editorPane.input ? identifier.editor.matches(editorPane.input) : false;
        }
        onEditorDispose(editor, listener, mapEditorToDispose) {
            const toDispose = event_1.Event.once(editor.onWillDispose)(() => listener());
            let disposables = mapEditorToDispose.get(editor);
            if (!disposables) {
                disposables = new lifecycle_1.DisposableStore();
                mapEditorToDispose.set(editor, disposables);
            }
            disposables.add(toDispose);
        }
        clearOnEditorDispose(editor, mapEditorToDispose) {
            if (!(0, editor_1.isEditorInput)(editor)) {
                return; // only supported when passing in an actual editor input
            }
            const disposables = mapEditorToDispose.get(editor);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
                mapEditorToDispose.delete(editor);
            }
        }
    };
    EditorHelper = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, files_1.IFileService),
        __param(3, pathService_1.IPathService)
    ], EditorHelper);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvaGlzdG9yeS9icm93c2VyL2hpc3RvcnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpRHpGLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTs7aUJBSXJCLDZCQUF3QixHQUFHLDZDQUE2QyxBQUFoRCxDQUFpRDtpQkFDekUsNkJBQXdCLEdBQUcsa0NBQWtDLEFBQXJDLENBQXNDO1FBT3RGLFlBQ2lCLGFBQWlELEVBQzNDLGtCQUF5RCxFQUNyRCxjQUF5RCxFQUNsRSxjQUFnRCxFQUMxQyxvQkFBNEQsRUFDckUsV0FBMEMsRUFDcEMsaUJBQXNELEVBQ25ELG9CQUE0RCxFQUMxRCxhQUF1RCxFQUM1RCxpQkFBc0QsRUFDN0QsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFaeUIsa0JBQWEsR0FBYixhQUFhLENBQW1CO1lBQzFCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDcEMsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUN6Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3BELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ25CLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUN6QyxrQkFBYSxHQUFiLGFBQWEsQ0FBeUI7WUFDM0Msc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUM1QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBaEJyQywwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFB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