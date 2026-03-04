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
define(["require", "exports", "vs/base/common/arrays", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensionsApiProposals"], function (require, exports, arrays_1, extensions_1, log_1, productService_1, environmentService_1, extensionsApiProposals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsProposedApi = void 0;
    let ExtensionsProposedApi = class ExtensionsProposedApi {
        constructor(_logService, _environmentService, productService) {
            this._logService = _logService;
            this._environmentService = _environmentService;
            this._envEnabledExtensions = new Set((_environmentService.extensionEnabledProposedApi ?? []).map(id => extensions_1.ExtensionIdentifier.toKey(id)));
            this._envEnablesProposedApiForAll =
                !_environmentService.isBuilt || // always allow proposed API when running out of sources
                    (_environmentService.isExtensionDevelopment && productService.quality !== 'stable') || // do not allow proposed API against stable builds when developing an extension
                    (this._envEnabledExtensions.size === 0 && Array.isArray(_environmentService.extensionEnabledProposedApi)); // always allow proposed API if --enable-proposed-api is provided without extension ID
            this._productEnabledExtensions = new Map();
            // NEW world - product.json spells out what proposals each extension can use
            if (productService.extensionEnabledApiProposals) {
                for (const [k, value] of Object.entries(productService.extensionEnabledApiProposals)) {
                    const key = extensions_1.ExtensionIdentifier.toKey(k);
                    const proposalNames = value.filter(name => {
                        if (!extensionsApiProposals_1.allApiProposals[name]) {
                            _logService.warn(`Via 'product.json#extensionEnabledApiProposals' extension '${key}' wants API proposal '${name}' but that proposal DOES NOT EXIST. Likely, the proposal has been finalized (check 'vscode.d.ts') or was abandoned.`);
                            return false;
                        }
                        return true;
                    });
                    this._productEnabledExtensions.set(key, proposalNames);
                }
            }
        }
        updateEnabledApiProposals(extensions) {
            for (const extension of extensions) {
                this.doUpdateEnabledApiProposals(extension);
            }
        }
        doUpdateEnabledApiProposals(_extension) {
            const extension = _extension;
            const key = extensions_1.ExtensionIdentifier.toKey(_extension.identifier);
            // warn about invalid proposal and remove them from the list
            if ((0, arrays_1.isNonEmptyArray)(extension.enabledApiProposals)) {
                extension.enabledApiProposals = extension.enabledApiProposals.filter(name => {
                    const result = Boolean(extensionsApiProposals_1.allApiProposals[name]);
                    if (!result) {
                        this._logService.error(`Extension '${key}' wants API proposal '${name}' but that proposal DOES NOT EXIST. Likely, the proposal has been finalized (check 'vscode.d.ts') or was abandoned.`);
                    }
                    return result;
                });
            }
            if (this._productEnabledExtensions.has(key)) {
                // NOTE that proposals that are listed in product.json override whatever is declared in the extension
                // itself. This is needed for us to know what proposals are used "in the wild". Merging product.json-proposals
                // and extension-proposals would break that.
                const productEnabledProposals = this._productEnabledExtensions.get(key);
                // check for difference between product.json-declaration and package.json-declaration
                const productSet = new Set(productEnabledProposals);
                const extensionSet = new Set(extension.enabledApiProposals);
                const diff = new Set([...extensionSet].filter(a => !productSet.has(a)));
                if (diff.size > 0) {
                    this._logService.error(`Extension '${key}' appears in product.json but enables LESS API proposals than the extension wants.\npackage.json (LOSES): ${[...extensionSet].join(', ')}\nproduct.json (WINS): ${[...productSet].join(', ')}`);
                    if (this._environmentService.isExtensionDevelopment) {
                        this._logService.error(`Proceeding with EXTRA proposals (${[...diff].join(', ')}) because extension is in development mode. Still, this EXTENSION WILL BE BROKEN unless product.json is updated.`);
                        productEnabledProposals.push(...diff);
                    }
                }
                extension.enabledApiProposals = productEnabledProposals;
                return;
            }
            if (this._envEnablesProposedApiForAll || this._envEnabledExtensions.has(key)) {
                // proposed API usage is not restricted and allowed just like the extension
                // has declared it
                return;
            }
            if (!extension.isBuiltin && (0, arrays_1.isNonEmptyArray)(extension.enabledApiProposals)) {
                // restrictive: extension cannot use proposed API in this context and its declaration is nulled
                this._logService.error(`Extension '${extension.identifier.value} CANNOT USE these API proposals '${extension.enabledApiProposals?.join(', ') || '*'}'. You MUST start in extension development mode or use the --enable-proposed-api command line flag`);
                extension.enabledApiProposals = [];
            }
        }
    };
    exports.ExtensionsProposedApi = ExtensionsProposedApi;
    exports.ExtensionsProposedApi = ExtensionsProposedApi = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, productService_1.IProductService)
    ], ExtensionsProposedApi);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Byb3Bvc2VkQXBpLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvbnNQcm9wb3NlZEFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7UUFNakMsWUFDK0IsV0FBd0IsRUFDUCxtQkFBaUQsRUFDL0UsY0FBK0I7WUFGbEIsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDUCx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQThCO1lBSWhHLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLDJCQUEyQixJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLGdDQUFtQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdkksSUFBSSxDQUFDLDRCQUE0QjtnQkFDaEMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLElBQUksd0RBQXdEO29CQUN4RixDQUFDLG1CQUFtQixDQUFDLHNCQUFzQixJQUFJLGNBQWMsQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLElBQUksK0VBQStFO29CQUN0SyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUMsc0ZBQXNGO1lBRWxNLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztZQUd0RSw0RUFBNEU7WUFDNUUsSUFBSSxjQUFjLENBQUMsNEJB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