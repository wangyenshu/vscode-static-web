/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.columnToEditorGroup = columnToEditorGroup;
    exports.editorGroupToColumn = editorGroupToColumn;
    function columnToEditorGroup(editorGroupService, configurationService, column = editorService_1.ACTIVE_GROUP) {
        if (column === editorService_1.ACTIVE_GROUP || column === editorService_1.SIDE_GROUP) {
            return column; // return early for when column is well known
        }
        let groupInColumn = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[column];
        // If a column is asked for that does not exist, we create up to 9 columns in accordance
        // to what `ViewColumn` provides and otherwise fallback to `SIDE_GROUP`.
        if (!groupInColumn && column < 9) {
            for (let i = 0; i <= column; i++) {
                const editorGroups = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
                if (!editorGroups[i]) {
                    editorGroupService.addGroup(editorGroups[i - 1], (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService));
                }
            }
            groupInColumn = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[column];
        }
        return groupInColumn?.id ?? editorService_1.SIDE_GROUP; // finally open to the side when group not found
    }
    function editorGroupToColumn(editorGroupService, editorGroup) {
        const group = (typeof editorGroup === 'number') ? editorGroupService.getGroup(editorGroup) : editorGroup;
        return editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */).indexOf(group ?? editorGroupService.activeGroup);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBDb2x1bW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZWRpdG9yL2NvbW1vbi9lZGl0b3JHcm91cENvbHVtbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxrREFzQkM7SUFFRCxrREFJQztJQTVCRCxTQUFnQixtQkFBbUIsQ0FBQyxrQkFBd0MsRUFBRSxvQkFBMkMsRUFBRSxNQUFNLEdBQUcsNEJBQVk7UUFDL0ksSUFBSSxNQUFNLEtBQUssNEJBQVksSUFBSSxNQUFNLEtBQUssMEJBQVUsRUFBRSxDQUFDO1lBQ3RELE9BQU8sTUFBTSxDQUFDLENBQUMsNkNBQTZDO1FBQzdELENBQUM7UUFFRCxJQUFJLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxTQUFTLHFDQUE2QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXRGLHdGQUF3RjtRQUN4Rix3RUFBd0U7UUFFeEUsSUFBSSxDQUFDLGFBQWEsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLFlBQVksR0FBRyxrQkFBa0IsQ0FBQyxTQUFTLHFDQUE2QixDQUFDO2dCQUMvRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3RCLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUEsdURBQWlDLEVBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO2dCQUMzRyxDQUFDO1lBQ0YsQ0FBQztZQUVELGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxTQUFTLHFDQUE2QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25GLENBQUM7UUFFRCxPQUFPLGFBQWEsRUFBRSxFQUFFLElBQUksMEJBQVUsQ0FBQyxDQUFDLGdEQUFnRDtJQUN6RixDQUFDO0lBRUQsU0FBZ0IsbUJBQW1CLENBQUMsa0JBQXdDLEVBQUUsV0FBMkM7UUFDeEgsTUFBTSxLQUFLLEdBQUcsQ0FBQyxPQUFPLFdBQVcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFFekcsT0FBTyxrQkFBa0IsQ0FBQyxTQUFTLHFDQUE2QixDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbkgsQ0FBQyJ9