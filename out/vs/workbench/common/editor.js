/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/files/common/files", "vs/base/common/network", "vs/base/common/errorMessage", "vs/base/common/actions", "vs/base/common/severity"], function (require, exports, nls_1, types_1, uri_1, lifecycle_1, instantiation_1, platform_1, files_1, network_1, errorMessage_1, actions_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorsOrder = exports.CloseDirection = exports.EditorResourceAccessor = exports.EditorCloseMethod = exports.SideBySideEditor = exports.GroupModelChangeKind = exports.EditorCloseContext = exports.AbstractEditorInput = exports.EditorInputCapabilities = exports.SaveSourceRegistry = exports.SaveReason = exports.Verbosity = exports.EditorPaneSelectionCompareResult = exports.EditorPaneSelectionChangeReason = exports.BINARY_DIFF_EDITOR_ID = exports.TEXT_DIFF_EDITOR_ID = exports.SIDE_BY_SIDE_EDITOR_ID = exports.DEFAULT_EDITOR_ASSOCIATION = exports.EditorExtensions = void 0;
    exports.isEditorPaneWithSelection = isEditorPaneWithSelection;
    exports.isEditorPaneWithScrolling = isEditorPaneWithScrolling;
    exports.findViewStateForEditor = findViewStateForEditor;
    exports.isResourceEditorInput = isResourceEditorInput;
    exports.isResourceDiffEditorInput = isResourceDiffEditorInput;
    exports.isResourceMultiDiffEditorInput = isResourceMultiDiffEditorInput;
    exports.isResourceSideBySideEditorInput = isResourceSideBySideEditorInput;
    exports.isUntitledResourceEditorInput = isUntitledResourceEditorInput;
    exports.isResourceMergeEditorInput = isResourceMergeEditorInput;
    exports.isEditorInput = isEditorInput;
    exports.isSideBySideEditorInput = isSideBySideEditorInput;
    exports.isDiffEditorInput = isDiffEditorInput;
    exports.createTooLargeFileError = createTooLargeFileError;
    exports.isEditorInputWithOptions = isEditorInputWithOptions;
    exports.isEditorInputWithOptionsAndGroup = isEditorInputWithOptionsAndGroup;
    exports.isEditorIdentifier = isEditorIdentifier;
    exports.preventEditorClose = preventEditorClose;
    exports.pathsToEditors = pathsToEditors;
    exports.isTextEditorViewState = isTextEditorViewState;
    exports.isEditorOpenError = isEditorOpenError;
    exports.createEditorOpenError = createEditorOpenError;
    // Static values for editor contributions
    exports.EditorExtensions = {
        EditorPane: 'workbench.contributions.editors',
        EditorFactory: 'workbench.contributions.editor.inputFactories'
    };
    // Static information regarding the text editor
    exports.DEFAULT_EDITOR_ASSOCIATION = {
        id: 'default',
        displayName: (0, nls_1.localize)('promptOpenWith.defaultEditor.displayName', "Text Editor"),
        providerDisplayName: (0, nls_1.localize)('builtinProviderDisplayName', "Built-in")
    };
    /**
     * Side by side editor id.
     */
    exports.SIDE_BY_SIDE_EDITOR_ID = 'workbench.editor.sidebysideEditor';
    /**
     * Text diff editor id.
     */
    exports.TEXT_DIFF_EDITOR_ID = 'workbench.editors.textDiffEditor';
    /**
     * Binary diff editor id.
     */
    exports.BINARY_DIFF_EDITOR_ID = 'workbench.editors.binaryResourceDiffEditor';
    var EditorPaneSelectionChangeReason;
    (function (EditorPaneSelectionChangeReason) {
        /**
         * The selection was changed as a result of a programmatic
         * method invocation.
         *
         * For a text editor pane, this for example can be a selection
         * being restored from previous view state automatically.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["PROGRAMMATIC"] = 1] = "PROGRAMMATIC";
        /**
         * The selection was changed by the user.
         *
         * This typically means the user changed the selection
         * with mouse or keyboard.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["USER"] = 2] = "USER";
        /**
         * The selection was changed as a result of editing in
         * the editor pane.
         *
         * For a text editor pane, this for example can be typing
         * in the text of the editor pane.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["EDIT"] = 3] = "EDIT";
        /**
         * The selection was changed as a result of a navigation
         * action.
         *
         * For a text editor pane, this for example can be a result
         * of selecting an entry from a text outline view.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["NAVIGATION"] = 4] = "NAVIGATION";
        /**
         * The selection was changed as a result of a jump action
         * from within the editor pane.
         *
         * For a text editor pane, this for example can be a result
         * of invoking "Go to definition" from a symbol.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["JUMP"] = 5] = "JUMP";
    })(EditorPaneSelectionChangeReason || (exports.EditorPaneSelectionChangeReason = EditorPaneSelectionChangeReason = {}));
    var EditorPaneSelectionCompareResult;
    (function (EditorPaneSelectionCompareResult) {
        /**
         * The selections are identical.
         */
        EditorPaneSelectionCompareResult[EditorPaneSelectionCompareResult["IDENTICAL"] = 1] = "IDENTICAL";
        /**
         * The selections are similar.
         *
         * For a text editor this can mean that the one
         * selection is in close proximity to the other
         * selection.
         *
         * Upstream clients may decide in this case to
         * not treat the selection different from the
         * previous one because it is not distinct enough.
         */
        EditorPaneSelectionCompareResult[EditorPaneSelectionCompareResult["SIMILAR"] = 2] = "SIMILAR";
        /**
         * The selections are entirely different.
         */
        EditorPaneSelectionCompareResult[EditorPaneSelectionCompareResult["DIFFERENT"] = 3] = "DIFFERENT";
    })(EditorPaneSelectionCompareResult || (exports.EditorPaneSelectionCompareResult = EditorPaneSelectionCompareResult = {}));
    function isEditorPaneWithSelection(editorPane) {
        const candidate = editorPane;
        return !!candidate && typeof candidate.getSelection === 'function' && !!candidate.onDidChangeSelection;
    }
    function isEditorPaneWithScrolling(editorPane) {
        const candidate = editorPane;
        return !!candidate && typeof candidate.getScrollPosition === 'function' && typeof candidate.setScrollPosition === 'function' && !!candidate.onDidChangeScroll;
    }
    /**
     * Try to retrieve the view state for the editor pane that
     * has the provided editor input opened, if at all.
     *
     * This method will return `undefined` if the editor input
     * is not visible in any of the opened editor panes.
     */
    function findViewStateForEditor(input, group, editorService) {
        for (const editorPane of editorService.visibleEditorPanes) {
            if (editorPane.group.id === group && input.matches(editorPane.input)) {
                return editorPane.getViewState();
            }
        }
        return undefined;
    }
    function isResourceEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        return uri_1.URI.isUri(candidate?.resource);
    }
    function isResourceDiffEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        return candidate?.original !== undefined && candidate.modified !== undefined;
    }
    function isResourceMultiDiffEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        if (!candidate) {
            return false;
        }
        if (candidate.resources && !Array.isArray(candidate.resources)) {
            return false;
        }
        return !!candidate.resources || !!candidate.multiDiffSource;
    }
    function isResourceSideBySideEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        if (isResourceDiffEditorInput(editor)) {
            return false; // make sure to not accidentally match on diff editors
        }
        const candidate = editor;
        return candidate?.primary !== undefined && candidate.secondary !== undefined;
    }
    function isUntitledResourceEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        if (!candidate) {
            return false;
        }
        return candidate.resource === undefined || candidate.resource.scheme === network_1.Schemas.untitled || candidate.forceUntitled === true;
    }
    function isResourceMergeEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        return uri_1.URI.isUri(candidate?.base?.resource) && uri_1.URI.isUri(candidate?.input1?.resource) && uri_1.URI.isUri(candidate?.input2?.resource) && uri_1.URI.isUri(candidate?.result?.resource);
    }
    var Verbosity;
    (function (Verbosity) {
        Verbosity[Verbosity["SHORT"] = 0] = "SHORT";
        Verbosity[Verbosity["MEDIUM"] = 1] = "MEDIUM";
        Verbosity[Verbosity["LONG"] = 2] = "LONG";
    })(Verbosity || (exports.Verbosity = Verbosity = {}));
    var SaveReason;
    (function (SaveReason) {
        /**
         * Explicit user gesture.
         */
        SaveReason[SaveReason["EXPLICIT"] = 1] = "EXPLICIT";
        /**
         * Auto save after a timeout.
         */
        SaveReason[SaveReason["AUTO"] = 2] = "AUTO";
        /**
         * Auto save after editor focus change.
         */
        SaveReason[SaveReason["FOCUS_CHANGE"] = 3] = "FOCUS_CHANGE";
        /**
         * Auto save after window change.
         */
        SaveReason[SaveReason["WINDOW_CHANGE"] = 4] = "WINDOW_CHANGE";
    })(SaveReason || (exports.SaveReason = SaveReason = {}));
    class SaveSourceFactory {
        constructor() {
            this.mapIdToSaveSource = new Map();
        }
        /**
         * Registers a `SaveSource` with an identifier and label
         * to the registry so that it can be used in save operations.
         */
        registerSource(id, label) {
            let sourceDescriptor = this.mapIdToSaveSource.get(id);
            if (!sourceDescriptor) {
                sourceDescriptor = { source: id, label };
                this.mapIdToSaveSource.set(id, sourceDescriptor);
            }
            return sourceDescriptor.source;
        }
        getSourceLabel(source) {
            return this.mapIdToSaveSource.get(source)?.label ?? source;
        }
    }
    exports.SaveSourceRegistry = new SaveSourceFactory();
    var EditorInputCapabilities;
    (function (EditorInputCapabilities) {
        /**
         * Signals no specific capability for the input.
         */
        EditorInputCapabilities[EditorInputCapabilities["None"] = 0] = "None";
        /**
         * Signals that the input is readonly.
         */
        EditorInputCapabilities[EditorInputCapabilities["Readonly"] = 2] = "Readonly";
        /**
         * Signals that the input is untitled.
         */
        EditorInputCapabilities[EditorInputCapabilities["Untitled"] = 4] = "Untitled";
        /**
         * Signals that the input can only be shown in one group
         * and not be split into multiple groups.
         */
        EditorInputCapabilities[EditorInputCapabilities["Singleton"] = 8] = "Singleton";
        /**
         * Signals that the input requires workspace trust.
         */
        EditorInputCapabilities[EditorInputCapabilities["RequiresTrust"] = 16] = "RequiresTrust";
        /**
         * Signals that the editor can split into 2 in the same
         * editor group.
         */
        EditorInputCapabilities[EditorInputCapabilities["CanSplitInGroup"] = 32] = "CanSplitInGroup";
        /**
         * Signals that the editor wants its description to be
         * visible when presented to the user. By default, a UI
         * component may decide to hide the description portion
         * for brevity.
         */
        EditorInputCapabilities[EditorInputCapabilities["ForceDescription"] = 64] = "ForceDescription";
        /**
         * Signals that the editor supports dropping into the
         * editor by holding shift.
         */
        EditorInputCapabilities[EditorInputCapabilities["CanDropIntoEditor"] = 128] = "CanDropIntoEditor";
        /**
         * Signals that the editor is composed of multiple editors
         * within.
         */
        EditorInputCapabilities[EditorInputCapabilities["MultipleEditors"] = 256] = "MultipleEditors";
        /**
         * Signals that the editor cannot be in a dirty state
         * and may still have unsaved changes
         */
        EditorInputCapabilities[EditorInputCapabilities["Scratchpad"] = 512] = "Scratchpad";
    })(EditorInputCapabilities || (exports.EditorInputCapabilities = EditorInputCapabilities = {}));
    class AbstractEditorInput extends lifecycle_1.Disposable {
    }
    exports.AbstractEditorInput = AbstractEditorInput;
    function isEditorInput(editor) {
        return editor instanceof AbstractEditorInput;
    }
    function isEditorInputWithPreferredResource(editor) {
        const candidate = editor;
        return uri_1.URI.isUri(candidate?.preferredResource);
    }
    function isSideBySideEditorInput(editor) {
        const candidate = editor;
        return isEditorInput(candidate?.primary) && isEditorInput(candidate?.secondary);
    }
    function isDiffEditorInput(editor) {
        const candidate = editor;
        return isEditorInput(candidate?.modified) && isEditorInput(candidate?.original);
    }
    function createTooLargeFileError(group, input, options, message, preferencesService) {
        return createEditorOpenError(message, [
            (0, actions_1.toAction)({
                id: 'workbench.action.openLargeFile', label: (0, nls_1.localize)('openLargeFile', "Open Anyway"), run: () => {
                    const fileEditorOptions = {
                        ...options,
                        limits: {
                            size: Number.MAX_VALUE
                        }
                    };
                    group.openEditor(input, fileEditorOptions);
                }
            }),
            (0, actions_1.toAction)({
                id: 'workbench.action.configureEditorLargeFileConfirmation', label: (0, nls_1.localize)('configureEditorLargeFileConfirmation', "Configure Limit"), run: () => {
                    return preferencesService.openUserSettings({ query: 'workbench.editorLargeFileConfirmation' });
                }
            }),
        ], {
            forceMessage: true,
            forceSeverity: severity_1.default.Warning
        });
    }
    function isEditorInputWithOptions(editor) {
        const candidate = editor;
        return isEditorInput(candidate?.editor);
    }
    function isEditorInputWithOptionsAndGroup(editor) {
        const candidate = editor;
        return isEditorInputWithOptions(editor) && candidate?.group !== undefined;
    }
    function isEditorIdentifier(identifier) {
        const candidate = identifier;
        return typeof candidate?.groupId === 'number' && isEditorInput(candidate.editor);
    }
    /**
     * More information around why an editor was closed in the model.
     */
    var EditorCloseContext;
    (function (EditorCloseContext) {
        /**
         * No specific context for closing (e.g. explicit user gesture).
         */
        EditorCloseContext[EditorCloseContext["UNKNOWN"] = 0] = "UNKNOWN";
        /**
         * The editor closed because it was replaced with another editor.
         * This can either happen via explicit replace call or when an
         * editor is in preview mode and another editor opens.
         */
        EditorCloseContext[EditorCloseContext["REPLACE"] = 1] = "REPLACE";
        /**
         * The editor closed as a result of moving it to another group.
         */
        EditorCloseContext[EditorCloseContext["MOVE"] = 2] = "MOVE";
        /**
         * The editor closed because another editor turned into preview
         * and this used to be the preview editor before.
         */
        EditorCloseContext[EditorCloseContext["UNPIN"] = 3] = "UNPIN";
    })(EditorCloseContext || (exports.EditorCloseContext = EditorCloseContext = {}));
    var GroupModelChangeKind;
    (function (GroupModelChangeKind) {
        /* Group Changes */
        GroupModelChangeKind[GroupModelChangeKind["GROUP_ACTIVE"] = 0] = "GROUP_ACTIVE";
        GroupModelChangeKind[GroupModelChangeKind["GROUP_INDEX"] = 1] = "GROUP_INDEX";
        GroupModelChangeKind[GroupModelChangeKind["GROUP_LABEL"] = 2] = "GROUP_LABEL";
        GroupModelChangeKind[GroupModelChangeKind["GROUP_LOCKED"] = 3] = "GROUP_LOCKED";
        /* Editor Changes */
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_OPEN"] = 4] = "EDITOR_OPEN";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_CLOSE"] = 5] = "EDITOR_CLOSE";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_MOVE"] = 6] = "EDITOR_MOVE";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_ACTIVE"] = 7] = "EDITOR_ACTIVE";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_LABEL"] = 8] = "EDITOR_LABEL";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_CAPABILITIES"] = 9] = "EDITOR_CAPABILITIES";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_PIN"] = 10] = "EDITOR_PIN";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_TRANSIENT"] = 11] = "EDITOR_TRANSIENT";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_STICKY"] = 12] = "EDITOR_STICKY";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_DIRTY"] = 13] = "EDITOR_DIRTY";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_WILL_DISPOSE"] = 14] = "EDITOR_WILL_DISPOSE";
    })(GroupModelChangeKind || (exports.GroupModelChangeKind = GroupModelChangeKind = {}));
    var SideBySideEditor;
    (function (SideBySideEditor) {
        SideBySideEditor[SideBySideEditor["PRIMARY"] = 1] = "PRIMARY";
        SideBySideEditor[SideBySideEditor["SECONDARY"] = 2] = "SECONDARY";
        SideBySideEditor[SideBySideEditor["BOTH"] = 3] = "BOTH";
        SideBySideEditor[SideBySideEditor["ANY"] = 4] = "ANY";
    })(SideBySideEditor || (exports.SideBySideEditor = SideBySideEditor = {}));
    class EditorResourceAccessorImpl {
        getOriginalUri(editor, options) {
            if (!editor) {
                return undefined;
            }
            // Merge editors are handled with `merged` result editor
            if (isResourceMergeEditorInput(editor)) {
                return exports.EditorResourceAccessor.getOriginalUri(editor.result, options);
            }
            // Optionally support side-by-side editors
            if (options?.supportSideBySide) {
                const { primary, secondary } = this.getSideEditors(editor);
                if (primary && secondary) {
                    if (options?.supportSideBySide === SideBySideEditor.BOTH) {
                        return {
                            primary: this.getOriginalUri(primary, { filterByScheme: options.filterByScheme }),
                            secondary: this.getOriginalUri(secondary, { filterByScheme: options.filterByScheme })
                        };
                    }
                    else if (options?.supportSideBySide === SideBySideEditor.ANY) {
                        return this.getOriginalUri(primary, { filterByScheme: options.filterByScheme }) ?? this.getOriginalUri(secondary, { filterByScheme: options.filterByScheme });
                    }
                    editor = options.supportSideBySide === SideBySideEditor.PRIMARY ? primary : secondary;
                }
            }
            if (isResourceDiffEditorInput(editor) || isResourceMultiDiffEditorInput(editor) || isResourceSideBySideEditorInput(editor) || isResourceMergeEditorInput(editor)) {
                return undefined;
            }
            // Original URI is the `preferredResource` of an editor if any
            const originalResource = isEditorInputWithPreferredResource(editor) ? editor.preferredResource : editor.resource;
            if (!originalResource || !options || !options.filterByScheme) {
                return originalResource;
            }
            return this.filterUri(originalResource, options.filterByScheme);
        }
        getSideEditors(editor) {
            if (isSideBySideEditorInput(editor) || isResourceSideBySideEditorInput(editor)) {
                return { primary: editor.primary, secondary: editor.secondary };
            }
            if (isDiffEditorInput(editor) || isResourceDiffEditorInput(editor)) {
                return { primary: editor.modified, secondary: editor.original };
            }
            return { primary: undefined, secondary: undefined };
        }
        getCanonicalUri(editor, options) {
            if (!editor) {
                return undefined;
            }
            // Merge editors are handled with `merged` result editor
            if (isResourceMergeEditorInput(editor)) {
                return exports.EditorResourceAccessor.getCanonicalUri(editor.result, options);
            }
            // Optionally support side-by-side editors
            if (options?.supportSideBySide) {
                const { primary, secondary } = this.getSideEditors(editor);
                if (primary && secondary) {
                    if (options?.supportSideBySide === SideBySideEditor.BOTH) {
                        return {
                            primary: this.getCanonicalUri(primary, { filterByScheme: options.filterByScheme }),
                            secondary: this.getCanonicalUri(secondary, { filterByScheme: options.filterByScheme })
                        };
                    }
                    else if (options?.supportSideBySide === SideBySideEditor.ANY) {
                        return this.getCanonicalUri(primary, { filterByScheme: options.filterByScheme }) ?? this.getCanonicalUri(secondary, { filterByScheme: options.filterByScheme });
                    }
                    editor = options.supportSideBySide === SideBySideEditor.PRIMARY ? primary : secondary;
                }
            }
            if (isResourceDiffEditorInput(editor) || isResourceMultiDiffEditorInput(editor) || isResourceSideBySideEditorInput(editor) || isResourceMergeEditorInput(editor)) {
                return undefined;
            }
            // Canonical URI is the `resource` of an editor
            const canonicalResource = editor.resource;
            if (!canonicalResource || !options || !options.filterByScheme) {
                return canonicalResource;
            }
            return this.filterUri(canonicalResource, options.filterByScheme);
        }
        filterUri(resource, filter) {
            // Multiple scheme filter
            if (Array.isArray(filter)) {
                if (filter.some(scheme => resource.scheme === scheme)) {
                    return resource;
                }
            }
            // Single scheme filter
            else {
                if (filter === resource.scheme) {
                    return resource;
                }
            }
            return undefined;
        }
    }
    var EditorCloseMethod;
    (function (EditorCloseMethod) {
        EditorCloseMethod[EditorCloseMethod["UNKNOWN"] = 0] = "UNKNOWN";
        EditorCloseMethod[EditorCloseMethod["KEYBOARD"] = 1] = "KEYBOARD";
        EditorCloseMethod[EditorCloseMethod["MOUSE"] = 2] = "MOUSE";
    })(EditorCloseMethod || (exports.EditorCloseMethod = EditorCloseMethod = {}));
    function preventEditorClose(group, editor, method, configuration) {
        if (!group.isSticky(editor)) {
            return false; // only interested in sticky editors
        }
        switch (configuration.preventPinnedEditorClose) {
            case 'keyboardAndMouse': return method === EditorCloseMethod.MOUSE || method === EditorCloseMethod.KEYBOARD;
            case 'mouse': return method === EditorCloseMethod.MOUSE;
            case 'keyboard': return method === EditorCloseMethod.KEYBOARD;
        }
        return false;
    }
    exports.EditorResourceAccessor = new EditorResourceAccessorImpl();
    var CloseDirection;
    (function (CloseDirection) {
        CloseDirection[CloseDirection["LEFT"] = 0] = "LEFT";
        CloseDirection[CloseDirection["RIGHT"] = 1] = "RIGHT";
    })(CloseDirection || (exports.CloseDirection = CloseDirection = {}));
    class EditorFactoryRegistry {
        constructor() {
            this.editorSerializerConstructors = new Map();
            this.editorSerializerInstances = new Map();
        }
        start(accessor) {
            const instantiationService = this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            for (const [key, ctor] of this.editorSerializerConstructors) {
                this.createEditorSerializer(key, ctor, instantiationService);
            }
            this.editorSerializerConstructors.clear();
        }
        createEditorSerializer(editorTypeId, ctor, instantiationService) {
            const instance = instantiationService.createInstance(ctor);
            this.editorSerializerInstances.set(editorTypeId, instance);
        }
        registerFileEditorFactory(factory) {
            if (this.fileEditorFactory) {
                throw new Error('Can only register one file editor factory.');
            }
            this.fileEditorFactory = factory;
        }
        getFileEditorFactory() {
            return (0, types_1.assertIsDefined)(this.fileEditorFactory);
        }
        registerEditorSerializer(editorTypeId, ctor) {
            if (this.editorSerializerConstructors.has(editorTypeId) || this.editorSerializerInstances.has(editorTypeId)) {
                throw new Error(`A editor serializer with type ID '${editorTypeId}' was already registered.`);
            }
            if (!this.instantiationService) {
                this.editorSerializerConstructors.set(editorTypeId, ctor);
            }
            else {
                this.createEditorSerializer(editorTypeId, ctor, this.instantiationService);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                this.editorSerializerConstructors.delete(editorTypeId);
                this.editorSerializerInstances.delete(editorTypeId);
            });
        }
        getEditorSerializer(arg1) {
            return this.editorSerializerInstances.get(typeof arg1 === 'string' ? arg1 : arg1.typeId);
        }
    }
    platform_1.Registry.add(exports.EditorExtensions.EditorFactory, new EditorFactoryRegistry());
    async function pathsToEditors(paths, fileService, logService) {
        if (!paths || !paths.length) {
            return [];
        }
        return await Promise.all(paths.map(async (path) => {
            const resource = uri_1.URI.revive(path.fileUri);
            if (!resource) {
                logService.info('Cannot resolve the path because it is not valid.', path);
                return undefined;
            }
            const canHandleResource = await fileService.canHandleResource(resource);
            if (!canHandleResource) {
                logService.info('Cannot resolve the path because it cannot be handled', path);
                return undefined;
            }
            let exists = path.exists;
            let type = path.type;
            if (typeof exists !== 'boolean' || typeof type !== 'number') {
                try {
                    type = (await fileService.stat(resource)).isDirectory ? files_1.FileType.Directory : files_1.FileType.Unknown;
                    exists = true;
                }
                catch (error) {
                    logService.error(error);
                    exists = false;
                }
            }
            if (!exists && path.openOnlyIfExists) {
                logService.info('Cannot resolve the path because it does not exist', path);
                return undefined;
            }
            if (type === files_1.FileType.Directory) {
                logService.info('Cannot resolve the path because it is a directory', path);
                return undefined;
            }
            const options = {
                ...path.options,
                pinned: true
            };
            if (!exists) {
                return { resource, options, forceUntitled: true };
            }
            return { resource, options };
        }));
    }
    var EditorsOrder;
    (function (EditorsOrder) {
        /**
         * Editors sorted by most recent activity (most recent active first)
         */
        EditorsOrder[EditorsOrder["MOST_RECENTLY_ACTIVE"] = 0] = "MOST_RECENTLY_ACTIVE";
        /**
         * Editors sorted by sequential order
         */
        EditorsOrder[EditorsOrder["SEQUENTIAL"] = 1] = "SEQUENTIAL";
    })(EditorsOrder || (exports.EditorsOrder = EditorsOrder = {}));
    function isTextEditorViewState(candidate) {
        const viewState = candidate;
        if (!viewState) {
            return false;
        }
        const diffEditorViewState = viewState;
        if (diffEditorViewState.modified) {
            return isTextEditorViewState(diffEditorViewState.modified);
        }
        const codeEditorViewState = viewState;
        return !!(codeEditorViewState.contributionsState && codeEditorViewState.viewState && Array.isArray(codeEditorViewState.cursorState));
    }
    function isEditorOpenError(obj) {
        return (0, errorMessage_1.isErrorWithActions)(obj);
    }
    function createEditorOpenError(messageOrError, actions, options) {
        const error = (0, errorMessage_1.createErrorWithActions)(messageOrError, actions);
        error.forceMessage = options?.forceMessage;
        error.forceSeverity = options?.forceSeverity;
        error.allowDialog = options?.allowDialog;
        return error;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9lZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK1RoRyw4REFJQztJQVdELDhEQUlDO0lBaUJELHdEQVFDO0lBK05ELHNEQVFDO0lBRUQsOERBUUM7SUFFRCx3RUFjQztJQUVELDBFQVlDO0lBRUQsc0VBV0M7SUFFRCxnRUFRQztJQXdMRCxzQ0FFQztJQTJDRCwwREFJQztJQWVELDhDQUlDO0lBb0ZELDBEQXVCQztJQVdELDREQUlDO0lBRUQsNEVBSUM7SUF1QkQsZ0RBSUM7SUF5WUQsZ0RBWUM7SUFzRkQsd0NBbURDO0lBZUQsc0RBY0M7SUEyQkQsOENBRUM7SUFFRCxzREFRQztJQTltREQseUNBQXlDO0lBQzVCLFFBQUEsZ0JBQWdCLEdBQUc7UUFDL0IsVUFBVSxFQUFFLGlDQUFpQztRQUM3QyxhQUFhLEVBQUUsK0NBQStDO0tBQzlELENBQUM7SUFFRiwrQ0FBK0M7SUFDbEMsUUFBQSwwQkFBMEIsR0FBRztRQUN6QyxFQUFFLEVBQUUsU0FBUztRQUNiLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywwQ0FBMEMsRUFBRSxhQUFhLENBQUM7UUFDaEYsbUJBQW1CLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsVUFBVSxDQUFDO0tBQ3ZFLENBQUM7SUFFRjs7T0FFRztJQUNVLFFBQUEsc0JBQXNCLEdBQUcsbUNBQW1DLENBQUM7SUFFMUU7O09BRUc7SUFDVSxRQUFBLG1CQUFtQixHQUFHLGtDQUFrQyxDQUFDO0lBRXRFOztPQUVHO0lBQ1UsUUFBQSxxQkFBcUIsR0FBRyw0Q0FBNEMsQ0FBQztJQWtLbEYsSUFBa0IsK0JBNkNqQjtJQTdDRCxXQUFrQiwrQkFBK0I7UUFFaEQ7Ozs7OztXQU1HO1FB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