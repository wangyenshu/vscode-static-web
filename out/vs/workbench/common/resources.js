/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/uri", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/base/common/glob", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/common/network", "vs/base/common/map", "vs/base/common/extpath"], function (require, exports, uri_1, objects_1, path_1, event_1, resources_1, lifecycle_1, glob_1, workspace_1, configuration_1, network_1, map_1, extpath_1) {
    "use strict";
    var ResourceGlobMatcher_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceGlobMatcher = void 0;
    let ResourceGlobMatcher = class ResourceGlobMatcher extends lifecycle_1.Disposable {
        static { ResourceGlobMatcher_1 = this; }
        static { this.NO_FOLDER = null; }
        constructor(getExpression, shouldUpdate, contextService, configurationService) {
            super();
            this.getExpression = getExpression;
            this.shouldUpdate = shouldUpdate;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this._onExpressionChange = this._register(new event_1.Emitter());
            this.onExpressionChange = this._onExpressionChange.event;
            this.mapFolderToParsedExpression = new Map();
            this.mapFolderToConfiguredExpression = new Map();
            this.updateExpressions(false);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (this.shouldUpdate(e)) {
                    this.updateExpressions(true);
                }
            }));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.updateExpressions(true)));
        }
        updateExpressions(fromEvent) {
            let changed = false;
            // Add expressions per workspaces that got added
            for (const folder of this.contextService.getWorkspace().folders) {
                const folderUriStr = folder.uri.toString();
                const newExpression = this.doGetExpression(folder.uri);
                const currentExpression = this.mapFolderToConfiguredExpression.get(folderUriStr);
                if (newExpression) {
                    if (!currentExpression || !(0, objects_1.equals)(currentExpression.expression, newExpression.expression)) {
                        changed = true;
                        this.mapFolderToParsedExpression.set(folderUriStr, (0, glob_1.parse)(newExpression.expression));
                        this.mapFolderToConfiguredExpression.set(folderUriStr, newExpression);
                    }
                }
                else {
                    if (currentExpression) {
                        changed = true;
                        this.mapFolderToParsedExpression.delete(folderUriStr);
                        this.mapFolderToConfiguredExpression.delete(folderUriStr);
                    }
                }
            }
            // Remove expressions per workspace no longer present
            const foldersMap = new map_1.ResourceSet(this.contextService.getWorkspace().folders.map(folder => folder.uri));
            for (const [folder] of this.mapFolderToConfiguredExpression) {
                if (folder === ResourceGlobMatcher_1.NO_FOLDER) {
                    continue; // always keep this one
                }
                if (!foldersMap.has(uri_1.URI.parse(folder))) {
                    this.mapFolderToParsedExpression.delete(folder);
                    this.mapFolderToConfiguredExpression.delete(folder);
                    changed = true;
                }
            }
            // Always set for resources outside workspace as well
            const globalNewExpression = this.doGetExpression(undefined);
            const globalCurrentExpression = this.mapFolderToConfiguredExpression.get(ResourceGlobMatcher_1.NO_FOLDER);
            if (globalNewExpression) {
                if (!globalCurrentExpression || !(0, objects_1.equals)(globalCurrentExpression.expression, globalNewExpression.expression)) {
                    changed = true;
                    this.mapFolderToParsedExpression.set(ResourceGlobMatcher_1.NO_FOLDER, (0, glob_1.parse)(globalNewExpression.expression));
                    this.mapFolderToConfiguredExpression.set(ResourceGlobMatcher_1.NO_FOLDER, globalNewExpression);
                }
            }
            else {
                if (globalCurrentExpression) {
                    changed = true;
                    this.mapFolderToParsedExpression.delete(ResourceGlobMatcher_1.NO_FOLDER);
                    this.mapFolderToConfiguredExpression.delete(ResourceGlobMatcher_1.NO_FOLDER);
                }
            }
            if (fromEvent && changed) {
                this._onExpressionChange.fire();
            }
        }
        doGetExpression(resource) {
            const expression = this.getExpression(resource);
            if (!expression) {
                return undefined;
            }
            const keys = Object.keys(expression);
            if (keys.length === 0) {
                return undefined;
            }
            let hasAbsolutePath = false;
            // Check the expression for absolute paths/globs
            // and specifically for Windows, make sure the
            // drive letter is lowercased, because we later
            // check with `URI.fsPath` which is always putting
            // the drive letter lowercased.
            const massagedExpression = Object.create(null);
            for (const key of keys) {
                if (!hasAbsolutePath) {
                    hasAbsolutePath = (0, path_1.isAbsolute)(key);
                }
                let massagedKey = key;
                const driveLetter = (0, extpath_1.getDriveLetter)(massagedKey, true /* probe for windows */);
                if (driveLetter) {
                    const driveLetterLower = driveLetter.toLowerCase();
                    if (driveLetter !== driveLetter.toLowerCase()) {
                        massagedKey = `${driveLetterLower}${massagedKey.substring(1)}`;
                    }
                }
                massagedExpression[massagedKey] = expression[key];
            }
            return {
                expression: massagedExpression,
                hasAbsolutePath
            };
        }
        matches(resource, hasSibling) {
            if (this.mapFolderToParsedExpression.size === 0) {
                return false; // return early: no expression for this matcher
            }
            const folder = this.contextService.getWorkspaceFolder(resource);
            let expressionForFolder;
            let expressionConfigForFolder;
            if (folder && this.mapFolderToParsedExpression.has(folder.uri.toString())) {
                expressionForFolder = this.mapFolderToParsedExpression.get(folder.uri.toString());
                expressionConfigForFolder = this.mapFolderToConfiguredExpression.get(folder.uri.toString());
            }
            else {
                expressionForFolder = this.mapFolderToParsedExpression.get(ResourceGlobMatcher_1.NO_FOLDER);
                expressionConfigForFolder = this.mapFolderToConfiguredExpression.get(ResourceGlobMatcher_1.NO_FOLDER);
            }
            if (!expressionForFolder) {
                return false; // return early: no expression for this resource
            }
            // If the resource if from a workspace, convert its absolute path to a relative
            // path so that glob patterns have a higher probability to match. For example
            // a glob pattern of "src/**" will not match on an absolute path "/folder/src/file.txt"
            // but can match on "src/file.txt"
            let resourcePathToMatch;
            if (folder) {
                resourcePathToMatch = (0, resources_1.relativePath)(folder.uri, resource);
            }
            else {
                resourcePathToMatch = this.uriToPath(resource);
            }
            if (typeof resourcePathToMatch === 'string' && !!expressionForFolder(resourcePathToMatch, undefined, hasSibling)) {
                return true;
            }
            // If the configured expression has an absolute path, we also check for absolute paths
            // to match, otherwise we potentially miss out on matches. We only do that if we previously
            // matched on the relative path.
            if (resourcePathToMatch !== this.uriToPath(resource) && expressionConfigForFolder?.hasAbsolutePath) {
                return !!expressionForFolder(this.uriToPath(resource), undefined, hasSibling);
            }
            return false;
        }
        uriToPath(uri) {
            if (uri.scheme === network_1.Schemas.file) {
                return uri.fsPath;
            }
            return uri.path;
        }
    };
    exports.ResourceGlobMatcher = ResourceGlobMatcher;
    exports.ResourceGlobMatcher = ResourceGlobMatcher = ResourceGlobMatcher_1 = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configuration_1.IConfigurationService)
    ], ResourceGlobMatcher);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9yZXNvdXJjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9CekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTs7aUJBRTFCLGNBQVMsR0FBRyxJQUFJLEFBQVAsQ0FBUTtRQVF6QyxZQUNTLGFBQXdELEVBQ3hELFlBQTJELEVBQ3pDLGNBQXlELEVBQzVELG9CQUE0RDtZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUxBLGtCQUFhLEdBQWIsYUFBYSxDQUEyQztZQUN4RCxpQkFBWSxHQUFaLFlBQVksQ0FBK0M7WUFDeEIsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFWbkUsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDbEUsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQUU1QyxnQ0FBMkIsR0FBRyxJQUFJLEdBQUcsRUFBbUMsQ0FBQztZQUN6RSxvQ0FBK0IsR0FBRyxJQUFJLEdBQUcsRUFBd0MsQ0FBQztZQVVsRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFOUIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDckUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JB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