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
define(["require", "exports", "vs/platform/product/common/productService", "vs/base/common/actions", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/base/common/cancellation", "vs/platform/request/common/request", "vs/base/common/resources", "vs/platform/dialogs/common/dialogs", "vs/platform/opener/common/opener", "vs/platform/native/common/native", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/profiling/common/profiling", "vs/platform/files/common/files", "vs/base/common/buffer"], function (require, exports, productService_1, actions_1, uri_1, instantiation_1, nls_1, cancellation_1, request_1, resources_1, dialogs_1, opener_1, native_1, environmentService_1, profiling_1, files_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SlowExtensionAction = void 0;
    exports.createSlowExtensionAction = createSlowExtensionAction;
    class RepoInfo {
        static fromExtension(desc) {
            let result;
            // scheme:auth/OWNER/REPO/issues/
            if (desc.bugs && typeof desc.bugs.url === 'string') {
                const base = uri_1.URI.parse(desc.bugs.url);
                const match = /\/([^/]+)\/([^/]+)\/issues\/?$/.exec(desc.bugs.url);
                if (match) {
                    result = {
                        base: base.with({ path: null, fragment: null, query: null }).toString(true),
                        owner: match[1],
                        repo: match[2]
                    };
                }
            }
            // scheme:auth/OWNER/REPO.git
            if (!result && desc.repository && typeof desc.repository.url === 'string') {
                const base = uri_1.URI.parse(desc.repository.url);
                const match = /\/([^/]+)\/([^/]+)(\.git)?$/.exec(desc.repository.url);
                if (match) {
                    result = {
                        base: base.with({ path: null, fragment: null, query: null }).toString(true),
                        owner: match[1],
                        repo: match[2]
                    };
                }
            }
            // for now only GH is supported
            if (result && result.base.indexOf('github') === -1) {
                result = undefined;
            }
            return result;
        }
    }
    let SlowExtensionAction = class SlowExtensionAction extends actions_1.Action {
        constructor(extension, profile, _instantiationService) {
            super('report.slow', (0, nls_1.localize)('cmd.reportOrShow', "Performance Issue"), 'extension-action report-issue');
            this.extension = extension;
            this.profile = profile;
            this._instantiationService = _instantiationService;
            this.enabled = Boolean(RepoInfo.fromExtension(extension));
        }
        async run() {
            const action = await this._instantiationService.invokeFunction(createSlowExtensionAction, this.extension, this.profile);
            if (action) {
                await action.run();
            }
        }
    };
    exports.SlowExtensionAction = SlowExtensionAction;
    exports.SlowExtensionAction = SlowExtensionAction = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], SlowExtensionAction);
    async function createSlowExtensionAction(accessor, extension, profile) {
        const info = RepoInfo.fromExtension(extension);
        if (!info) {
            return undefined;
        }
        const requestService = accessor.get(request_1.IRequestService);
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        const url = `https://api.github.com/search/issues?q=is:issue+state:open+in:title+repo:${info.owner}/${info.repo}+%22Extension+causes+high+cpu+load%22`;
        let res;
        try {
            res = await requestService.request({ url }, cancellation_1.CancellationToken.None);
        }
        catch {
            return undefined;
        }
        const rawText = await (0, request_1.asText)(res);
        if (!rawText) {
            return undefined;
        }
        const data = JSON.parse(rawText);
        if (!data || typeof data.total_count !== 'number') {
            return undefined;
        }
        else if (data.total_count === 0) {
            return instaService.createInstance(ReportExtensionSlowAction, extension, info, profile);
        }
        else {
            return instaService.createInstance(ShowExtensionSlowAction, extension, info, profile);
        }
    }
    let ReportExtensionSlowAction = class ReportExtensionSlowAction extends actions_1.Action {
        constructor(extension, repoInfo, profile, _dialogService, _openerService, _productService, _nativeHostService, _environmentService, _fileService) {
            super('report.slow', (0, nls_1.localize)('cmd.report', "Report Issue"));
            this.extension = extension;
            this.repoInfo = repoInfo;
            this.profile = profile;
            this._dialogService = _dialogService;
            this._openerService = _openerService;
            this._productService = _productService;
            this._nativeHostService = _nativeHostService;
            this._environmentService = _environmentService;
            this._fileService = _fileService;
        }
        async run() {
            // rewrite pii (paths) and store on disk
            const data = profiling_1.Utils.rewriteAbsolutePaths(this.profile.data, 'pii_removed');
            const path = (0, resources_1.joinPath)(this._environmentService.tmpDir, `${this.extension.identifier.value}-unresponsive.cpuprofile.txt`);
            await this._fileService.writeFile(path, buffer_1.VSBuffer.fromString(JSON.stringify(data, undefined, 4)));
            // build issue
            const os = await this._nativeHostService.getOSProperties();
            const title = encodeURIComponent('Extension causes high cpu load');
            const osVersion = `${os.type} ${os.arch} ${os.release}`;
            const message = `:warning: Make sure to **attach** this file from your *home*-directory:\n:warning:\`${path}\`\n\nFind more details here: https://github.com/microsoft/vscode/wiki/Explain-extension-causes-high-cpu-load`;
            const body = encodeURIComponent(`- Issue Type: \`Performance\`
- Extension Name: \`${this.extension.name}\`
- Extension Version: \`${this.extension.version}\`
- OS Version: \`${osVersion}\`
- VS Code version: \`${this._productService.version}\`\n\n${message}`);
            const url = `${this.repoInfo.base}/${this.repoInfo.owner}/${this.repoInfo.repo}/issues/new/?body=${body}&title=${title}`;
            this._openerService.open(uri_1.URI.parse(url));
            this._dialogService.info((0, nls_1.localize)('attach.title', "Did you attach the CPU-Profile?"), (0, nls_1.localize)('attach.msg', "This is a reminder to make sure that you have not forgotten to attach '{0}' to the issue you have just created.", path.fsPath));
        }
    };
    ReportExtensionSlowAction = __decorate([
        __param(3, dialogs_1.IDialogService),
        __param(4, opener_1.IOpenerService),
        __param(5, productService_1.IProductService),
        __param(6, native_1.INativeHostService),
        __param(7, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(8, files_1.IFileService)
    ], ReportExtensionSlowAction);
    let ShowExtensionSlowAction = class ShowExtensionSlowAction extends actions_1.Action {
        constructor(extension, repoInfo, profile, _dialogService, _openerService, _environmentService, _fileService) {
            super('show.slow', (0, nls_1.localize)('cmd.show', "Show Issues"));
            this.extension = extension;
            this.repoInfo = repoInfo;
            this.profile = profile;
            this._dialogService = _dialogService;
            this._openerService = _openerService;
            this._environmentService = _environmentService;
            this._fileService = _fileService;
        }
        async run() {
            // rewrite pii (paths) and store on disk
            const data = profiling_1.Utils.rewriteAbsolutePaths(this.profile.data, 'pii_removed');
            const path = (0, resources_1.joinPath)(this._environmentService.tmpDir, `${this.extension.identifier.value}-unresponsive.cpuprofile.txt`);
            await this._fileService.writeFile(path, buffer_1.VSBuffer.fromString(JSON.stringify(data, undefined, 4)));
            // show issues
            const url = `${this.repoInfo.base}/${this.repoInfo.owner}/${this.repoInfo.repo}/issues?utf8=✓&q=is%3Aissue+state%3Aopen+%22Extension+causes+high+cpu+load%22`;
            this._openerService.open(uri_1.URI.parse(url));
            this._dialogService.info((0, nls_1.localize)('attach.title', "Did you attach the CPU-Profile?"), (0, nls_1.localize)('attach.msg2', "This is a reminder to make sure that you have not forgotten to attach '{0}' to an existing performance issue.", path.fsPath));
        }
    };
    ShowExtensionSlowAction = __decorate([
        __param(3, dialogs_1.IDialogService),
        __param(4, opener_1.IOpenerService),
        __param(5, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(6, files_1.IFileService)
    ], ShowExtensionSlowAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Nsb3dBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9lbGVjdHJvbi1zYW5kYm94L2V4dGVuc2lvbnNTbG93QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtRmhHLDhEQWlDQztJQS9GRCxNQUFlLFFBQVE7UUFLdEIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUEyQjtZQUUvQyxJQUFJLE1BQTRCLENBQUM7WUFFakMsaUNBQWlDO1lBQ2pDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNwRCxNQUFNLElBQUksR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sS0FBSyxHQUFHLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLE1BQU0sR0FBRzt3QkFDUixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO3dCQUMzRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDZixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztxQkFDZCxDQUFDO2dCQUNILENBQUM7WUFDRixDQUFDO1lBQ0QsNkJBQTZCO1lBQzdCLElBQUksQ0FB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