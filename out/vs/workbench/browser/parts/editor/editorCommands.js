/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/common/arrays", "vs/base/common/keyCodes", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/workbench/common/contextkeys", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/untitled/common/untitledTextEditorService", "./diffEditorCommands"], function (require, exports, dom_1, listWidget_1, arrays_1, keyCodes_1, network_1, resources_1, types_1, uri_1, editorBrowser_1, editorContextKeys_1, nls_1, actionCommonCategories_1, actions_1, commands_1, configuration_1, contextkey_1, editor_1, instantiation_1, keybindingsRegistry_1, listService_1, opener_1, quickInput_1, telemetry_1, editorQuickAccess_1, sideBySideEditor_1, textDiffEditor_1, contextkeys_1, editor_2, diffEditorInput_1, sideBySideEditorInput_1, editorGroupColumn_1, editorGroupsService_1, editorResolverService_1, editorService_1, pathService_1, untitledTextEditorService_1, diffEditorCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EDITOR_CORE_NAVIGATION_COMMANDS = exports.API_OPEN_WITH_EDITOR_COMMAND_ID = exports.API_OPEN_DIFF_EDITOR_COMMAND_ID = exports.API_OPEN_EDITOR_COMMAND_ID = exports.NEW_EMPTY_EDITOR_WINDOW_COMMAND_ID = exports.COPY_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID = exports.MOVE_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID = exports.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID = exports.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID = exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID = exports.FOCUS_BELOW_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_ABOVE_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_RIGHT_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_LEFT_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_OTHER_SIDE_EDITOR = exports.FOCUS_SECOND_SIDE_EDITOR = exports.FOCUS_FIRST_SIDE_EDITOR = exports.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT = exports.JOIN_EDITOR_IN_GROUP = exports.TOGGLE_SPLIT_EDITOR_IN_GROUP = exports.SPLIT_EDITOR_IN_GROUP = exports.TOGGLE_MAXIMIZE_EDITOR_GROUP = exports.SPLIT_EDITOR_RIGHT = exports.SPLIT_EDITOR_LEFT = exports.SPLIT_EDITOR_DOWN = exports.SPLIT_EDITOR_UP = exports.SPLIT_EDITOR = exports.UNPIN_EDITOR_COMMAND_ID = exports.PIN_EDITOR_COMMAND_ID = exports.REOPEN_WITH_COMMAND_ID = exports.SHOW_EDITORS_IN_GROUP = exports.UNLOCK_GROUP_COMMAND_ID = exports.LOCK_GROUP_COMMAND_ID = exports.TOGGLE_LOCK_GROUP_COMMAND_ID = exports.TOGGLE_KEEP_EDITORS_COMMAND_ID = exports.KEEP_EDITOR_COMMAND_ID = exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID = exports.COPY_ACTIVE_EDITOR_COMMAND_ID = exports.MOVE_ACTIVE_EDITOR_COMMAND_ID = exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID = exports.CLOSE_EDITOR_GROUP_COMMAND_ID = exports.CLOSE_PINNED_EDITOR_COMMAND_ID = exports.CLOSE_EDITOR_COMMAND_ID = exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID = exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID = exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID = exports.CLOSE_SAVED_EDITORS_COMMAND_ID = void 0;
    exports.splitEditor = splitEditor;
    exports.getCommandsContext = getCommandsContext;
    exports.resolveCommandsContext = resolveCommandsContext;
    exports.getMultiSelectedEditorContexts = getMultiSelectedEditorContexts;
    exports.setup = setup;
    exports.CLOSE_SAVED_EDITORS_COMMAND_ID = 'workbench.action.closeUnmodifiedEditors';
    exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID = 'workbench.action.closeEditorsInGroup';
    exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID = 'workbench.action.closeEditorsAndGroup';
    exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID = 'workbench.action.closeEditorsToTheRight';
    exports.CLOSE_EDITOR_COMMAND_ID = 'workbench.action.closeActiveEditor';
    exports.CLOSE_PINNED_EDITOR_COMMAND_ID = 'workbench.action.closeActivePinnedEditor';
    exports.CLOSE_EDITOR_GROUP_COMMAND_ID = 'workbench.action.closeGroup';
    exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID = 'workbench.action.closeOtherEditors';
    exports.MOVE_ACTIVE_EDITOR_COMMAND_ID = 'moveActiveEditor';
    exports.COPY_ACTIVE_EDITOR_COMMAND_ID = 'copyActiveEditor';
    exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID = 'layoutEditorGroups';
    exports.KEEP_EDITOR_COMMAND_ID = 'workbench.action.keepEditor';
    exports.TOGGLE_KEEP_EDITORS_COMMAND_ID = 'workbench.action.toggleKeepEditors';
    exports.TOGGLE_LOCK_GROUP_COMMAND_ID = 'workbench.action.toggleEditorGroupLock';
    exports.LOCK_GROUP_COMMAND_ID = 'workbench.action.lockEditorGroup';
    exports.UNLOCK_GROUP_COMMAND_ID = 'workbench.action.unlockEditorGroup';
    exports.SHOW_EDITORS_IN_GROUP = 'workbench.action.showEditorsInGroup';
    exports.REOPEN_WITH_COMMAND_ID = 'workbench.action.reopenWithEditor';
    exports.PIN_EDITOR_COMMAND_ID = 'workbench.action.pinEditor';
    exports.UNPIN_EDITOR_COMMAND_ID = 'workbench.action.unpinEditor';
    exports.SPLIT_EDITOR = 'workbench.action.splitEditor';
    exports.SPLIT_EDITOR_UP = 'workbench.action.splitEditorUp';
    exports.SPLIT_EDITOR_DOWN = 'workbench.action.splitEditorDown';
    exports.SPLIT_EDITOR_LEFT = 'workbench.action.splitEditorLeft';
    exports.SPLIT_EDITOR_RIGHT = 'workbench.action.splitEditorRight';
    exports.TOGGLE_MAXIMIZE_EDITOR_GROUP = 'workbench.action.toggleMaximizeEditorGroup';
    exports.SPLIT_EDITOR_IN_GROUP = 'workbench.action.splitEditorInGroup';
    exports.TOGGLE_SPLIT_EDITOR_IN_GROUP = 'workbench.action.toggleSplitEditorInGroup';
    exports.JOIN_EDITOR_IN_GROUP = 'workbench.action.joinEditorInGroup';
    exports.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT = 'workbench.action.toggleSplitEditorInGroupLayout';
    exports.FOCUS_FIRST_SIDE_EDITOR = 'workbench.action.focusFirstSideEditor';
    exports.FOCUS_SECOND_SIDE_EDITOR = 'workbench.action.focusSecondSideEditor';
    exports.FOCUS_OTHER_SIDE_EDITOR = 'workbench.action.focusOtherSideEditor';
    exports.FOCUS_LEFT_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusLeftGroupWithoutWrap';
    exports.FOCUS_RIGHT_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusRightGroupWithoutWrap';
    exports.FOCUS_ABOVE_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusAboveGroupWithoutWrap';
    exports.FOCUS_BELOW_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusBelowGroupWithoutWrap';
    exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID = 'workbench.action.openEditorAtIndex';
    exports.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID = 'workbench.action.moveEditorToNewWindow';
    exports.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID = 'workbench.action.copyEditorToNewWindow';
    exports.MOVE_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID = 'workbench.action.moveEditorGroupToNewWindow';
    exports.COPY_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID = 'workbench.action.copyEditorGroupToNewWindow';
    exports.NEW_EMPTY_EDITOR_WINDOW_COMMAND_ID = 'workbench.action.newEmptyEditorWindow';
    exports.API_OPEN_EDITOR_COMMAND_ID = '_workbench.open';
    exports.API_OPEN_DIFF_EDITOR_COMMAND_ID = '_workbench.diff';
    exports.API_OPEN_WITH_EDITOR_COMMAND_ID = '_workbench.openWith';
    exports.EDITOR_CORE_NAVIGATION_COMMANDS = [
        exports.SPLIT_EDITOR,
        exports.CLOSE_EDITOR_COMMAND_ID,
        exports.UNPIN_EDITOR_COMMAND_ID,
        exports.UNLOCK_GROUP_COMMAND_ID,
        exports.TOGGLE_MAXIMIZE_EDITOR_GROUP
    ];
    const isActiveEditorMoveCopyArg = function (arg) {
        if (!(0, types_1.isObject)(arg)) {
            return false;
        }
        if (!(0, types_1.isString)(arg.to)) {
            return false;
        }
        if (!(0, types_1.isUndefined)(arg.by) && !(0, types_1.isString)(arg.by)) {
            return false;
        }
        if (!(0, types_1.isUndefined)(arg.value) && !(0, types_1.isNumber)(arg.value)) {
            return false;
        }
        return true;
    };
    function registerActiveEditorMoveCopyCommand() {
        const moveCopyJSONSchema = {
            'type': 'object',
            'required': ['to'],
            'properties': {
                'to': {
                    'type': 'string',
                    'enum': ['left', 'right']
                },
                'by': {
                    'type': 'string',
                    'enum': ['tab', 'group']
                },
                'value': {
                    'type': 'number'
                }
            }
        };
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.MOVE_ACTIVE_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 0,
            handler: (accessor, args) => moveCopyActiveEditor(true, args, accessor),
            metadata: {
                description: (0, nls_1.localize)('editorCommand.activeEditorMove.description', "Move the active editor by tabs or groups"),
                args: [
                    {
                        name: (0, nls_1.localize)('editorCommand.activeEditorMove.arg.name', "Active editor move argument"),
                        description: (0, nls_1.localize)('editorCommand.activeEditorMove.arg.description', "Argument Properties:\n\t* 'to': String value providing where to move.\n\t* 'by': String value providing the unit for move (by tab or by group).\n\t* 'value': Number value providing how many positions or an absolute position to move."),
                        constraint: isActiveEditorMoveCopyArg,
                        schema: moveCopyJSONSchema
                    }
                ]
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.COPY_ACTIVE_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 0,
            handler: (accessor, args) => moveCopyActiveEditor(false, args, accessor),
            metadata: {
                description: (0, nls_1.localize)('editorCommand.activeEditorCopy.description', "Copy the active editor by groups"),
                args: [
                    {
                        name: (0, nls_1.localize)('editorCommand.activeEditorCopy.arg.name', "Active editor copy argument"),
                        description: (0, nls_1.localize)('editorCommand.activeEditorCopy.arg.description', "Argument Properties:\n\t* 'to': String value providing where to copy.\n\t* 'value': Number value providing how many positions or an absolute position to copy."),
                        constraint: isActiveEditorMoveCopyArg,
                        schema: moveCopyJSONSchema
                    }
                ]
            }
        });
        function moveCopyActiveEditor(isMove, args = Object.create(null), accessor) {
            args.to = args.to || 'right';
            args.by = args.by || 'tab';
            args.value = typeof args.value === 'number' ? args.value : 1;
            const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
            if (activeEditorPane) {
                switch (args.by) {
                    case 'tab':
                        if (isMove) {
                            return moveActiveTab(args, activeEditorPane);
                        }
                        break;
                    case 'group':
                        return moveCopyActiveEditorToGroup(isMove, args, activeEditorPane, accessor);
                }
            }
        }
        function moveActiveTab(args, control) {
            const group = control.group;
            let index = group.getIndexOfEditor(control.input);
            switch (args.to) {
                case 'first':
                    index = 0;
                    break;
                case 'last':
                    index = group.count - 1;
                    break;
                case 'left':
                    index = index - args.value;
                    break;
                case 'right':
                    index = index + args.value;
                    break;
                case 'center':
                    index = Math.round(group.count / 2) - 1;
                    break;
                case 'position':
                    index = args.value - 1;
                    break;
            }
            index = index < 0 ? 0 : index >= group.count ? group.count - 1 : index;
            group.moveEditor(control.input, group, { index });
        }
        function moveCopyActiveEditorToGroup(isMove, args, control, accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const sourceGroup = control.group;
            let targetGroup;
            switch (args.to) {
                case 'left':
                    targetGroup = editorGroupService.findGroup({ direction: 2 /* GroupDirection.LEFT */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 2 /* GroupDirection.LEFT */);
                    }
                    break;
                case 'right':
                    targetGroup = editorGroupService.findGroup({ direction: 3 /* GroupDirection.RIGHT */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 3 /* GroupDirection.RIGHT */);
                    }
                    break;
                case 'up':
                    targetGroup = editorGroupService.findGroup({ direction: 0 /* GroupDirection.UP */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 0 /* GroupDirection.UP */);
                    }
                    break;
                case 'down':
                    targetGroup = editorGroupService.findGroup({ direction: 1 /* GroupDirection.DOWN */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 1 /* GroupDirection.DOWN */);
                    }
                    break;
                case 'first':
                    targetGroup = editorGroupService.findGroup({ location: 0 /* GroupLocation.FIRST */ }, sourceGroup);
                    break;
                case 'last':
                    targetGroup = editorGroupService.findGroup({ location: 1 /* GroupLocation.LAST */ }, sourceGroup);
                    break;
                case 'previous':
                    targetGroup = editorGroupService.findGroup({ location: 3 /* GroupLocation.PREVIOUS */ }, sourceGroup);
                    break;
                case 'next':
                    targetGroup = editorGroupService.findGroup({ location: 2 /* GroupLocation.NEXT */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService));
                    }
                    break;
                case 'center':
                    targetGroup = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[(editorGroupService.count / 2) - 1];
                    break;
                case 'position':
                    targetGroup = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[args.value - 1];
                    break;
            }
            if (targetGroup) {
                if (isMove) {
                    sourceGroup.moveEditor(control.input, targetGroup);
                }
                else if (sourceGroup.id !== targetGroup.id) {
                    sourceGroup.copyEditor(control.input, targetGroup);
                }
                targetGroup.focus();
            }
        }
    }
    function registerEditorGroupsLayoutCommands() {
        function applyEditorLayout(accessor, layout) {
            if (!layout || typeof layout !== 'object') {
                return;
            }
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.applyLayout(layout);
        }
        commands_1.CommandsRegistry.registerCommand(exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID, (accessor, args) => {
            applyEditorLayout(accessor, args);
        });
        // API Commands
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.setEditorLayout',
            handler: (accessor, args) => applyEditorLayout(accessor, args),
            metadata: {
                description: 'Set Editor Layout',
                args: [{
                        name: 'args',
                        schema: {
                            'type': 'object',
                            'required': ['groups'],
                            'properties': {
                                'orientation': {
                                    'type': 'number',
                                    'default': 0,
                                    'enum': [0, 1]
                                },
                                'groups': {
                                    '$ref': '#/definitions/editorGroupsSchema',
                                    'default': [{}, {}]
                                }
                            }
                        }
                    }]
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.getEditorLayout',
            handler: (accessor) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                return editorGroupService.getLayout();
            },
            metadata: {
                description: 'Get Editor Layout',
                args: [],
                returns: 'An editor layout object, in the same format as vscode.setEditorLayout'
            }
        });
    }
    function registerOpenEditorAPICommands() {
        function mixinContext(context, options, column) {
            if (!context) {
                return [options, column];
            }
            return [
                { ...context.editorOptions, ...(options ?? Object.create(null)) },
                context.sideBySide ? editorService_1.SIDE_GROUP : column
            ];
        }
        // partial, renderer-side API command to open editor
        // complements https://github.com/microsoft/vscode/blob/2b164efb0e6a5de3826bff62683eaeafe032284f/src/vs/workbench/api/common/extHostApiCommands.ts#L373
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.open',
            handler: (accessor, arg) => {
                accessor.get(commands_1.ICommandService).executeCommand(exports.API_OPEN_EDITOR_COMMAND_ID, arg);
            },
            metadata: {
                description: 'Opens the provided resource in the editor.',
                args: [{ name: 'Uri' }]
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.API_OPEN_EDITOR_COMMAND_ID, async function (accessor, resourceArg, columnAndOptions, label, context) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const pathService = accessor.get(pathService_1.IPathService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const untitledTextEditorService = accessor.get(untitledTextEditorService_1.IUntitledTextEditorService);
            const resourceOrString = typeof resourceArg === 'string' ? resourceArg : uri_1.URI.from(resourceArg, true);
            const [columnArg, optionsArg] = columnAndOptions ?? [];
            // use editor options or editor view column or resource scheme
            // as a hint to use the editor service for opening directly
            if (optionsArg || typeof columnArg === 'number' || (0, network_1.matchesScheme)(resourceOrString, network_1.Schemas.untitled)) {
                const [options, column] = mixinContext(context, optionsArg, columnArg);
                const resource = uri_1.URI.isUri(resourceOrString) ? resourceOrString : uri_1.URI.parse(resourceOrString);
                let input;
                if (untitledTextEditorService.isUntitledWithAssociatedResource(resource)) {
                    // special case for untitled: we are getting a resource with meaningful
                    // path from an extension to use for the untitled editor. as such, we
                    // have to assume it as an associated resource to use when saving. we
                    // do so by setting the `forceUntitled: true` and changing the scheme
                    // to a file based one. the untitled editor service takes care to
                    // associate the path properly then.
                    input = { resource: resource.with({ scheme: pathService.defaultUriScheme }), forceUntitled: true, options, label };
                }
                else {
                    // use any other resource as is
                    input = { resource, options, label };
                }
                await editorService.openEditor(input, (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, configurationService, column));
            }
            // do not allow to execute commands from here
            else if ((0, network_1.matchesScheme)(resourceOrString, network_1.Schemas.command)) {
                return;
            }
            // finally, delegate to opener service
            else {
                await openerService.open(resourceOrString, { openToSide: context?.sideBySide, editorOptions: context?.editorOptions });
            }
        });
        // partial, renderer-side API command to open diff editor
        // complements https://github.com/microsoft/vscode/blob/2b164efb0e6a5de3826bff62683eaeafe032284f/src/vs/workbench/api/common/extHostApiCommands.ts#L397
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.diff',
            handler: (accessor, left, right, label) => {
                accessor.get(commands_1.ICommandService).executeCommand(exports.API_OPEN_DIFF_EDITOR_COMMAND_ID, left, right, label);
            },
            metadata: {
                description: 'Opens the provided resources in the diff editor to compare their contents.',
                args: [
                    { name: 'left', description: 'Left-hand side resource of the diff editor' },
                    { name: 'right', description: 'Right-hand side resource of the diff editor' },
                    { name: 'title', description: 'Human readable title for the diff editor' },
                ]
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.API_OPEN_DIFF_EDITOR_COMMAND_ID, async function (accessor, originalResource, modifiedResource, labelAndOrDescription, columnAndOptions, context) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const [columnArg, optionsArg] = columnAndOptions ?? [];
            const [options, column] = mixinContext(context, optionsArg, columnArg);
            let label = undefined;
            let description = undefined;
            if (typeof labelAndOrDescription === 'string') {
                label = labelAndOrDescription;
            }
            else if (labelAndOrDescription) {
                label = labelAndOrDescription.label;
                description = labelAndOrDescription.description;
            }
            await editorService.openEditor({
                original: { resource: uri_1.URI.from(originalResource, true) },
                modified: { resource: uri_1.URI.from(modifiedResource, true) },
                label,
                description,
                options
            }, (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, configurationService, column));
        });
        commands_1.CommandsRegistry.registerCommand(exports.API_OPEN_WITH_EDITOR_COMMAND_ID, async (accessor, resource, id, columnAndOptions) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const [columnArg, optionsArg] = columnAndOptions ?? [];
            await editorService.openEditor({ resource: uri_1.URI.from(resource, true), options: { ...optionsArg, pinned: true, override: id } }, (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupsService, configurationService, columnArg));
        });
        // partial, renderer-side API command to open diff editor
        // complements https://github.com/microsoft/vscode/blob/2b164efb0e6a5de3826bff62683eaeafe032284f/src/vs/workbench/api/common/extHostApiCommands.ts#L397
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.changes',
            handler: (accessor, title, resources) => {
                accessor.get(commands_1.ICommandService).executeCommand('_workbench.changes', title, resources);
            },
            metadata: {
                description: 'Opens a list of resources in the changes editor to compare their contents.',
                args: [
                    { name: 'title', description: 'Human readable title for the diff editor' },
                    { name: 'resources', description: 'List of resources to open in the changes editor' }
                ]
            }
        });
        commands_1.CommandsRegistry.registerCommand('_workbench.changes', async (accessor, title, resources) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = [];
            for (const [label, original, modified] of resources) {
                editor.push({
                    resource: uri_1.URI.revive(label),
                    original: { resource: uri_1.URI.revive(original) },
                    modified: { resource: uri_1.URI.revive(modified) },
                });
            }
            await editorService.openEditor({ resources: editor, label: title });
        });
        commands_1.CommandsRegistry.registerCommand('_workbench.openMultiDiffEditor', async (accessor, options) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            await editorService.openEditor({
                multiDiffSource: options.multiDiffSourceUri ? uri_1.URI.revive(options.multiDiffSourceUri) : undefined,
                resources: options.resources?.map(r => ({ original: { resource: uri_1.URI.revive(r.originalUri) }, modified: { resource: uri_1.URI.revive(r.modifiedUri) } })),
                label: options.title,
            });
        });
    }
    function registerOpenEditorAtIndexCommands() {
        const openEditorAtIndex = (accessor, editorIndex) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane) {
                const editor = activeEditorPane.group.getEditorByIndex(editorIndex);
                if (editor) {
                    editorService.openEditor(editor);
                }
            }
        };
        // This command takes in the editor index number to open as an argument
        commands_1.CommandsRegistry.registerCommand({
            id: exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID,
            handler: openEditorAtIndex
        });
        // Keybindings to focus a specific index in the tab folder if tabs are enabled
        for (let i = 0; i < 9; i++) {
            const editorIndex = i;
            const visibleIndex = i + 1;
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID + visibleIndex,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: undefined,
                primary: 512 /* KeyMod.Alt */ | toKeyCode(visibleIndex),
                mac: { primary: 256 /* KeyMod.WinCtrl */ | toKeyCode(visibleIndex) },
                handler: accessor => openEditorAtIndex(accessor, editorIndex)
            });
        }
        function toKeyCode(index) {
            switch (index) {
                case 0: return 21 /* KeyCode.Digit0 */;
                case 1: return 22 /* KeyCode.Digit1 */;
                case 2: return 23 /* KeyCode.Digit2 */;
                case 3: return 24 /* KeyCode.Digit3 */;
                case 4: return 25 /* KeyCode.Digit4 */;
                case 5: return 26 /* KeyCode.Digit5 */;
                case 6: return 27 /* KeyCode.Digit6 */;
                case 7: return 28 /* KeyCode.Digit7 */;
                case 8: return 29 /* KeyCode.Digit8 */;
                case 9: return 30 /* KeyCode.Digit9 */;
            }
            throw new Error('invalid index');
        }
    }
    function registerFocusEditorGroupAtIndexCommands() {
        // Keybindings to focus a specific group (2-8) in the editor area
        for (let groupIndex = 1; groupIndex < 8; groupIndex++) {
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: toCommandId(groupIndex),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: undefined,
                primary: 2048 /* KeyMod.CtrlCmd */ | toKeyCode(groupIndex),
                handler: accessor => {
                    const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                    const configurationService = accessor.get(configuration_1.IConfigurationService);
                    // To keep backwards compatibility (pre-grid), allow to focus a group
                    // that does not exist as long as it is the next group after the last
                    // opened group. Otherwise we return.
                    if (groupIndex > editorGroupService.count) {
                        return;
                    }
                    // Group exists: just focus
                    const groups = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
                    if (groups[groupIndex]) {
                        return groups[groupIndex].focus();
                    }
                    // Group does not exist: create new by splitting the active one of the last group
                    const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
                    const lastGroup = editorGroupService.findGroup({ location: 1 /* GroupLocation.LAST */ });
                    if (!lastGroup) {
                        return;
                    }
                    const newGroup = editorGroupService.addGroup(lastGroup, direction);
                    // Focus
                    newGroup.focus();
                }
            });
        }
        function toCommandId(index) {
            switch (index) {
                case 1: return 'workbench.action.focusSecondEditorGroup';
                case 2: return 'workbench.action.focusThirdEditorGroup';
                case 3: return 'workbench.action.focusFourthEditorGroup';
                case 4: return 'workbench.action.focusFifthEditorGroup';
                case 5: return 'workbench.action.focusSixthEditorGroup';
                case 6: return 'workbench.action.focusSeventhEditorGroup';
                case 7: return 'workbench.action.focusEighthEditorGroup';
            }
            throw new Error('Invalid index');
        }
        function toKeyCode(index) {
            switch (index) {
                case 1: return 23 /* KeyCode.Digit2 */;
                case 2: return 24 /* KeyCode.Digit3 */;
                case 3: return 25 /* KeyCode.Digit4 */;
                case 4: return 26 /* KeyCode.Digit5 */;
                case 5: return 27 /* KeyCode.Digit6 */;
                case 6: return 28 /* KeyCode.Digit7 */;
                case 7: return 29 /* KeyCode.Digit8 */;
            }
            throw new Error('Invalid index');
        }
    }
    function splitEditor(editorGroupService, direction, context) {
        let sourceGroup;
        if (context && typeof context.groupId === 'number') {
            sourceGroup = editorGroupService.getGroup(context.groupId);
        }
        else {
            sourceGroup = editorGroupService.activeGroup;
        }
        if (!sourceGroup) {
            return;
        }
        // Add group
        const newGroup = editorGroupService.addGroup(sourceGroup, direction);
        // Split editor (if it can be split)
        let editorToCopy;
        if (context && typeof context.editorIndex === 'number') {
            editorToCopy = sourceGroup.getEditorByIndex(context.editorIndex);
        }
        else {
            editorToCopy = sourceGroup.activeEditor ?? undefined;
        }
        // Copy the editor to the new group, else create an empty group
        if (editorToCopy && !editorToCopy.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
            sourceGroup.copyEditor(editorToCopy, newGroup, { preserveFocus: context?.preserveFocus });
        }
        // Focus
        newGroup.focus();
    }
    function registerSplitEditorCommands() {
        [
            { id: exports.SPLIT_EDITOR_UP, direction: 0 /* GroupDirection.UP */ },
            { id: exports.SPLIT_EDITOR_DOWN, direction: 1 /* GroupDirection.DOWN */ },
            { id: exports.SPLIT_EDITOR_LEFT, direction: 2 /* GroupDirection.LEFT */ },
            { id: exports.SPLIT_EDITOR_RIGHT, direction: 3 /* GroupDirection.RIGHT */ }
        ].forEach(({ id, direction }) => {
            commands_1.CommandsRegistry.registerCommand(id, function (accessor, resourceOrContext, context) {
                splitEditor(accessor.get(editorGroupsService_1.IEditorGroupsService), direction, getCommandsContext(resourceOrContext, context));
            });
        });
    }
    function registerCloseEditorCommands() {
        // A special handler for "Close Editor" depending on context
        // - keybindining: do not close sticky editors, rather open the next non-sticky editor
        // - menu: always close editor, even sticky ones
        function closeEditorHandler(accessor, forceCloseStickyEditors, resourceOrContext, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const editorService = accessor.get(editorService_1.IEditorService);
            let keepStickyEditors = undefined;
            if (forceCloseStickyEditors) {
                keepStickyEditors = false; // explicitly close sticky editors
            }
            else if (resourceOrContext || context) {
                keepStickyEditors = false; // we have a context, as such this command was used e.g. from the tab context menu
            }
            else {
                keepStickyEditors = editorGroupsService.partOptions.preventPinnedEditorClose === 'keyboard' || editorGroupsService.partOptions.preventPinnedEditorClose === 'keyboardAndMouse'; // respect setting otherwise
            }
            // Skip over sticky editor and select next if we are configured to do so
            if (keepStickyEditors) {
                const activeGroup = editorGroupsService.activeGroup;
                const activeEditor = activeGroup.activeEditor;
                if (activeEditor && activeGroup.isSticky(activeEditor)) {
                    // Open next recently active in same group
                    const nextNonStickyEditorInGroup = activeGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true })[0];
                    if (nextNonStickyEditorInGroup) {
                        return activeGroup.openEditor(nextNonStickyEditorInGroup);
                    }
                    // Open next recently active across all groups
                    const nextNonStickyEditorInAllGroups = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true })[0];
                    if (nextNonStickyEditorInAllGroups) {
                        return Promise.resolve(editorGroupsService.getGroup(nextNonStickyEditorInAllGroups.groupId)?.openEditor(nextNonStickyEditorInAllGroups.editor));
                    }
                }
            }
            // With context: proceed to close editors as instructed
            const { editors, groups } = getEditorsContext(accessor, resourceOrContext, context);
            return Promise.all(groups.map(async (group) => {
                if (group) {
                    const editorsToClose = (0, arrays_1.coalesce)(editors
                        .filter(editor => editor.groupId === group.id)
                        .map(editor => typeof editor.editorIndex === 'number' ? group.getEditorByIndex(editor.editorIndex) : group.activeEditor))
                        .filter(editor => !keepStickyEditors || !group.isSticky(editor));
                    await group.closeEditors(editorsToClose, { preserveFocus: context?.preserveFocus });
                }
            }));
        }
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */] },
            handler: (accessor, resourceOrContext, context) => {
                return closeEditorHandler(accessor, false, resourceOrContext, context);
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.CLOSE_PINNED_EDITOR_COMMAND_ID, (accessor, resourceOrContext, context) => {
            return closeEditorHandler(accessor, true /* force close pinned editors */, resourceOrContext, context);
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 53 /* KeyCode.KeyW */),
            handler: (accessor, resourceOrContext, context) => {
                return Promise.all(getEditorsContext(accessor, resourceOrContext, context).groups.map(async (group) => {
                    if (group) {
                        await group.closeAllEditors({ excludeSticky: true });
                        return;
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITOR_GROUP_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ActiveEditorGroupEmptyContext, contextkeys_1.MultipleEditorGroupsContext),
            primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */] },
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const commandsContext = getCommandsContext(resourceOrContext, context);
                let group;
                if (commandsContext && typeof commandsContext.groupId === 'number') {
                    group = editorGroupService.getGroup(commandsContext.groupId);
                }
                else {
                    group = editorGroupService.activeGroup;
                }
                if (group) {
                    editorGroupService.removeGroup(group);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_SAVED_EDITORS_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 51 /* KeyCode.KeyU */),
            handler: (accessor, resourceOrContext, context) => {
                return Promise.all(getEditorsContext(accessor, resourceOrContext, context).groups.map(async (group) => {
                    if (group) {
                        await group.closeEditors({ savedOnly: true, excludeSticky: true }, { preserveFocus: context?.preserveFocus });
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 50 /* KeyCode.KeyT */ },
            handler: (accessor, resourceOrContext, context) => {
                const { editors, groups } = getEditorsContext(accessor, resourceOrContext, context);
                return Promise.all(groups.map(async (group) => {
                    if (group) {
                        const editorsToKeep = editors
                            .filter(editor => editor.groupId === group.id)
                            .map(editor => typeof editor.editorIndex === 'number' ? group.getEditorByIndex(editor.editorIndex) : group.activeEditor);
                        const editorsToClose = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).filter(editor => !editorsToKeep.includes(editor));
                        for (const editorToKeep of editorsToKeep) {
                            if (editorToKeep) {
                                group.pinEditor(editorToKeep);
                            }
                        }
                        await group.closeEditors(editorsToClose, { preserveFocus: context?.preserveFocus });
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    if (group.activeEditor) {
                        group.pinEditor(group.activeEditor);
                    }
                    await group.closeEditors({ direction: 1 /* CloseDirection.RIGHT */, except: editor, excludeSticky: true }, { preserveFocus: context?.preserveFocus });
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.REOPEN_WITH_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const editorResolverService = accessor.get(editorResolverService_1.IEditorResolverService);
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (!editor) {
                    return;
                }
                const untypedEditor = editor.toUntyped();
                // Resolver can only resolve untyped editors
                if (!untypedEditor) {
                    return;
                }
                untypedEditor.options = { ...editorService.activeEditorPane?.options, override: editor_1.EditorResolution.PICK };
                const resolvedEditor = await editorResolverService.resolveEditor(untypedEditor, group);
                if (!(0, editor_2.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                    return;
                }
                // Replace editor with resolved one
                await resolvedEditor.group.replaceEditors([
                    {
                        editor: editor,
                        replacement: resolvedEditor.editor,
                        forceReplaceDirty: editor.resource?.scheme === network_1.Schemas.untitled,
                        options: resolvedEditor.options
                    }
                ]);
                telemetryService.publicLog2('workbenchEditorReopen', {
                    scheme: editor.resource?.scheme ?? '',
                    ext: editor.resource ? (0, resources_1.extname)(editor.resource) : '',
                    from: editor.editorId ?? '',
                    to: resolvedEditor.editor.editorId ?? ''
                });
                // Make sure it becomes active too
                await resolvedEditor.group.openEditor(resolvedEditor.editor);
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, async (accessor, resourceOrContext, context) => {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (group) {
                await group.closeAllEditors();
                if (group.count === 0 && editorGroupService.getGroup(group.id) /* could be gone by now */) {
                    editorGroupService.removeGroup(group); // only remove group if it is now empty
                }
            }
        });
    }
    function registerFocusEditorGroupWihoutWrapCommands() {
        const commands = [
            {
                id: exports.FOCUS_LEFT_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 2 /* GroupDirection.LEFT */
            },
            {
                id: exports.FOCUS_RIGHT_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 3 /* GroupDirection.RIGHT */
            },
            {
                id: exports.FOCUS_ABOVE_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 0 /* GroupDirection.UP */,
            },
            {
                id: exports.FOCUS_BELOW_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 1 /* GroupDirection.DOWN */
            }
        ];
        for (const command of commands) {
            commands_1.CommandsRegistry.registerCommand(command.id, async (accessor) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const group = editorGroupService.findGroup({ direction: command.direction }, editorGroupService.activeGroup, false);
                group?.focus();
            });
        }
    }
    function registerSplitEditorInGroupCommands() {
        async function splitEditorInGroup(accessor, resourceOrContext, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (!editor) {
                return;
            }
            await group.replaceEditors([{
                    editor,
                    replacement: instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, undefined, undefined, editor, editor),
                    forceReplaceDirty: true
                }]);
        }
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.SPLIT_EDITOR_IN_GROUP,
                    title: (0, nls_1.localize2)('splitEditorInGroup', 'Split Editor in Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkeys_1.ActiveEditorCanSplitInGroupContext,
                    f1: true,
                    keybinding: {
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkeys_1.ActiveEditorCanSplitInGroupContext,
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 93 /* KeyCode.Backslash */)
                    }
                });
            }
            run(accessor, resourceOrContext, context) {
                return splitEditorInGroup(accessor, resourceOrContext, context);
            }
        });
        async function joinEditorInGroup(accessor, resourceOrContext, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (!(editor instanceof sideBySideEditorInput_1.SideBySideEditorInput)) {
                return;
            }
            let options = undefined;
            const activeEditorPane = group.activeEditorPane;
            if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor && group.activeEditor === editor) {
                for (const pane of [activeEditorPane.getPrimaryEditorPane(), activeEditorPane.getSecondaryEditorPane()]) {
                    if (pane?.hasFocus()) {
                        options = { viewState: pane.getViewState() };
                        break;
                    }
                }
            }
            await group.replaceEditors([{
                    editor,
                    replacement: editor.primary,
                    options
                }]);
        }
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.JOIN_EDITOR_IN_GROUP,
                    title: (0, nls_1.localize2)('joinEditorInGroup', 'Join Editor in Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkeys_1.SideBySideEditorActiveContext,
                    f1: true,
                    keybinding: {
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkeys_1.SideBySideEditorActiveContext,
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 93 /* KeyCode.Backslash */)
                    }
                });
            }
            run(accessor, resourceOrContext, context) {
                return joinEditorInGroup(accessor, resourceOrContext, context);
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.TOGGLE_SPLIT_EDITOR_IN_GROUP,
                    title: (0, nls_1.localize2)('toggleJoinEditorInGroup', 'Toggle Split Editor in Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorCanSplitInGroupContext, contextkeys_1.SideBySideEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                    await joinEditorInGroup(accessor, resourceOrContext, context);
                }
                else if (editor) {
                    await splitEditorInGroup(accessor, resourceOrContext, context);
                }
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT,
                    title: (0, nls_1.localize2)('toggleSplitEditorInGroupLayout', 'Toggle Layout of Split Editor in Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkeys_1.SideBySideEditorActiveContext,
                    f1: true
                });
            }
            async run(accessor) {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const currentSetting = configurationService.getValue(sideBySideEditor_1.SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING);
                let newSetting;
                if (currentSetting !== 'horizontal') {
                    newSetting = 'horizontal';
                }
                else {
                    newSetting = 'vertical';
                }
                return configurationService.updateValue(sideBySideEditor_1.SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING, newSetting);
            }
        });
    }
    function registerFocusSideEditorsCommands() {
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.FOCUS_FIRST_SIDE_EDITOR,
                    title: (0, nls_1.localize2)('focusLeftSideEditor', 'Focus First Side in Active Editor'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor) {
                const editorService = accessor.get(editorService_1.IEditorService);
                const commandService = accessor.get(commands_1.ICommandService);
                const activeEditorPane = editorService.activeEditorPane;
                if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor) {
                    activeEditorPane.getSecondaryEditorPane()?.focus();
                }
                else if (activeEditorPane instanceof textDiffEditor_1.TextDiffEditor) {
                    await commandService.executeCommand(diffEditorCommands_1.DIFF_FOCUS_SECONDARY_SIDE);
                }
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.FOCUS_SECOND_SIDE_EDITOR,
                    title: (0, nls_1.localize2)('focusRightSideEditor', 'Focus Second Side in Active Editor'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor) {
                const editorService = accessor.get(editorService_1.IEditorService);
                const commandService = accessor.get(commands_1.ICommandService);
                const activeEditorPane = editorService.activeEditorPane;
                if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor) {
                    activeEditorPane.getPrimaryEditorPane()?.focus();
                }
                else if (activeEditorPane instanceof textDiffEditor_1.TextDiffEditor) {
                    await commandService.executeCommand(diffEditorCommands_1.DIFF_FOCUS_PRIMARY_SIDE);
                }
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.FOCUS_OTHER_SIDE_EDITOR,
                    title: (0, nls_1.localize2)('focusOtherSideEditor', 'Focus Other Side in Active Editor'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor) {
                const editorService = accessor.get(editorService_1.IEditorService);
                const commandService = accessor.get(commands_1.ICommandService);
                const activeEditorPane = editorService.activeEditorPane;
                if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor) {
                    if (activeEditorPane.getPrimaryEditorPane()?.hasFocus()) {
                        activeEditorPane.getSecondaryEditorPane()?.focus();
                    }
                    else {
                        activeEditorPane.getPrimaryEditorPane()?.focus();
                    }
                }
                else if (activeEditorPane instanceof textDiffEditor_1.TextDiffEditor) {
                    await commandService.executeCommand(diffEditorCommands_1.DIFF_FOCUS_OTHER_SIDE);
                }
            }
        });
    }
    function registerOtherEditorCommands() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.KEEP_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 3 /* KeyCode.Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.pinEditor(editor);
                }
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.TOGGLE_KEEP_EDITORS_COMMAND_ID,
            handler: accessor => {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const currentSetting = configurationService.getValue('workbench.editor.enablePreview');
                const newSetting = currentSetting === true ? false : true;
                configurationService.updateValue('workbench.editor.enablePreview', newSetting);
            }
        });
        function setEditorGroupLock(accessor, resourceOrContext, context, locked) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            group?.lock(locked ?? !group.isLocked);
        }
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.TOGGLE_LOCK_GROUP_COMMAND_ID,
                    title: (0, nls_1.localize2)('toggleEditorGroupLock', 'Toggle Editor Group Lock'),
                    category: actionCommonCategories_1.Categories.View,
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                setEditorGroupLock(accessor, resourceOrContext, context);
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.LOCK_GROUP_COMMAND_ID,
                    title: (0, nls_1.localize2)('lockEditorGroup', 'Lock Editor Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkeys_1.ActiveEditorGroupLockedContext.toNegated(),
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                setEditorGroupLock(accessor, resourceOrContext, context, true);
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.UNLOCK_GROUP_COMMAND_ID,
                    title: (0, nls_1.localize2)('unlockEditorGroup', 'Unlock Editor Group'),
                    precondition: contextkeys_1.ActiveEditorGroupLockedContext,
                    category: actionCommonCategories_1.Categories.View,
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                setEditorGroupLock(accessor, resourceOrContext, context, false);
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.PIN_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.ActiveEditorStickyContext.toNegated(),
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.stickEditor(editor);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: diffEditorCommands_1.DIFF_OPEN_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: editorContextKeys_1.EditorContextKeys.inDiffEditor,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 45 /* KeyCode.KeyO */),
            handler: async (accessor) => {
                const editorService = accessor.get(editorService_1.IEditorService);
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const activeEditor = editorService.activeEditor;
                const activeTextEditorControl = editorService.activeTextEditorControl;
                if (!(0, editorBrowser_1.isDiffEditor)(activeTextEditorControl) || !(activeEditor instanceof diffEditorInput_1.DiffEditorInput)) {
                    return;
                }
                let editor;
                const originalEditor = activeTextEditorControl.getOriginalEditor();
                if (originalEditor.hasTextFocus()) {
                    editor = activeEditor.original;
                }
                else {
                    editor = activeEditor.modified;
                }
                return editorGroupService.activeGroup.openEditor(editor);
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.UNPIN_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.ActiveEditorStickyContext,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.unstickEditor(editor);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.SHOW_EDITORS_IN_GROUP,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const commandsContext = getCommandsContext(resourceOrContext, context);
                if (commandsContext && typeof commandsContext.groupId === 'number') {
                    const group = editorGroupService.getGroup(commandsContext.groupId);
                    if (group) {
                        editorGroupService.activateGroup(group); // we need the group to be active
                    }
                }
                return quickInputService.quickAccess.show(editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX);
            }
        });
    }
    function getEditorsContext(accessor, resourceOrContext, context) {
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const listService = accessor.get(listService_1.IListService);
        const editorContext = getMultiSelectedEditorContexts(getCommandsContext(resourceOrContext, context), listService, editorGroupService);
        const activeGroup = editorGroupService.activeGroup;
        if (editorContext.length === 0 && activeGroup.activeEditor) {
            // add the active editor as fallback
            editorContext.push({
                groupId: activeGroup.id,
                editorIndex: activeGroup.getIndexOfEditor(activeGroup.activeEditor)
            });
        }
        return {
            editors: editorContext,
            groups: (0, arrays_1.distinct)(editorContext.map(context => context.groupId)).map(groupId => editorGroupService.getGroup(groupId))
        };
    }
    function getCommandsContext(resourceOrContext, context) {
        if (uri_1.URI.isUri(resourceOrContext)) {
            return context;
        }
        if (resourceOrContext && typeof resourceOrContext.groupId === 'number') {
            return resourceOrContext;
        }
        if (context && typeof context.groupId === 'number') {
            return context;
        }
        return undefined;
    }
    function resolveCommandsContext(editorGroupService, context) {
        // Resolve from context
        let group = context && typeof context.groupId === 'number' ? editorGroupService.getGroup(context.groupId) : undefined;
        let editor = group && context && typeof context.editorIndex === 'number' ? group.getEditorByIndex(context.editorIndex) ?? undefined : undefined;
        // Fallback to active group as needed
        if (!group) {
            group = editorGroupService.activeGroup;
        }
        // Fallback to active editor as needed
        if (!editor) {
            editor = group.activeEditor ?? undefined;
        }
        return { group, editor };
    }
    function getMultiSelectedEditorContexts(editorContext, listService, editorGroupService) {
        // First check for a focused list to return the selected items from
        const list = listService.lastFocusedList;
        if (list instanceof listWidget_1.List && list.getHTMLElement() === (0, dom_1.getActiveElement)()) {
            const elementToContext = (element) => {
                if ((0, editorGroupsService_1.isEditorGroup)(element)) {
                    return { groupId: element.id, editorIndex: undefined };
                }
                const group = editorGroupService.getGroup(element.groupId);
                return { groupId: element.groupId, editorIndex: group ? group.getIndexOfEditor(element.editor) : -1 };
            };
            const onlyEditorGroupAndEditor = (e) => (0, editorGroupsService_1.isEditorGroup)(e) || (0, editor_2.isEditorIdentifier)(e);
            const focusedElements = list.getFocusedElements().filter(onlyEditorGroupAndEditor);
            const focus = editorContext ? editorContext : focusedElements.length ? focusedElements.map(elementToContext)[0] : undefined; // need to take into account when editor context is { group: group }
            if (focus) {
                const selection = list.getSelectedElements().filter(onlyEditorGroupAndEditor);
                if (selection.length > 1) {
                    return selection.map(elementToContext);
                }
                return [focus];
            }
        }
        // Otherwise go with passed in context
        return !!editorContext ? [editorContext] : [];
    }
    function setup() {
        registerActiveEditorMoveCopyCommand();
        registerEditorGroupsLayoutCommands();
        (0, diffEditorCommands_1.registerDiffEditorCommands)();
        registerOpenEditorAPICommands();
        registerOpenEditorAtIndexCommands();
        registerCloseEditorCommands();
        registerOtherEditorCommands();
        registerSplitEditorInGroupCommands();
        registerFocusSideEditorsCommands();
        registerFocusEditorGroupAtIndexCommands();
        registerSplitEditorCommands();
        registerFocusEditorGroupWihoutWrapCommands();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQ29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yQ29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK29CaEcsa0NBOEJDO0lBeXFCRCxnREFjQztJQUVELHdEQWlCQztJQUVELHdFQWlDQztJQUVELHNCQWFDO0lBLzNDWSxRQUFBLDhCQUE4QixHQUFHLHlDQUF5QyxDQUFDO0lBQzNFLFFBQUEsaUNBQWlDLEdBQUcsc0NBQXNDLENBQUM7SUFDM0UsUUFBQSxrQ0FBa0MsR0FBRyx1Q0FBdUMsQ0FBQztJQUM3RSxRQUFBLHFDQUFxQyxHQUFHLHlDQUF5QyxDQUFDO0lBQ2xGLFFBQUEsdUJBQXVCLEdBQUcsb0NBQW9DLENBQUM7SUFDL0QsUUFBQSw4QkFBOEIsR0FBRywwQ0FBMEMsQ0FBQztJQUM1RSxRQUFBLDZCQUE2QixHQUFHLDZCQUE2QixDQUFDO0lBQzlELFFBQUEsdUNBQXVDLEdBQUcsb0NBQW9DLENBQUM7SUFFL0UsUUFBQSw2QkFBNkIsR0FBRyxrQkFBa0IsQ0FBQztJQUNuRCxRQUFBLDZCQUE2QixHQUFHLGtCQUFrQixDQUFDO0lBQ25ELFFBQUEsK0JBQStCLEdBQUcsb0JBQW9CLENBQUM7SUFDdkQsUUFBQSxzQkFBc0IsR0FBRyw2QkFBNkIsQ0FBQztJQUN2RCxRQUFBLDhCQUE4QixHQUFHLG9DQUFvQyxDQUFDO0lBQ3RFLFFBQUEsNEJBQTRCLEdBQUcsd0NBQXdDLENBQUM7SUFDeEUsUUFBQSxxQkFBcUIsR0FBRyxrQ0FBa0MsQ0FBQztJQUMzRCxRQUFBLHVCQUF1QixHQUFHLG9DQUFvQyxDQUFDO0lBQy9ELFFBQUEscUJBQXFCLEdBQUcscUNBQXFDLENBQUM7SUFDOUQsUUFBQSxzQkFBc0Is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