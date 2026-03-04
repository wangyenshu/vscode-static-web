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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/product/common/productService", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, lifecycle_1, path_1, platform_1, nls_1, extensionManagement_1, instantiation_1, notification_1, productService_1, extensionsActions_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalWslRecommendationContribution = void 0;
    let TerminalWslRecommendationContribution = class TerminalWslRecommendationContribution extends lifecycle_1.Disposable {
        static { this.ID = 'terminalWslRecommendation'; }
        constructor(instantiationService, productService, notificationService, extensionManagementService, terminalService) {
            super();
            if (!platform_1.isWindows) {
                return;
            }
            const exeBasedExtensionTips = productService.exeBasedExtensionTips;
            if (!exeBasedExtensionTips || !exeBasedExtensionTips.wsl) {
                return;
            }
            let listener = terminalService.onDidCreateInstance(async (instance) => {
                async function isExtensionInstalled(id) {
                    const extensions = await extensionManagementService.getInstalled();
                    return extensions.some(e => e.identifier.id === id);
                }
                if (!instance.shellLaunchConfig.executable || (0, path_1.basename)(instance.shellLaunchConfig.executable).toLowerCase() !== 'wsl.exe') {
                    return;
                }
                listener?.dispose();
                listener = undefined;
                const extId = Object.keys(exeBasedExtensionTips.wsl.recommendations).find(extId => exeBasedExtensionTips.wsl.recommendations[extId].important);
                if (!extId || await isExtensionInstalled(extId)) {
                    return;
                }
                notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('useWslExtension.title', "The '{0}' extension is recommended for opening a terminal in WSL.", exeBasedExtensionTips.wsl.friendlyName), [
                    {
                        label: (0, nls_1.localize)('install', 'Install'),
                        run: () => {
                            instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, extId).run();
                        }
                    }
                ], {
                    sticky: true,
                    neverShowAgain: { id: 'terminalConfigHelper/launchRecommendationsIgnore', scope: notification_1.NeverShowAgainScope.APPLICATION },
                    onCancel: () => { }
                });
            });
        }
    };
    exports.TerminalWslRecommendationContribution = TerminalWslRecommendationContribution;
    exports.TerminalWslRecommendationContribution = TerminalWslRecommendationContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, productService_1.IProductService),
        __param(2, notification_1.INotificationService),
        __param(3, extensionManagement_1.IExtensionManagementService),
        __param(4, terminal_1.ITerminalService)
    ], TerminalWslRecommendationContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxXc2xSZWNvbW1lbmRhdGlvbkNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxXc2xSZWNvbW1lbmRhdGlvbkNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSxxQ0FBcUMsR0FBM0MsTUFBTSxxQ0FBc0MsU0FBUSxzQkFBVTtpQkFDN0QsT0FBRSxHQUFHLDJCQUEyQixBQUE5QixDQUErQjtRQUV4QyxZQUN3QixvQkFBMkMsRUFDakQsY0FBK0IsRUFDMUIsbUJBQXlDLEVBQ2xDLDBCQUF1RCxFQUNsRSxlQUFpQztZQUVuRCxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksQ0FBQyxvQkFBUyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxxQkFBcUIsR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUM7WUFDbkUsSUFBSSxDQUFDLHFCQUFxQixJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzFELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxRQUFRLEdBQTRCLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUMsUUFBUSxFQUFDLEVBQUU7Z0JBQzVGLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxFQUFVO29CQUM3QyxNQUFNLFVBQVUsR0FBRyxNQUFNLDBCQUEwQixDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNuRSxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDckQsQ0FBQztnQkFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsSUFBSSxJQUFBLGVBQVEsRUFBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQzNILE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUM7Z0JBQ3BCLFFBQVEsR0FBRyxTQUFTLENBQUM7Z0JBRXJCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQy9JLElBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNqRCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsbUJBQW1CLENBQUMsTUFBTSxDQUN6Qix1QkFBUSxDQUFDLElBQUksRUFDYixJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSxtRUFBbUUsRUFBRSxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQzlJO29CQUNDO3dCQUNDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO3dCQUNyQyxHQUFHLEVBQUUsR0FBRyxFQUFFOzRCQUNULG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxREFBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDckYsQ0FBQztxQkFDRDtpQkFDRCxFQUNEO29CQUNDLE1BQU0sRUFBRSxJQUFJO29CQUNaLGNBQWMsRUFBRSxFQUFFLEVBQUUsRUFBRSxrREFBa0QsRUFBRSxLQUFLLEVBQUUsa0NBQW1CLENBQUMsV0FBVyxFQUFFO29CQUNsSCxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztpQkFDbkIsQ0FDRCxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDOztJQXpEVyxzRkFBcUM7b0RBQXJDLHFDQUFxQztRQUkvQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsZ0NBQWUsQ0FBQTtRQUNmLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSxpREFBMkIsQ0FBQTtRQUMzQixXQUFBLDJCQUFnQixDQUFBO09BUk4scUNBQXFDLENBMERqRCJ9