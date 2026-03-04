/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/test/common/mockDebug", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, log_1, uriIdentityService_1, debugModel_1, mockDebug_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mockUriIdentityService = void 0;
    exports.createMockDebugModel = createMockDebugModel;
    const fileService = new workbenchTestServices_1.TestFileService();
    exports.mockUriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
    function createMockDebugModel(disposable) {
        const storage = disposable.add(new workbenchTestServices_2.TestStorageService());
        const debugStorage = disposable.add(new mockDebug_1.MockDebugStorage(storage));
        return disposable.add(new debugModel_1.DebugModel(debugStorage, { isDirty: (e) => false }, exports.mockUriIdentityService, new log_1.NullLogService()));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0RlYnVnTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy90ZXN0L2Jyb3dzZXIvbW9ja0RlYnVnTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLG9EQUlDO0lBUEQsTUFBTSxXQUFXLEdBQUcsSUFBSSx1Q0FBZSxFQUFFLENBQUM7SUFDN0IsUUFBQSxzQkFBc0IsR0FBRyxJQUFJLHVDQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRTFFLFNBQWdCLG9CQUFvQixDQUFDLFVBQXdDO1FBQzVFLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSwwQ0FBa0IsRUFBRSxDQUFDLENBQUM7UUFDekQsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDbkUsT0FBTyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksdUJBQVUsQ0FBQyxZQUFZLEVBQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLDhCQUFzQixFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN4SSxDQUFDIn0=