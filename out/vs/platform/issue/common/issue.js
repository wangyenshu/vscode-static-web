/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IIssueMainService = exports.IssueSource = exports.IssueType = void 0;
    var IssueType;
    (function (IssueType) {
        IssueType[IssueType["Bug"] = 0] = "Bug";
        IssueType[IssueType["PerformanceIssue"] = 1] = "PerformanceIssue";
        IssueType[IssueType["FeatureRequest"] = 2] = "FeatureRequest";
    })(IssueType || (exports.IssueType = IssueType = {}));
    var IssueSource;
    (function (IssueSource) {
        IssueSource["VSCode"] = "vscode";
        IssueSource["Extension"] = "extension";
        IssueSource["Marketplace"] = "marketplace";
    })(IssueSource || (exports.IssueSource = IssueSource = {}));
    exports.IIssueMainService = (0, instantiation_1.createDecorator)('issueService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9pc3N1ZS9jb21tb24vaXNzdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxJQUFrQixTQUlqQjtJQUpELFdBQWtCLFNBQVM7UUFDMUIsdUNBQUcsQ0FBQTtRQUNILGlFQUFnQixDQUFBO1FBQ2hCLDZEQUFjLENBQUE7SUFDZixDQUFDLEVBSmlCLFNBQVMseUJBQVQsU0FBUyxRQUkxQjtJQUVELElBQVksV0FJWDtJQUpELFdBQVksV0FBVztRQUN0QixnQ0FBaUIsQ0FBQTtRQUNqQixzQ0FBdUIsQ0FBQTtRQUN2QiwwQ0FBMkIsQ0FBQTtJQUM1QixDQUFDLEVBSlcsV0FBVywyQkFBWCxXQUFXLFFBSXRCO0lBOEZZLFFBQUEsaUJBQWlCLEdBQUcsSUFBQSwrQkFBZSxFQUFvQixjQUFjLENBQUMsQ0FBQyJ9