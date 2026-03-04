/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor"], function (require, exports, instantiation_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenEditorContext = exports.GroupsOrder = exports.MergeGroupMode = exports.GroupsArrangement = exports.GroupLocation = exports.GroupOrientation = exports.GroupDirection = exports.IEditorGroupsService = void 0;
    exports.isEditorReplacement = isEditorReplacement;
    exports.isEditorGroup = isEditorGroup;
    exports.preferredSideBySideGroupDirection = preferredSideBySideGroupDirection;
    exports.IEditorGroupsService = (0, instantiation_1.createDecorator)('editorGroupsService');
    var GroupDirection;
    (function (GroupDirection) {
        GroupDirection[GroupDirection["UP"] = 0] = "UP";
        GroupDirection[GroupDirection["DOWN"] = 1] = "DOWN";
        GroupDirection[GroupDirection["LEFT"] = 2] = "LEFT";
        GroupDirection[GroupDirection["RIGHT"] = 3] = "RIGHT";
    })(GroupDirection || (exports.GroupDirection = GroupDirection = {}));
    var GroupOrientation;
    (function (GroupOrientation) {
        GroupOrientation[GroupOrientation["HORIZONTAL"] = 0] = "HORIZONTAL";
        GroupOrientation[GroupOrientation["VERTICAL"] = 1] = "VERTICAL";
    })(GroupOrientation || (exports.GroupOrientation = GroupOrientation = {}));
    var GroupLocation;
    (function (GroupLocation) {
        GroupLocation[GroupLocation["FIRST"] = 0] = "FIRST";
        GroupLocation[GroupLocation["LAST"] = 1] = "LAST";
        GroupLocation[GroupLocation["NEXT"] = 2] = "NEXT";
        GroupLocation[GroupLocation["PREVIOUS"] = 3] = "PREVIOUS";
    })(GroupLocation || (exports.GroupLocation = GroupLocation = {}));
    var GroupsArrangement;
    (function (GroupsArrangement) {
        /**
         * Make the current active group consume the entire
         * editor area.
         */
        GroupsArrangement[GroupsArrangement["MAXIMIZE"] = 0] = "MAXIMIZE";
        /**
         * Make the current active group consume the maximum
         * amount of space possible.
         */
        GroupsArrangement[GroupsArrangement["EXPAND"] = 1] = "EXPAND";
        /**
         * Size all groups evenly.
         */
        GroupsArrangement[GroupsArrangement["EVEN"] = 2] = "EVEN";
    })(GroupsArrangement || (exports.GroupsArrangement = GroupsArrangement = {}));
    var MergeGroupMode;
    (function (MergeGroupMode) {
        MergeGroupMode[MergeGroupMode["COPY_EDITORS"] = 0] = "COPY_EDITORS";
        MergeGroupMode[MergeGroupMode["MOVE_EDITORS"] = 1] = "MOVE_EDITORS";
    })(MergeGroupMode || (exports.MergeGroupMode = MergeGroupMode = {}));
    function isEditorReplacement(replacement) {
        const candidate = replacement;
        return (0, editor_1.isEditorInput)(candidate?.editor) && (0, editor_1.isEditorInput)(candidate?.replacement);
    }
    var GroupsOrder;
    (function (GroupsOrder) {
        /**
         * Groups sorted by creation order (oldest one first)
         */
        GroupsOrder[GroupsOrder["CREATION_TIME"] = 0] = "CREATION_TIME";
        /**
         * Groups sorted by most recent activity (most recent active first)
         */
        GroupsOrder[GroupsOrder["MOST_RECENTLY_ACTIVE"] = 1] = "MOST_RECENTLY_ACTIVE";
        /**
         * Groups sorted by grid widget order
         */
        GroupsOrder[GroupsOrder["GRID_APPEARANCE"] = 2] = "GRID_APPEARANCE";
    })(GroupsOrder || (exports.GroupsOrder = GroupsOrder = {}));
    var OpenEditorContext;
    (function (OpenEditorContext) {
        OpenEditorContext[OpenEditorContext["NEW_EDITOR"] = 1] = "NEW_EDITOR";
        OpenEditorContext[OpenEditorContext["MOVE_EDITOR"] = 2] = "MOVE_EDITOR";
        OpenEditorContext[OpenEditorContext["COPY_EDITOR"] = 3] = "COPY_EDITOR";
    })(OpenEditorContext || (exports.OpenEditorContext = OpenEditorContext = {}));
    function isEditorGroup(obj) {
        const group = obj;
        return !!group && typeof group.id === 'number' && Array.isArray(group.editors);
    }
    //#region Editor Group Helpers
    function preferredSideBySideGroupDirection(configurationService) {
        const openSideBySideDirection = configurationService.getValue('workbench.editor.openSideBySideDirection');
        if (openSideBySideDirection === 'down') {
            return 1 /* GroupDirection.DOWN */;
        }
        return 3 /* GroupDirection.RIGHT */;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBzU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lZGl0b3IvY29tbW9uL2VkaXRvckdyb3Vwc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0loRyxrREFJQztJQWt2QkQsc0NBSUM7SUFJRCw4RUFRQztJQXYzQlksUUFBQSxvQkFBb0IsR0FBRyxJQUFBLCtCQUFlLEVBQXVCLHFCQUFxQixDQUFDLENBQUM7SUFFakcsSUFBa0IsY0FLakI7SUFMRCxXQUFrQixjQUFjO1FBQy9CLCtDQUFFLENBQUE7UUFDRixtREFBSSxDQUFBO1FBQ0osbURBQUksQ0FBQTtRQUNKLHFEQUFLLENBQUE7SUFDTixDQUFDLEVBTGlCLGNBQWMsOEJBQWQsY0FBYyxRQUsvQjtJQUVELElBQWtCLGdCQUdqQjtJQUhELFdBQWtCLGdCQUFnQjtRQUNqQyxtRUFBVSxDQUFBO1FBQ1YsK0RBQVEsQ0FBQTtJQUNULENBQUMsRUFIaUIsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFHakM7SUFFRCxJQUFrQixhQUtqQjtJQUxELFdBQWtCLGFBQWE7UUFDOUIsbURBQUssQ0FBQTtRQUNMLGlEQUFJLENBQUE7UUFDSixpREFBSSxDQUFBO1FBQ0oseURBQVEsQ0FBQTtJQUNULENBQUMsRUFMaUIsYUFBYSw2QkFBYixhQUFhLFFBSzlCO0lBT0QsSUFBa0IsaUJBaUJqQjtJQWpCRCxXQUFrQixpQkFBaUI7UUFDbEM7OztXQUdHO1FBQ0gsaUVBQVEsQ0FBQTtRQUVSOzs7V0FHRztRQUNILDZEQUFNLENBQUE7UUFFTjs7V0FFRztRQUNILHlEQUFJLENBQUE7SUFDTCxDQUFDLEVBakJpQixpQkFBaUIsaUNBQWpCLGlCQUFpQixRQWlCbEM7SUFnQ0QsSUFBa0IsY0FHakI7SUFIRCxXQUFrQixjQUFjO1FBQy9CLG1FQUFZLENBQUE7UUFDWixtRUFBWSxDQUFBO0lBQ2IsQ0FBQyxFQUhpQixjQUFjLDhCQUFkLGNBQWMsUUFHL0I7SUFtQ0QsU0FBZ0IsbUJBQW1CLENBQUMsV0FBb0I7UUFDdkQsTUFBTSxTQUFTLEdBQUcsV0FBNkMsQ0FBQztRQUVoRSxPQUFPLElBQUEsc0JBQWEsRUFBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksSUFBQSxzQkFBYSxFQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNsRixDQUFDO0lBRUQsSUFBa0IsV0FnQmpCO0lBaEJELFdBQWtCLFdBQVc7UUFFNUI7O1dBRUc7UUFDSCwrREFBYSxDQUFBO1FBRWI7O1dBRUc7UUFDSCw2RUFBb0IsQ0FBQTtRQUVwQjs7V0FFRztRQUNILG1FQUFlLENBQUE7SUFDaEIsQ0FBQyxFQWhCaUIsV0FBVywyQkFBWCxXQUFXLFFBZ0I1QjtJQTBaRCxJQUFrQixpQkFJakI7SUFKRCxXQUFrQixpQkFBaUI7UUFDbEMscUVBQWMsQ0FBQTtRQUNkLHVFQUFlLENBQUE7UUFDZix1RUFBZSxDQUFBO0lBQ2hCLENBQUMsRUFKaUIsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFJbEM7SUFrVUQsU0FBZ0IsYUFBYSxDQUFDLEdBQVk7UUFDekMsTUFBTSxLQUFLLEdBQUcsR0FBK0IsQ0FBQztRQUU5QyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLENBQUMsRUFBRSxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQsOEJBQThCO0lBRTlCLFNBQWdCLGlDQUFpQyxDQUFDLG9CQUEyQztRQUM1RixNQUFNLHVCQUF1QixHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1FBRTFHLElBQUksdUJBQXVCLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDeEMsbUNBQTJCO1FBQzVCLENBQUM7UUFFRCxvQ0FBNEI7SUFDN0IsQ0FBQzs7QUFFRCxZQUFZIn0=