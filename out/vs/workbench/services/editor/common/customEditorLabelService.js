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
define(["require", "exports", "vs/base/common/event", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/base/common/map"], function (require, exports, event_1, glob_1, lifecycle_1, path_1, resources_1, configuration_1, extensions_1, instantiation_1, workspace_1, map_1) {
    "use strict";
    var CustomEditorLabelService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ICustomEditorLabelService = exports.CustomEditorLabelService = void 0;
    let CustomEditorLabelService = class CustomEditorLabelService extends lifecycle_1.Disposable {
        static { CustomEditorLabelService_1 = this; }
        static { this.SETTING_ID_PATTERNS = 'workbench.editor.customLabels.patterns'; }
        static { this.SETTING_ID_ENABLED = 'workbench.editor.customLabels.enabled'; }
        constructor(configurationService, workspaceContextService) {
            super();
            this.configurationService = configurationService;
            this.workspaceContextService = workspaceContextService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.patterns = [];
            this.enabled = true;
            this.cache = new map_1.MRUCache(1000);
            this._templateRegexValidation = /[a-zA-Z0-9]/;
            this._parsedTemplateExpression = /\$\{(dirname|filename|extname|dirname\(([-+]?\d+)\))\}/g;
            this.storeEnablementState();
            this.storeCustomPatterns();
            this.registerListernes();
        }
        registerListernes() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                // Cache the enabled state
                if (e.affectsConfiguration(CustomEditorLabelService_1.SETTING_ID_ENABLED)) {
                    const oldEnablement = this.enabled;
                    this.storeEnablementState();
                    if (oldEnablement !== this.enabled && this.patterns.length > 0) {
                        this._onDidChange.fire();
                    }
                }
                // Cache the patterns
                else if (e.affectsConfiguration(CustomEditorLabelService_1.SETTING_ID_PATTERNS)) {
                    this.cache.clear();
                    this.storeCustomPatterns();
                    this._onDidChange.fire();
                }
            }));
        }
        storeEnablementState() {
            this.enabled = this.configurationService.getValue(CustomEditorLabelService_1.SETTING_ID_ENABLED);
        }
        storeCustomPatterns() {
            this.patterns = [];
            const customLabelPatterns = this.configurationService.getValue(CustomEditorLabelService_1.SETTING_ID_PATTERNS);
            for (const pattern in customLabelPatterns) {
                const template = customLabelPatterns[pattern];
                if (!this._templateRegexValidation.test(template)) {
                    continue;
                }
                const isAbsolutePath = (0, path_1.isAbsolute)(pattern);
                const parsedPattern = (0, glob_1.parse)(pattern);
                this.patterns.push({ pattern, template, isAbsolutePath, parsedPattern });
            }
            this.patterns.sort((a, b) => this.patternWeight(b.pattern) - this.patternWeight(a.pattern));
        }
        patternWeight(pattern) {
            let weight = 0;
            for (const fragment of pattern.split('/')) {
                if (fragment === '**') {
                    weight += 1;
                }
                else if (fragment === '*') {
                    weight += 10;
                }
                else if (fragment.includes('*') || fragment.includes('?')) {
                    weight += 50;
                }
                else if (fragment !== '') {
                    weight += 100;
                }
            }
            return weight;
        }
        getName(resource) {
            if (!this.enabled || this.patterns.length === 0) {
                return undefined;
            }
            const key = resource.toString();
            const cached = this.cache.get(key);
            if (cached !== undefined) {
                return cached ?? undefined;
            }
            const result = this.applyPatterns(resource);
            this.cache.set(key, result ?? null);
            return result;
        }
        applyPatterns(resource) {
            const root = this.workspaceContextService.getWorkspaceFolder(resource);
            let relativePath;
            for (const pattern of this.patterns) {
                let relevantPath;
                if (root && !pattern.isAbsolutePath) {
                    if (!relativePath) {
                        relativePath = (0, resources_1.relativePath)((0, resources_1.dirname)(root.uri), resource) ?? resource.path;
                    }
                    relevantPath = relativePath;
                }
                else {
                    relevantPath = resource.path;
                }
                if (pattern.parsedPattern(relevantPath)) {
                    return this.applyTempate(pattern.template, resource, relevantPath);
                }
            }
            return undefined;
        }
        applyTempate(template, resource, relevantPath) {
            let parsedPath;
            return template.replace(this._parsedTemplateExpression, (match, variable, arg) => {
                parsedPath = parsedPath ?? (0, path_1.parse)(resource.path);
                switch (variable) {
                    case 'filename':
                        return parsedPath.name;
                    case 'extname':
                        return parsedPath.ext.slice(1);
                    default: { // dirname and dirname(arg)
                        const n = variable === 'dirname' ? 0 : parseInt(arg);
                        const nthDir = this.getNthDirname((0, path_1.dirname)(relevantPath), n);
                        if (nthDir) {
                            return nthDir;
                        }
                    }
                }
                return match;
            });
        }
        getNthDirname(path, n) {
            // grand-parent/parent/filename.ext1.ext2 -> [grand-parent, parent]
            path = path.startsWith('/') ? path.slice(1) : path;
            const pathFragments = path.split('/');
            const length = pathFragments.length;
            let nth;
            if (n < 0) {
                nth = Math.abs(n) - 1;
            }
            else {
                nth = length - n - 1;
            }
            const nthDir = pathFragments[nth];
            if (nthDir === undefined || nthDir === '') {
                return undefined;
            }
            return nthDir;
        }
    };
    exports.CustomEditorLabelService = CustomEditorLabelService;
    exports.CustomEditorLabelService = CustomEditorLabelService = CustomEditorLabelService_1 = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], CustomEditorLabelService);
    exports.ICustomEditorLabelService = (0, instantiation_1.createDecorator)('ICustomEditorLabelService');
    (0, extensions_1.registerSingleton)(exports.ICustomEditorLabelService, CustomEditorLabelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRWRpdG9yTGFiZWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2VkaXRvci9jb21tb24vY3VzdG9tRWRpdG9yTGFiZWxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwQnpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7O2lCQUl2Qyx3QkFBbUIsR0FBRyx3Q0FBd0MsQUFBM0MsQ0FBNEM7aUJBQy9ELHVCQUFrQixHQUFHLHVDQUF1QyxBQUExQyxDQUEyQztRQVU3RSxZQUN3QixvQkFBNEQsRUFDekQsdUJBQWtFO1lBRTVGLEtBQUssRUFBRSxDQUFDO1lBSGdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDeEMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQVY1RSxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNELGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFdkMsYUFBUSxHQUFnQyxFQUFFLENBQUM7WUFDM0MsWUFBTyxHQUFHLElBQUksQ0FBQztZQUVmLFVBQUssR0FBRyxJQUFJLGNBQVEsQ0FBd0IsSUFBSSxDQUFDLENBQUM7WUFzQ2xELDZCQUF3QixHQUFXLGFBQWEsQ0FBQztZQTZFeEMsOEJBQXlCLEdBQUcseURBQXlELENBQUM7WUEzR3RHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBRTNCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxD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