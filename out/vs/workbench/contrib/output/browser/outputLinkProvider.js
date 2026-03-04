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
define(["require", "exports", "vs/base/common/async", "vs/editor/common/services/model", "vs/platform/workspace/common/workspace", "vs/workbench/services/output/common/output", "vs/editor/browser/services/webWorker", "vs/base/common/lifecycle", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures"], function (require, exports, async_1, model_1, workspace_1, output_1, webWorker_1, lifecycle_1, languageConfigurationRegistry_1, languageFeatures_1) {
    "use strict";
    var OutputLinkProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputLinkProvider = void 0;
    let OutputLinkProvider = class OutputLinkProvider {
        static { OutputLinkProvider_1 = this; }
        static { this.DISPOSE_WORKER_TIME = 3 * 60 * 1000; } // dispose worker after 3 minutes of inactivity
        constructor(contextService, modelService, languageConfigurationService, languageFeaturesService) {
            this.contextService = contextService;
            this.modelService = modelService;
            this.languageConfigurationService = languageConfigurationService;
            this.languageFeaturesService = languageFeaturesService;
            this.disposeWorkerScheduler = new async_1.RunOnceScheduler(() => this.disposeWorker(), OutputLinkProvider_1.DISPOSE_WORKER_TIME);
            this.registerListeners();
            this.updateLinkProviderWorker();
        }
        registerListeners() {
            this.contextService.onDidChangeWorkspaceFolders(() => this.updateLinkProviderWorker());
        }
        updateLinkProviderWorker() {
            // Setup link provider depending on folders being opened or not
            const folders = this.contextService.getWorkspace().folders;
            if (folders.length > 0) {
                if (!this.linkProviderRegistration) {
                    this.linkProviderRegistration = this.languageFeaturesService.linkProvider.register([{ language: output_1.OUTPUT_MODE_ID, scheme: '*' }, { language: output_1.LOG_MODE_ID, scheme: '*' }], {
                        provideLinks: async (model) => {
                            const links = await this.provideLinks(model.uri);
                            return links && { links };
                        }
                    });
                }
            }
            else {
                (0, lifecycle_1.dispose)(this.linkProviderRegistration);
                this.linkProviderRegistration = undefined;
            }
            // Dispose worker to recreate with folders on next provideLinks request
            this.disposeWorker();
            this.disposeWorkerScheduler.cancel();
        }
        getOrCreateWorker() {
            this.disposeWorkerScheduler.schedule();
            if (!this.worker) {
                const createData = {
                    workspaceFolders: this.contextService.getWorkspace().folders.map(folder => folder.uri.toString())
                };
                this.worker = (0, webWorker_1.createWebWorker)(this.modelService, this.languageConfigurationService, {
                    moduleId: 'vs/workbench/contrib/output/common/outputLinkComputer',
                    createData,
                    label: 'outputLinkComputer'
                });
            }
            return this.worker;
        }
        async provideLinks(modelUri) {
            const linkComputer = await this.getOrCreateWorker().withSyncedResources([modelUri]);
            return linkComputer.computeLinks(modelUri.toString());
        }
        disposeWorker() {
            if (this.worker) {
                this.worker.dispose();
                this.worker = undefined;
            }
        }
    };
    exports.OutputLinkProvider = OutputLinkProvider;
    exports.OutputLinkProvider = OutputLinkProvider = OutputLinkProvider_1 = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, model_1.IModelService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService)
    ], OutputLinkProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0TGlua1Byb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvb3V0cHV0L2Jyb3dzZXIvb3V0cHV0TGlua1Byb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7O2lCQUVOLHdCQUFtQixHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxBQUFoQixDQUFpQixHQUFDLCtDQUErQztRQU01RyxZQUM0QyxjQUF3QyxFQUNuRCxZQUEyQixFQUNYLDRCQUEyRCxFQUNoRSx1QkFBaUQ7WUFIakQsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQ25ELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ1gsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUErQjtZQUNoRSw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBRTVGLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxvQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRXZILElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1FBQ2pDLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFFTyx3QkFBd0I7WUFFL0IsK0RBQStEO1lBQy9ELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMs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