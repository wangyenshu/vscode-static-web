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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/network", "vs/base/common/severity", "vs/base/common/uri", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/url/browser/trustedDomains", "vs/workbench/contrib/url/common/urlGlob", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/editor/common/editorService"], function (require, exports, dom_1, window_1, network_1, severity_1, uri_1, nls_1, clipboardService_1, configuration_1, dialogs_1, instantiation_1, opener_1, productService_1, quickInput_1, storage_1, telemetry_1, workspace_1, workspaceTrust_1, trustedDomains_1, urlGlob_1, authentication_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenerValidatorContributions = void 0;
    exports.isURLDomainTrusted = isURLDomainTrusted;
    let OpenerValidatorContributions = class OpenerValidatorContributions {
        constructor(_openerService, _storageService, _dialogService, _productService, _quickInputService, _editorService, _clipboardService, _telemetryService, _instantiationService, _authenticationService, _workspaceContextService, _configurationService, _workspaceTrustService) {
            this._openerService = _openerService;
            this._storageService = _storageService;
            this._dialogService = _dialogService;
            this._productService = _productService;
            this._quickInputService = _quickInputService;
            this._editorService = _editorService;
            this._clipboardService = _clipboardService;
            this._telemetryService = _telemetryService;
            this._instantiationService = _instantiationService;
            this._authenticationService = _authenticationService;
            this._workspaceContextService = _workspaceContextService;
            this._configurationService = _configurationService;
            this._workspaceTrustService = _workspaceTrustService;
            this._openerService.registerValidator({ shouldOpen: (uri, options) => this.validateLink(uri, options) });
            this._readAuthenticationTrustedDomainsResult = new dom_1.WindowIdleValue(window_1.mainWindow, () => this._instantiationService.invokeFunction(trustedDomains_1.readAuthenticationTrustedDomains));
            this._authenticationService.onDidRegisterAuthenticationProvider(() => {
                this._readAuthenticationTrustedDomainsResult?.dispose();
                this._readAuthenticationTrustedDomainsResult = new dom_1.WindowIdleValue(window_1.mainWindow, () => this._instantiationService.invokeFunction(trustedDomains_1.readAuthenticationTrustedDomains));
            });
            this._readWorkspaceTrustedDomainsResult = new dom_1.WindowIdleValue(window_1.mainWindow, () => this._instantiationService.invokeFunction(trustedDomains_1.readWorkspaceTrustedDomains));
            this._workspaceContextService.onDidChangeWorkspaceFolders(() => {
                this._readWorkspaceTrustedDomainsResult?.dispose();
                this._readWorkspaceTrustedDomainsResult = new dom_1.WindowIdleValue(window_1.mainWindow, () => this._instantiationService.invokeFunction(trustedDomains_1.readWorkspaceTrustedDomains));
            });
        }
        async validateLink(resource, openOptions) {
            if (!(0, network_1.matchesScheme)(resource, network_1.Schemas.http) && !(0, network_1.matchesScheme)(resource, network_1.Schemas.https)) {
                return true;
            }
            if (openOptions?.fromWorkspace && this._workspaceTrustService.isWorkspaceTrusted() && !this._configurationService.getValue('workbench.trustedDomains.promptInTrustedWorkspace')) {
                return true;
            }
            const originalResource = resource;
            let resourceUri;
            if (typeof resource === 'string') {
                resourceUri = uri_1.URI.parse(resource);
            }
            else {
                resourceUri = resource;
            }
            const { scheme, authority, path, query, fragment } = resourceUri;
            const domainToOpen = `${scheme}://${authority}`;
            const [workspaceDomains, userDomains] = await Promise.all([this._readWorkspaceTrustedDomainsResult.value, this._readAuthenticationTrustedDomainsResult.value]);
            const { defaultTrustedDomains, trustedDomains, } = this._instantiationService.invokeFunction(trustedDomains_1.readStaticTrustedDomains);
            const allTrustedDomains = [...defaultTrustedDomains, ...trustedDomains, ...userDomains, ...workspaceDomains];
            if (isURLDomainTrusted(resourceUri, allTrustedDomains)) {
                return true;
            }
            else {
                let formattedLink = `${scheme}://${authority}${path}`;
                const linkTail = `${query ? '?' + query : ''}${fragment ? '#' + fragment : ''}`;
                const remainingLength = Math.max(0, 60 - formattedLink.length);
                const linkTailLengthToKeep = Math.min(Math.max(5, remainingLength), linkTail.length);
                if (linkTailLengthToKeep === linkTail.length) {
                    formattedLink += linkTail;
                }
                else {
                    // keep the first char ? or #
                    // add ... and keep the tail end as much as possible
                    formattedLink += linkTail.charAt(0) + '...' + linkTail.substring(linkTail.length - linkTailLengthToKeep + 1);
                }
                const { result } = await this._dialogService.prompt({
                    type: severity_1.default.Info,
                    message: (0, nls_1.localize)('openExternalLinkAt', 'Do you want {0} to open the external website?', this._productService.nameShort),
                    detail: typeof originalResource === 'string' ? originalResource : formattedLink,
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, '&&Open'),
                            run: () => true
                        },
                        {
                            label: (0, nls_1.localize)({ key: 'copy', comment: ['&& denotes a mnemonic'] }, '&&Copy'),
                            run: () => {
                                this._clipboardService.writeText(typeof originalResource === 'string' ? originalResource : resourceUri.toString(true));
                                return false;
                            }
                        },
                        {
                            label: (0, nls_1.localize)({ key: 'configureTrustedDomains', comment: ['&& denotes a mnemonic'] }, 'Configure &&Trusted Domains'),
                            run: async () => {
                                const pickedDomains = await (0, trustedDomains_1.configureOpenerTrustedDomainsHandler)(trustedDomains, domainToOpen, resourceUri, this._quickInputService, this._storageService, this._editorService, this._telemetryService);
                                // Trust all domains
                                if (pickedDomains.indexOf('*') !== -1) {
                                    return true;
                                }
                                // Trust current domain
                                if (isURLDomainTrusted(resourceUri, pickedDomains)) {
                                    return true;
                                }
                                return false;
                            }
                        }
                    ],
                    cancelButton: {
                        run: () => false
                    }
                });
                return result;
            }
        }
    };
    exports.OpenerValidatorContributions = OpenerValidatorContributions;
    exports.OpenerValidatorContributions = OpenerValidatorContributions = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, storage_1.IStorageService),
        __param(2, dialogs_1.IDialogService),
        __param(3, productService_1.IProductService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, editorService_1.IEditorService),
        __param(6, clipboardService_1.IClipboardService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, authentication_1.IAuthenticationService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], OpenerValidatorContributions);
    const rLocalhost = /^localhost(:\d+)?$/i;
    const r127 = /^127.0.0.1(:\d+)?$/;
    function isLocalhostAuthority(authority) {
        return rLocalhost.test(authority) || r127.test(authority);
    }
    /**
     * Case-normalize some case-insensitive URLs, such as github.
     */
    function normalizeURL(url) {
        const caseInsensitiveAuthorities = ['github.com'];
        try {
            const parsed = typeof url === 'string' ? uri_1.URI.parse(url, true) : url;
            if (caseInsensitiveAuthorities.includes(parsed.authority)) {
                return parsed.with({ path: parsed.path.toLowerCase() }).toString(true);
            }
            else {
                return parsed.toString(true);
            }
        }
        catch {
            return url.toString();
        }
    }
    /**
     * Check whether a domain like https://www.microsoft.com matches
     * the list of trusted domains.
     *
     * - Schemes must match
     * - There's no subdomain matching. For example https://microsoft.com doesn't match https://www.microsoft.com
     * - Star matches all subdomains. For example https://*.microsoft.com matches https://www.microsoft.com and https://foo.bar.microsoft.com
     */
    function isURLDomainTrusted(url, trustedDomains) {
        url = uri_1.URI.parse(normalizeURL(url));
        trustedDomains = trustedDomains.map(normalizeURL);
        if (isLocalhostAuthority(url.authority)) {
            return true;
        }
        for (let i = 0; i < trustedDomains.length; i++) {
            if (trustedDomains[i] === '*') {
                return true;
            }
            if ((0, urlGlob_1.testUrlMatchesGlob)(url, trustedDomains[i])) {
                return true;
            }
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1c3RlZERvbWFpbnNWYWxpZGF0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi91cmwvYnJvd3Nlci90cnVzdGVkRG9tYWluc1ZhbGlkYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4TGhHLGdEQW1CQztJQXhMTSxJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE0QjtRQUt4QyxZQUNrQyxjQUE4QixFQUM3QixlQUFnQyxFQUNqQyxjQUE4QixFQUM3QixlQUFnQyxFQUM3QixrQkFBc0MsRUFDMUMsY0FBOEIsRUFDM0IsaUJBQW9DLEVBQ3BDLGlCQUFvQyxFQUNoQyxxQkFBNEMsRUFDM0Msc0JBQThDLEVBQzVDLHdCQUFrRCxFQUNyRCxxQkFBNEMsRUFDakMsc0JBQXdEO1lBWjFFLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUM3QixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDakMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQzdCLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUM3Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQzFDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUMzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3BDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDaEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMzQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQzVDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDckQsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNqQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQWtDO1lBRTNHLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENB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