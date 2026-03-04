/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation"], function (require, exports, extensions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITimelineService = exports.TimelinePaneId = void 0;
    exports.toKey = toKey;
    function toKey(extension, source) {
        return `${typeof extension === 'string' ? extension : extensions_1.ExtensionIdentifier.toKey(extension)}|${source}`;
    }
    exports.TimelinePaneId = 'timeline';
    const TIMELINE_SERVICE_ID = 'timeline';
    exports.ITimelineService = (0, instantiation_1.createDecorator)(TIMELINE_SERVICE_ID);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZWxpbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90aW1lbGluZS9jb21tb24vdGltZWxpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLHNCQUVDO0lBRkQsU0FBZ0IsS0FBSyxDQUFDLFNBQXVDLEVBQUUsTUFBYztRQUM1RSxPQUFPLEdBQUcsT0FBTyxTQUFTLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGdDQUFtQixDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQztJQUN4RyxDQUFDO0lBRVksUUFBQSxjQUFjLEdBQUcsVUFBVSxDQUFDO0lBd0l6QyxNQUFNLG1CQUFtQixHQUFHLFVBQVUsQ0FBQztJQUMxQixRQUFBLGdCQUFnQixHQUFHLElBQUEsK0JBQWUsRUFBbUIsbUJBQW1CLENBQUMsQ0FBQyJ9