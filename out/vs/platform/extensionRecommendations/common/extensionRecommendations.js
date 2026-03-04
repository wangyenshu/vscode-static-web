/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionRecommendationNotificationService = exports.RecommendationsNotificationResult = exports.RecommendationSource = void 0;
    exports.RecommendationSourceToString = RecommendationSourceToString;
    var RecommendationSource;
    (function (RecommendationSource) {
        RecommendationSource[RecommendationSource["FILE"] = 1] = "FILE";
        RecommendationSource[RecommendationSource["WORKSPACE"] = 2] = "WORKSPACE";
        RecommendationSource[RecommendationSource["EXE"] = 3] = "EXE";
    })(RecommendationSource || (exports.RecommendationSource = RecommendationSource = {}));
    function RecommendationSourceToString(source) {
        switch (source) {
            case 1 /* RecommendationSource.FILE */: return 'file';
            case 2 /* RecommendationSource.WORKSPACE */: return 'workspace';
            case 3 /* RecommendationSource.EXE */: return 'exe';
        }
    }
    var RecommendationsNotificationResult;
    (function (RecommendationsNotificationResult) {
        RecommendationsNotificationResult["Ignored"] = "ignored";
        RecommendationsNotificationResult["Cancelled"] = "cancelled";
        RecommendationsNotificationResult["TooMany"] = "toomany";
        RecommendationsNotificationResult["IncompatibleWindow"] = "incompatibleWindow";
        RecommendationsNotificationResult["Accepted"] = "reacted";
    })(RecommendationsNotificationResult || (exports.RecommendationsNotificationResult = RecommendationsNotificationResult = {}));
    exports.IExtensionRecommendationNotificationService = (0, instantiation_1.createDecorator)('IExtensionRecommendationNotificationService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zL2NvbW1vbi9leHRlbnNpb25SZWNvbW1lbmRhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxvRUFNQztJQW5CRCxJQUFrQixvQkFJakI7SUFKRCxXQUFrQixvQkFBb0I7UUFDckMsK0RBQVEsQ0FBQTtRQUNSLHlFQUFhLENBQUE7UUFDYiw2REFBTyxDQUFBO0lBQ1IsQ0FBQyxFQUppQixvQkFBb0Isb0NBQXBCLG9CQUFvQixRQUlyQztJQVNELFNBQWdCLDRCQUE0QixDQUFDLE1BQTRCO1FBQ3hFLFFBQVEsTUFBTSxFQUFFLENBQUM7WUFDaEIsc0NBQThCLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQztZQUM5QywyQ0FBbUMsQ0FBQyxDQUFDLE9BQU8sV0FBVyxDQUFDO1lBQ3hELHFDQUE2QixDQUFDLENBQUMsT0FBTyxLQUFLLENBQUM7UUFDN0MsQ0FBQztJQUNGLENBQUM7SUFFRCxJQUFrQixpQ0FNakI7SUFORCxXQUFrQixpQ0FBaUM7UUFDbEQsd0RBQW1CLENBQUE7UUFDbkIsNERBQXVCLENBQUE7UUFDdkIsd0RBQW1CLENBQUE7UUFDbkIsOEVBQXlDLENBQUE7UUFDekMseURBQW9CLENBQUE7SUFDckIsQ0FBQyxFQU5pQixpQ0FBaUMsaURBQWpDLGlDQUFpQyxRQU1sRDtJQUVZLFFBQUEsMkNBQTJDLEdBQUcsSUFBQSwrQkFBZSxFQUE4Qyw2Q0FBNkMsQ0FBQyxDQUFDIn0=