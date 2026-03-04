/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, instantiation_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AUX_WINDOW_GROUP = exports.SIDE_GROUP = exports.ACTIVE_GROUP = exports.IEditorService = void 0;
    exports.isPreferredGroup = isPreferredGroup;
    exports.IEditorService = (0, instantiation_1.createDecorator)('editorService');
    /**
     * Open an editor in the currently active group.
     */
    exports.ACTIVE_GROUP = -1;
    /**
     * Open an editor to the side of the active group.
     */
    exports.SIDE_GROUP = -2;
    /**
     * Open an editor in a new auxiliary window.
     */
    exports.AUX_WINDOW_GROUP = -3;
    function isPreferredGroup(obj) {
        const candidate = obj;
        return typeof obj === 'number' || (0, editorGroupsService_1.isEditorGroup)(candidate);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lZGl0b3IvY29tbW9uL2VkaXRvclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUNoRyw0Q0FJQztJQTFCWSxRQUFBLGNBQWMsR0FBRyxJQUFBLCtCQUFlLEVBQWlCLGVBQWUsQ0FBQyxDQUFDO0lBRS9FOztPQUVHO0lBQ1UsUUFBQSxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFHL0I7O09BRUc7SUFDVSxRQUFBLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUc3Qjs7T0FFRztJQUNVLFFBQUEsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFLbkMsU0FBZ0IsZ0JBQWdCLENBQUMsR0FBWTtRQUM1QyxNQUFNLFNBQVMsR0FBRyxHQUFpQyxDQUFDO1FBRXBELE9BQU8sT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLElBQUEsbUNBQWEsRUFBQyxTQUFTLENBQUMsQ0FBQztJQUM1RCxDQUFDIn0=