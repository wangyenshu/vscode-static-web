/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/editor/common/editor", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, configuration_1, editor_1, editor_2, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findGroup = findGroup;
    function findGroup(accessor, editor, preferredGroup) {
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const group = doFindGroup(editor, preferredGroup, editorGroupService, configurationService);
        if (group instanceof Promise) {
            return group.then(group => handleGroupActivation(group, editor, preferredGroup, editorGroupService));
        }
        return handleGroupActivation(group, editor, preferredGroup, editorGroupService);
    }
    function handleGroupActivation(group, editor, preferredGroup, editorGroupService) {
        // Resolve editor activation strategy
        let activation = undefined;
        if (editorGroupService.activeGroup !== group && // only if target group is not already active
            editor.options && !editor.options.inactive && // never for inactive editors
            editor.options.preserveFocus && // only if preserveFocus
            typeof editor.options.activation !== 'number' && // only if activation is not already defined (either true or false)
            preferredGroup !== editorService_1.SIDE_GROUP // never for the SIDE_GROUP
        ) {
            // If the resolved group is not the active one, we typically
            // want the group to become active. There are a few cases
            // where we stay away from encorcing this, e.g. if the caller
            // is already providing `activation`.
            //
            // Specifically for historic reasons we do not activate a
            // group is it is opened as `SIDE_GROUP` with `preserveFocus:true`.
            // repeated Alt-clicking of files in the explorer always open
            // into the same side group and not cause a group to be created each time.
            activation = editor_1.EditorActivation.ACTIVATE;
        }
        return [group, activation];
    }
    function doFindGroup(input, preferredGroup, editorGroupService, configurationService) {
        let group;
        const editor = (0, editor_2.isEditorInputWithOptions)(input) ? input.editor : input;
        const options = input.options;
        // Group: Instance of Group
        if (preferredGroup && typeof preferredGroup !== 'number') {
            group = preferredGroup;
        }
        // Group: Specific Group
        else if (typeof preferredGroup === 'number' && preferredGroup >= 0) {
            group = editorGroupService.getGroup(preferredGroup);
        }
        // Group: Side by Side
        else if (preferredGroup === editorService_1.SIDE_GROUP) {
            const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
            let candidateGroup = editorGroupService.findGroup({ direction });
            if (!candidateGroup || isGroupLockedForEditor(candidateGroup, editor)) {
                // Create new group either when the candidate group
                // is locked or was not found in the direction
                candidateGroup = editorGroupService.addGroup(editorGroupService.activeGroup, direction);
            }
            group = candidateGroup;
        }
        // Group: Aux Window
        else if (preferredGroup === editorService_1.AUX_WINDOW_GROUP) {
            group = editorGroupService.createAuxiliaryEditorPart().then(group => group.activeGroup);
        }
        // Group: Unspecified without a specific index to open
        else if (!options || typeof options.index !== 'number') {
            const groupsByLastActive = editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            // Respect option to reveal an editor if it is already visible in any group
            if (options?.revealIfVisible) {
                for (const lastActiveGroup of groupsByLastActive) {
                    if (isActive(lastActiveGroup, editor)) {
                        group = lastActiveGroup;
                        break;
                    }
                }
            }
            // Respect option to reveal an editor if it is open (not necessarily visible)
            // Still prefer to reveal an editor in a group where the editor is active though.
            // We also try to reveal an editor if it has the `Singleton` capability which
            // indicates that the same editor cannot be opened across groups.
            if (!group) {
                if (options?.revealIfOpened || configurationService.getValue('workbench.editor.revealIfOpen') || ((0, editor_2.isEditorInput)(editor) && editor.hasCapability(8 /* EditorInputCapabilities.Singleton */))) {
                    let groupWithInputActive = undefined;
                    let groupWithInputOpened = undefined;
                    for (const group of groupsByLastActive) {
                        if (isOpened(group, editor)) {
                            if (!groupWithInputOpened) {
                                groupWithInputOpened = group;
                            }
                            if (!groupWithInputActive && group.isActive(editor)) {
                                groupWithInputActive = group;
                            }
                        }
                        if (groupWithInputOpened && groupWithInputActive) {
                            break; // we found all groups we wanted
                        }
                    }
                    // Prefer a target group where the input is visible
                    group = groupWithInputActive || groupWithInputOpened;
                }
            }
        }
        // Fallback to active group if target not valid but avoid
        // locked editor groups unless editor is already opened there
        if (!group) {
            let candidateGroup = editorGroupService.activeGroup;
            // Locked group: find the next non-locked group
            // going up the neigbours of the group or create
            // a new group otherwise
            if (isGroupLockedForEditor(candidateGroup, editor)) {
                for (const group of editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                    if (isGroupLockedForEditor(group, editor)) {
                        continue;
                    }
                    candidateGroup = group;
                    break;
                }
                if (isGroupLockedForEditor(candidateGroup, editor)) {
                    // Group is still locked, so we have to create a new
                    // group to the side of the candidate group
                    group = editorGroupService.addGroup(candidateGroup, (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService));
                }
                else {
                    group = candidateGroup;
                }
            }
            // Non-locked group: take as is
            else {
                group = candidateGroup;
            }
        }
        return group;
    }
    function isGroupLockedForEditor(group, editor) {
        if (!group.isLocked) {
            // only relevant for locked editor groups
            return false;
        }
        if (isOpened(group, editor)) {
            // special case: the locked group contains
            // the provided editor. in that case we do not want
            // to open the editor in any different group.
            return false;
        }
        // group is locked for this editor
        return true;
    }
    function isActive(group, editor) {
        if (!group.activeEditor) {
            return false;
        }
        return group.activeEditor.matches(editor);
    }
    function isOpened(group, editor) {
        for (const typedEditor of group.editors) {
            if (typedEditor.matches(editor)) {
                return true;
            }
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBGaW5kZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZWRpdG9yL2NvbW1vbi9lZGl0b3JHcm91cEZpbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsOEJBVUM7SUFWRCxTQUFnQixTQUFTLENBQUMsUUFBMEIsRUFBRSxNQUFvRCxFQUFFLGNBQTBDO1FBQ3JKLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQ0FBb0IsQ0FBQyxDQUFDO1FBQzlELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1FBRWpFLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDNUYsSUFBSSxLQUFLLFlBQVksT0FBTyxFQUFFLENBQUM7WUFDOUIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQ3RHLENBQUM7UUFFRCxPQUFPLHFCQUFxQixDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDakYsQ0FBQztJQUVELFNBQVMscUJBQXFCLENBQUMsS0FBbUIsRUFBRSxNQUFvRCxFQUFFLGNBQTBDLEVBQUUsa0JBQXdDO1FBRTdMLHFDQUFxQztRQUNyQyxJQUFJLFVBQVUsR0FBaUMsU0FBUyxDQUFDO1FBQ3pELElBQ0Msa0JBQWtCLENBQUMsV0FBVyxLQUFLLEtBQUssSUFBTSw2Q0FBNkM7WUFDM0YsTUFB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