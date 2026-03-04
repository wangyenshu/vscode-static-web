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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService"], function (require, exports, platform_1, strings_1, uri_1, instantiation_1, log_1, extHost_protocol_1, extHostInitDataService_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostLocalizationService = exports.ExtHostLocalizationService = void 0;
    let ExtHostLocalizationService = class ExtHostLocalizationService {
        constructor(initData, rpc, logService) {
            this.logService = logService;
            this.bundleCache = new Map();
            this._proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadLocalization);
            this.currentLanguage = initData.environment.appLanguage;
            this.isDefaultLanguage = this.currentLanguage === platform_1.LANGUAGE_DEFAULT;
        }
        getMessage(extensionId, details) {
            const { message, args, comment } = details;
            if (this.isDefaultLanguage) {
                return (0, strings_1.format2)(message, (args ?? {}));
            }
            let key = message;
            if (comment && comment.length > 0) {
                key += `/${Array.isArray(comment) ? comment.join('') : comment}`;
            }
            const str = this.bundleCache.get(extensionId)?.contents[key];
            if (!str) {
                this.logService.warn(`Using default string since no string found in i18n bundle that has the key: ${key}`);
            }
            return (0, strings_1.format2)(str ?? message, (args ?? {}));
        }
        getBundle(extensionId) {
            return this.bundleCache.get(extensionId)?.contents;
        }
        getBundleUri(extensionId) {
            return this.bundleCache.get(extensionId)?.uri;
        }
        async initializeLocalizedMessages(extension) {
            if (this.isDefaultLanguage
                || (!extension.l10n && !extension.isBuiltin)) {
                return;
            }
            if (this.bundleCache.has(extension.identifier.value)) {
                return;
            }
            let contents;
            const bundleUri = await this.getBundleLocation(extension);
            if (!bundleUri) {
                this.logService.error(`No bundle location found for extension ${extension.identifier.value}`);
                return;
            }
            try {
                const response = await this._proxy.$fetchBundleContents(bundleUri);
                const result = JSON.parse(response);
                // 'contents.bundle' is a well-known key in the language pack json file that contains the _code_ translations for the extension
                contents = extension.isBuiltin ? result.contents?.bundle : result;
            }
            catch (e) {
                this.logService.error(`Failed to load translations for ${extension.identifier.value} from ${bundleUri}: ${e.message}`);
                return;
            }
            if (contents) {
                this.bundleCache.set(extension.identifier.value, {
                    contents,
                    uri: bundleUri
                });
            }
        }
        async getBundleLocation(extension) {
            if (extension.isBuiltin) {
                const uri = await this._proxy.$fetchBuiltInBundleUri(extension.identifier.value, this.currentLanguage);
                return uri_1.URI.revive(uri);
            }
            return extension.l10n
                ? uri_1.URI.joinPath(extension.extensionLocation, extension.l10n, `bundle.l10n.${this.currentLanguage}.json`)
                : undefined;
        }
    };
    exports.ExtHostLocalizationService = ExtHostLocalizationService;
    exports.ExtHostLocalizationService = ExtHostLocalizationService = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService),
        __param(1, extHostRpcService_1.IExtHostRpcService),
        __param(2, log_1.ILogService)
    ], ExtHostLocalizationService);
    exports.IExtHostLocalizationService = (0, instantiation_1.createDecorator)('IExtHostLocalizationService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExvY2FsaXphdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0TG9jYWxpemF0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMEI7UUFTdEMsWUFDMEIsUUFBaUMsRUFDdEMsR0FBdUIsRUFDOUIsVUFBd0M7WUFBdkIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUxyQyxnQkFBVyxHQUFtRSxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBT3hHLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQztZQUN4RCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGVBQWUsS0FBSywyQkFBZ0IsQ0FBQztRQUNwRSxDQUFDO1FBRUQsVUFBVSxDQUFDLFdBQW1CLEVBQUUsT0FBdUI7WUFDdEQsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsT0FBTyxDQUFDO1lBQzNDLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzVCLE9BQU8sSUFBQSxpQkFBTyxFQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7WUFFRCxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUM7WUFDbEIsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsR0FB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