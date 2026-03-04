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
define(["require", "exports", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/nls", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification", "vs/platform/log/common/log", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, pickerQuickAccess_1, nls_1, extensions_1, extensionManagement_1, notification_1, log_1, panecomposite_1) {
    "use strict";
    var InstallExtensionQuickAccessProvider_1, ManageExtensionsQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManageExtensionsQuickAccessProvider = exports.InstallExtensionQuickAccessProvider = void 0;
    let InstallExtensionQuickAccessProvider = class InstallExtensionQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { InstallExtensionQuickAccessProvider_1 = this; }
        static { this.PREFIX = 'ext install '; }
        constructor(paneCompositeService, galleryService, extensionsService, notificationService, logService) {
            super(InstallExtensionQuickAccessProvider_1.PREFIX);
            this.paneCompositeService = paneCompositeService;
            this.galleryService = galleryService;
            this.extensionsService = extensionsService;
            this.notificationService = notificationService;
            this.logService = logService;
        }
        _getPicks(filter, disposables, token) {
            // Nothing typed
            if (!filter) {
                return [{
                        label: (0, nls_1.localize)('type', "Type an extension name to install or search.")
                    }];
            }
            const genericSearchPickItem = {
                label: (0, nls_1.localize)('searchFor', "Press Enter to search for extension '{0}'.", filter),
                accept: () => this.searchExtension(filter)
            };
            // Extension ID typed: try to find it
            if (/\./.test(filter)) {
                return this.getPicksForExtensionId(filter, genericSearchPickItem, token);
            }
            // Extension name typed: offer to search it
            return [genericSearchPickItem];
        }
        async getPicksForExtensionId(filter, fallback, token) {
            try {
                const [galleryExtension] = await this.galleryService.getExtensions([{ id: filter }], token);
                if (token.isCancellationRequested) {
                    return []; // return early if canceled
                }
                if (!galleryExtension) {
                    return [fallback];
                }
                return [{
                        label: (0, nls_1.localize)('install', "Press Enter to install extension '{0}'.", filter),
                        accept: () => this.installExtension(galleryExtension, filter)
                    }];
            }
            catch (error) {
                if (token.isCancellationRequested) {
                    return []; // expected error
                }
                this.logService.error(error);
                return [fallback];
            }
        }
        async installExtension(extension, name) {
            try {
                await openExtensionsViewlet(this.paneCompositeService, `@id:${name}`);
                await this.extensionsService.installFromGallery(extension);
            }
            catch (error) {
                this.notificationService.error(error);
            }
        }
        async searchExtension(name) {
            openExtensionsViewlet(this.paneCompositeService, name);
        }
    };
    exports.InstallExtensionQuickAccessProvider = InstallExtensionQuickAccessProvider;
    exports.InstallExtensionQuickAccessProvider = InstallExtensionQuickAccessProvider = InstallExtensionQuickAccessProvider_1 = __decorate([
        __param(0, panecomposite_1.IPaneCompositePartService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService)
    ], InstallExtensionQuickAccessProvider);
    let ManageExtensionsQuickAccessProvider = class ManageExtensionsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { ManageExtensionsQuickAccessProvider_1 = this; }
        static { this.PREFIX = 'ext '; }
        constructor(paneCompositeService) {
            super(ManageExtensionsQuickAccessProvider_1.PREFIX);
            this.paneCompositeService = paneCompositeService;
        }
        _getPicks() {
            return [{
                    label: (0, nls_1.localize)('manage', "Press Enter to manage your extensions."),
                    accept: () => openExtensionsViewlet(this.paneCompositeService)
                }];
        }
    };
    exports.ManageExtensionsQuickAccessProvider = ManageExtensionsQuickAccessProvider;
    exports.ManageExtensionsQuickAccessProvider = ManageExtensionsQuickAccessProvider = ManageExtensionsQuickAccessProvider_1 = __decorate([
        __param(0, panecomposite_1.IPaneCompositePartService)
    ], ManageExtensionsQuickAccessProvider);
    async function openExtensionsViewlet(paneCompositeService, search = '') {
        const viewlet = await paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
        const view = viewlet?.getViewPaneContainer();
        view?.search(search);
        view?.focus();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1F1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9icm93c2VyL2V4dGVuc2lvbnNRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW9DLFNBQVEsNkNBQWlEOztpQkFFbEcsV0FBTSxHQUFHLGNBQWMsQUFBakIsQ0FBa0I7UUFFL0IsWUFDNkMsb0JBQStDLEVBQ2hELGNBQXdDLEVBQ3JDLGlCQUE4QyxFQUNyRCxtQkFBeUMsRUFDbEQsVUFBdUI7WUFFckQsS0FBSyxDQUFDLHFDQUFtQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBTk4seUJBQW9CLEdBQXBCLG9CQUFvQixDQUEyQjtZQUNoRCxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDckMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUE2QjtZQUNyRCx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ2xELGVBQVUsR0FBVixVQUFVLENBQWE7UUFHdEQsQ0FBQztRQUVTLFNBQVMsQ0FBQyxNQUFjLEVBQUUsV0FBNEIsRUFBRSxLQUF3QjtZQUV6RixnQkFBZ0I7WUFDaEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE9BQU8sQ0FBQzt3QkFDUCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLDhDQUE4QyxDQUFDO3FCQUN2RSxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsTUFBTSxxQkFBcUIsR0FBMkI7Z0JBQ3JELEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsNENBQTRDLEVBQUUsTUFBTSxDQUFDO2dCQUNsRixNQUFNLEVBQUUsR0FBRyxF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