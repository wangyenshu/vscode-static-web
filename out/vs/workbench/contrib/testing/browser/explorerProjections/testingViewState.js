/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/testing/common/testId"], function (require, exports, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isCollapsedInSerializedTestTree = isCollapsedInSerializedTestTree;
    /**
     * Gets whether the given test ID is collapsed.
     */
    function isCollapsedInSerializedTestTree(serialized, id) {
        if (!(id instanceof testId_1.TestId)) {
            id = testId_1.TestId.fromString(id);
        }
        let node = serialized;
        for (const part of id.path) {
            if (!node.children?.hasOwnProperty(part)) {
                return undefined;
            }
            node = node.children[part];
        }
        return node.collapsed;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ1ZpZXdTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci9leHBsb3JlclByb2plY3Rpb25zL3Rlc3RpbmdWaWV3U3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsMEVBZUM7SUFsQkQ7O09BRUc7SUFDSCxTQUFnQiwrQkFBK0IsQ0FBQyxVQUE0QyxFQUFFLEVBQW1CO1FBQ2hILElBQUksQ0FBQyxDQUFDLEVBQUUsWUFBWSxlQUFNLENBQUMsRUFBRSxDQUFDO1lBQzdCLEVBQUUsR0FBRyxlQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFJLElBQUksR0FBRyxVQUFVLENBQUM7UUFDdEIsS0FBSyxNQUFNLElBQUksSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQzFDLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3ZCLENBQUMifQ==