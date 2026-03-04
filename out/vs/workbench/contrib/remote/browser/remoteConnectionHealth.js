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
define(["require", "exports", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/environment/common/environmentService", "vs/nls", "vs/base/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/banner/browser/bannerService", "vs/platform/opener/common/opener", "vs/workbench/services/host/browser/host", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/dialogs/common/dialogs", "vs/base/common/codicons", "vs/base/common/severity"], function (require, exports, remoteAgentService_1, environmentService_1, nls_1, platform_1, telemetry_1, remoteHosts_1, bannerService_1, opener_1, host_1, storage_1, productService_1, dialogs_1, codicons_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InitialRemoteConnectionHealthContribution = void 0;
    const REMOTE_UNSUPPORTED_CONNECTION_CHOICE_KEY = 'remote.unsupportedConnectionChoice';
    const BANNER_REMOTE_UNSUPPORTED_CONNECTION_DISMISSED_KEY = 'workbench.banner.remote.unsupportedConnection.dismissed';
    let InitialRemoteConnectionHealthContribution = class InitialRemoteConnectionHealthContribution {
        constructor(_remoteAgentService, _environmentService, _telemetryService, bannerService, dialogService, openerService, hostService, storageService, productService) {
            this._remoteAgentService = _remoteAgentService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this.bannerService = bannerService;
            this.dialogService = dialogService;
            this.openerService = openerService;
            this.hostService = hostService;
            this.storageService = storageService;
            this.productService = productService;
            if (this._environmentService.remoteAuthority) {
                this._checkInitialRemoteConnectionHealth();
            }
        }
        async _confirmConnection() {
            let ConnectionChoice;
            (function (ConnectionChoice) {
                ConnectionChoice[ConnectionChoice["Allow"] = 1] = "Allow";
                ConnectionChoice[ConnectionChoice["LearnMore"] = 2] = "LearnMore";
                ConnectionChoice[ConnectionChoice["Cancel"] = 0] = "Cancel";
            })(ConnectionChoice || (ConnectionChoice = {}));
            const { result, checkboxChecked } = await this.dialogService.prompt({
                type: severity_1.default.Warning,
                message: (0, nls_1.localize)('unsupportedGlibcWarning', "You are about to connect to an OS version that is unsupported by {0}.", this.productService.nameLong),
                buttons: [
                    {
                        label: (0, nls_1.localize)({ key: 'allow', comment: ['&& denotes a mnemonic'] }, "&&Allow"),
                        run: () => 1 /* ConnectionChoice.Allow */
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'learnMore', comment: ['&& denotes a mnemonic'] }, "&&Learn More"),
                        run: async () => { await this.openerService.open('https://aka.ms/vscode-remote/faq/old-linux'); return 2 /* ConnectionChoice.LearnMore */; }
                    }
                ],
                cancelButton: {
                    run: () => 0 /* ConnectionChoice.Cancel */
                },
                checkbox: {
                    label: (0, nls_1.localize)('remember', "Do not show again"),
                }
            });
            if (result === 2 /* ConnectionChoice.LearnMore */) {
                return await this._confirmConnection();
            }
            const allowed = result === 1 /* ConnectionChoice.Allow */;
            if (allowed && checkboxChecked) {
                this.storageService.store(`${REMOTE_UNSUPPORTED_CONNECTION_CHOICE_KEY}.${this._environmentService.remoteAuthority}`, allowed, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            }
            return allowed;
        }
        async _checkInitialRemoteConnectionHealth() {
            try {
                const environment = await this._remoteAgentService.getRawEnvironment();
                if (environment && environment.isUnsupportedGlibc) {
                    let allowed = this.storageService.getBoolean(`${REMOTE_UNSUPPORTED_CONNECTION_CHOICE_KEY}.${this._environmentService.remoteAuthority}`, 0 /* StorageScope.PROFILE */);
                    if (allowed === undefined) {
                        allowed = await this._confirmConnection();
                    }
                    if (allowed) {
                        const bannerDismissedVersion = this.storageService.get(`${BANNER_REMOTE_UNSUPPORTED_CONNECTION_DISMISSED_KEY}`, 0 /* StorageScope.PROFILE */) ?? '';
                        // Ignore patch versions and dismiss the banner if the major and minor versions match.
                        const shouldShowBanner = bannerDismissedVersion.slice(0, bannerDismissedVersion.lastIndexOf('.')) !== this.productService.version.slice(0, this.productService.version.lastIndexOf('.'));
                        if (shouldShowBanner) {
                            const actions = [
                                {
                                    label: (0, nls_1.localize)('unsupportedGlibcBannerLearnMore', "Learn More"),
                                    href: 'https://aka.ms/vscode-remote/faq/old-linux'
                                }
                            ];
                            this.bannerService.show({
                                id: 'unsupportedGlibcWarning.banner',
                                message: (0, nls_1.localize)('unsupportedGlibcWarning.banner', "You are connected to an OS version that is unsupported by {0}.", this.productService.nameLong),
                                actions,
                                icon: codicons_1.Codicon.warning,
                                closeLabel: `Do not show again in v${this.productService.version}`,
                                onClose: () => {
                                    this.storageService.store(`${BANNER_REMOTE_UNSUPPORTED_CONNECTION_DISMISSED_KEY}`, this.productService.version, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                                }
                            });
                        }
                    }
                    else {
                        this.hostService.openWindow({ forceReuseWindow: true, remoteAuthority: null });
                        return;
                    }
                }
                this._telemetryService.publicLog2('remoteConnectionSuccess', {
                    web: platform_1.isWeb,
                    connectionTimeMs: await this._remoteAgentService.getConnection()?.getInitialConnectionTimeMs(),
                    remoteName: (0, remoteHosts_1.getRemoteName)(this._environmentService.remoteAuthority)
                });
                await this._measureExtHostLatency();
            }
            catch (err) {
                this._telemetryService.publicLog2('remoteConnectionFailure', {
                    web: platform_1.isWeb,
                    connectionTimeMs: await this._remoteAgentService.getConnection()?.getInitialConnectionTimeMs(),
                    remoteName: (0, remoteHosts_1.getRemoteName)(this._environmentService.remoteAuthority),
                    message: err ? err.message : ''
                });
            }
        }
        async _measureExtHostLatency() {
            const measurement = await remoteAgentService_1.remoteConnectionLatencyMeasurer.measure(this._remoteAgentService);
            if (measurement === undefined) {
                return;
            }
            this._telemetryService.publicLog2('remoteConnectionLatency', {
                web: platform_1.isWeb,
                remoteName: (0, remoteHosts_1.getRemoteName)(this._environmentService.remoteAuthority),
                latencyMs: measurement.current
            });
        }
    };
    exports.InitialRemoteConnectionHealthContribution = InitialRemoteConnectionHealthContribution;
    exports.InitialRemoteConnectionHealthContribution = InitialRemoteConnectionHealthContribution = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, bannerService_1.IBannerService),
        __param(4, dialogs_1.IDialogService),
        __param(5, opener_1.IOpenerService),
        __param(6, host_1.IHostService),
        __param(7, storage_1.IStorageService),
        __param(8, productService_1.IProductService)
    ], InitialRemoteConnectionHealthContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQ29ubmVjdGlvbkhlYWx0aC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3JlbW90ZS9icm93c2VyL3JlbW90ZUNvbm5lY3Rpb25IZWFsdGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRyxNQUFNLHdDQUF3QyxHQUFHLG9DQUFvQyxDQUFDO0lBQ3RGLE1BQU0sa0RBQWtELEdBQUcseURBQXlELENBQUM7SUFFOUcsSUFBTSx5Q0FBeUMsR0FBL0MsTUFBTSx5Q0FBeUM7UUFFckQsWUFDdUMsbUJBQXdDLEVBQy9CLG1CQUFpRCxFQUM1RCxpQkFBb0MsRUFDdkMsYUFBNkIsRUFDN0IsYUFBNkIsRUFDN0IsYUFBNkIsRUFDL0IsV0FBeUIsRUFDdEIsY0FBK0IsRUFDL0IsY0FBK0I7WUFSM0Isd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUMvQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQThCO1lBQzVELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDdkMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQzdCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDL0IsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDdEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQy9CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUVqRSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLENBQUM7WUFDNUMsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsa0JBQWtCO1lBQy9CLElBQVcsZ0JBSVY7WUFKRCxXQUFXLGdCQUFnQjtnQkFD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