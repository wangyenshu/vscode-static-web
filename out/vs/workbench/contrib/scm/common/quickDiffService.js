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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/languageSelector", "vs/base/common/event", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, lifecycle_1, resources_1, languageSelector_1, event_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickDiffService = void 0;
    function createProviderComparer(uri) {
        return (a, b) => {
            if (a.rootUri && !b.rootUri) {
                return -1;
            }
            else if (!a.rootUri && b.rootUri) {
                return 1;
            }
            else if (!a.rootUri && !b.rootUri) {
                return 0;
            }
            const aIsParent = (0, resources_1.isEqualOrParent)(uri, a.rootUri);
            const bIsParent = (0, resources_1.isEqualOrParent)(uri, b.rootUri);
            if (aIsParent && bIsParent) {
                return a.rootUri.fsPath.length - b.rootUri.fsPath.length;
            }
            else if (aIsParent) {
                return -1;
            }
            else if (bIsParent) {
                return 1;
            }
            else {
                return 0;
            }
        };
    }
    let QuickDiffService = class QuickDiffService extends lifecycle_1.Disposable {
        constructor(uriIdentityService) {
            super();
            this.uriIdentityService = uriIdentityService;
            this.quickDiffProviders = new Set();
            this._onDidChangeQuickDiffProviders = this._register(new event_1.Emitter());
            this.onDidChangeQuickDiffProviders = this._onDidChangeQuickDiffProviders.event;
        }
        addQuickDiffProvider(quickDiff) {
            this.quickDiffProviders.add(quickDiff);
            this._onDidChangeQuickDiffProviders.fire();
            return {
                dispose: () => {
                    this.quickDiffProviders.delete(quickDiff);
                    this._onDidChangeQuickDiffProviders.fire();
                }
            };
        }
        isQuickDiff(diff) {
            return !!diff.originalResource && (typeof diff.label === 'string') && (typeof diff.isSCM === 'boolean');
        }
        async getQuickDiffs(uri, language = '', isSynchronized = false) {
            const providers = Array.from(this.quickDiffProviders)
                .filter(provider => !provider.rootUri || this.uriIdentityService.extUri.isEqualOrParent(uri, provider.rootUri))
                .sort(createProviderComparer(uri));
            const diffs = await Promise.all(providers.map(async (provider) => {
                const scoreValue = provider.selector ? (0, languageSelector_1.score)(provider.selector, uri, language, isSynchronized, undefined, undefined) : 10;
                const diff = {
                    originalResource: scoreValue > 0 ? await provider.getOriginalResource(uri) ?? undefined : undefined,
                    label: provider.label,
                    isSCM: provider.isSCM
                };
                return diff;
            }));
            return diffs.filter(this.isQuickDiff);
        }
    };
    exports.QuickDiffService = QuickDiffService;
    exports.QuickDiffService = QuickDiffService = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService)
    ], QuickDiffService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tEaWZmU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NjbS9jb21tb24vcXVpY2tEaWZmU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVaEcsU0FBUyxzQkFBc0IsQ0FBQyxHQUFRO1FBQ3ZDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDZixJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO2lCQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO2lCQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNyQyxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLDJCQUFlLEVBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFRLENBQUMsQ0FBQztZQUNuRCxNQUFNLFNBQVMsR0FBRyxJQUFBLDJCQUFlLEVBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFRLENBQUMsQ0FBQztZQUVuRCxJQUFJLFNBQVMsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDNUIsT0FBTyxDQUFDLENBQUMsT0FBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE9BQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzVELENBQUM7aUJBQU0sSUFBSSxTQUFTLEVBQUUsQ0FBQztn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