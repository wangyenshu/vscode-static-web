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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/contrib/performance/browser/perfviewEditor", "vs/workbench/services/extensions/common/extensions", "vs/platform/clipboard/common/clipboardService", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/platform/native/common/native", "vs/platform/product/common/productService", "vs/platform/files/common/files", "vs/platform/label/common/label"], function (require, exports, nls_1, resources_1, resolverService_1, dialogs_1, environmentService_1, lifecycle_1, perfviewEditor_1, extensions_1, clipboardService_1, uri_1, opener_1, native_1, productService_1, files_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartupProfiler = void 0;
    let StartupProfiler = class StartupProfiler {
        constructor(_dialogService, _environmentService, _textModelResolverService, _clipboardService, lifecycleService, extensionService, _openerService, _nativeHostService, _productService, _fileService, _labelService) {
            this._dialogService = _dialogService;
            this._environmentService = _environmentService;
            this._textModelResolverService = _textModelResolverService;
            this._clipboardService = _clipboardService;
            this._openerService = _openerService;
            this._nativeHostService = _nativeHostService;
            this._productService = _productService;
            this._fileService = _fileService;
            this._labelService = _labelService;
            // wait for everything to be ready
            Promise.all([
                lifecycleService.when(4 /* LifecyclePhase.Eventually */),
                extensionService.whenInstalledExtensionsRegistered()
            ]).then(() => {
                this._stopProfiling();
            });
        }
        _stopProfiling() {
            if (!this._environmentService.args['prof-startup-prefix']) {
                return;
            }
            const profileFilenamePrefix = uri_1.URI.file(this._environmentService.args['prof-startup-prefix']);
            const dir = (0, resources_1.dirname)(profileFilenamePrefix);
            const prefix = (0, resources_1.basename)(profileFilenamePrefix);
            const removeArgs = ['--prof-startup'];
            const markerFile = this._fileService.readFile(profileFilenamePrefix).then(value => removeArgs.push(...value.toString().split('|')))
                .then(() => this._fileService.del(profileFilenamePrefix, { recursive: true })) // (1) delete the file to tell the main process to stop profiling
                .then(() => new Promise(resolve => {
                const check = () => {
                    this._fileService.exists(profileFilenamePrefix).then(exists => {
                        if (exists) {
                            resolve();
                        }
                        else {
                            setTimeout(check, 500);
                        }
                    });
                };
                check();
            }))
                .then(() => this._fileService.del(profileFilenamePrefix, { recursive: true })); // (3) finally delete the file again
            markerFile.then(() => {
                return this._fileService.resolve(dir).then(stat => {
                    return (stat.children ? stat.children.filter(value => value.resource.path.includes(prefix)) : []).map(stat => stat.resource);
                });
            }).then(files => {
                const profileFiles = files.reduce((prev, cur) => `${prev}${this._labelService.getUriLabel(cur)}\n`, '\n');
                return this._dialogService.confirm({
                    type: 'info',
                    message: (0, nls_1.localize)('prof.message', "Successfully created profiles."),
                    detail: (0, nls_1.localize)('prof.detail', "Please create an issue and manually attach the following files:\n{0}", profileFiles),
                    primaryButton: (0, nls_1.localize)({ key: 'prof.restartAndFileIssue', comment: ['&& denotes a mnemonic'] }, "&&Create Issue and Restart"),
                    cancelButton: (0, nls_1.localize)('prof.restart', "Restart")
                }).then(res => {
                    if (res.confirmed) {
                        Promise.all([
                            this._nativeHostService.showItemInFolder(files[0].fsPath),
                            this._createPerfIssue(files.map(file => (0, resources_1.basename)(file)))
                        ]).then(() => {
                            // keep window stable until restart is selected
                            return this._dialogService.confirm({
                                type: 'info',
                                message: (0, nls_1.localize)('prof.thanks', "Thanks for helping us."),
                                detail: (0, nls_1.localize)('prof.detail.restart', "A final restart is required to continue to use '{0}'. Again, thank you for your contribution.", this._productService.nameLong),
                                primaryButton: (0, nls_1.localize)({ key: 'prof.restart.button', comment: ['&& denotes a mnemonic'] }, "&&Restart")
                            }).then(res => {
                                // now we are ready to restart
                                if (res.confirmed) {
                                    this._nativeHostService.relaunch({ removeArgs });
                                }
                            });
                        });
                    }
                    else {
                        // simply restart
                        this._nativeHostService.relaunch({ removeArgs });
                    }
                });
            });
        }
        async _createPerfIssue(files) {
            const reportIssueUrl = this._productService.reportIssueUrl;
            if (!reportIssueUrl) {
                return;
            }
            const contrib = perfviewEditor_1.PerfviewContrib.get();
            const ref = await this._textModelResolverService.createModelReference(contrib.getInputUri());
            try {
                await this._clipboardService.writeText(ref.object.textEditorModel.getValue());
            }
            finally {
                ref.dispose();
            }
            const body = `
1. :warning: We have copied additional data to your clipboard. Make sure to **paste** here. :warning:
1. :warning: Make sure to **attach** these files from your *home*-directory: :warning:\n${files.map(file => `-\`${file}\``).join('\n')}
`;
            const baseUrl = reportIssueUrl;
            const queryStringPrefix = baseUrl.indexOf('?') === -1 ? '?' : '&';
            this._openerService.open(uri_1.URI.parse(`${baseUrl}${queryStringPrefix}body=${encodeURIComponent(body)}`));
        }
    };
    exports.StartupProfiler = StartupProfiler;
    exports.StartupProfiler = StartupProfiler = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, clipboardService_1.IClipboardService),
        __param(4, lifecycle_1.ILifecycleService),
        __param(5, extensions_1.IExtensionService),
        __param(6, opener_1.IOpenerService),
        __param(7, native_1.INativeHostService),
        __param(8, productService_1.IProductService),
        __param(9, files_1.IFileService),
        __param(10, label_1.ILabelService)
    ], StartupProfiler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnR1cFByb2ZpbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcGVyZm9ybWFuY2UvZWxlY3Ryb24tc2FuZGJveC9zdGFydHVwUHJvZmlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO1FBRTNCLFlBQ2tDLGNBQThCLEVBQ1YsbUJBQXVELEVBQ3hFLHlCQUE0QyxFQUM1QyxpQkFBb0MsRUFDckQsZ0JBQW1DLEVBQ25DLGdCQUFtQyxFQUNyQixjQUE4QixFQUMxQixrQkFBc0MsRUFDekMsZUFBZ0MsRUFDbkMsWUFBMEIsRUFDekIsYUFBNEI7WUFWM0IsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ1Ysd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFvQztZQUN4RSw4QkFBeUIsR0FBekIseUJBQXlCLENBQW1CO1lBQzVDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFHdkMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQzFCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDekMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ25DLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQ3pCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBRTVELGtDQUFrQztZQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDO2dCQUNYLGdCQUFnQixDQUFDLElBQUksbUNBQTJCO2dCQUNoRCxnQkFBZ0IsQ0FBQyxpQ0FBaUMsRUFBRTthQUNwRCxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDWixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sY0FBYztZ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