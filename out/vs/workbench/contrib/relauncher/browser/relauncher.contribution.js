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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/services/host/browser/host", "vs/platform/configuration/common/configuration", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/common/environmentService", "vs/platform/product/common/productService"], function (require, exports, lifecycle_1, contributions_1, platform_1, host_1, configuration_1, nls_1, workspace_1, extensions_1, async_1, resources_1, platform_2, dialogs_1, environmentService_1, productService_1) {
    "use strict";
    var SettingsChangeRelauncher_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceChangeExtHostRelauncher = exports.SettingsChangeRelauncher = void 0;
    let SettingsChangeRelauncher = class SettingsChangeRelauncher extends lifecycle_1.Disposable {
        static { SettingsChangeRelauncher_1 = this; }
        static { this.SETTINGS = [
            "window.titleBarStyle" /* TitleBarSetting.TITLE_BAR_STYLE */,
            'window.nativeTabs',
            'window.nativeFullScreen',
            'window.clickThroughInactive',
            'update.mode',
            'editor.accessibilitySupport',
            'security.workspace.trust.enabled',
            'workbench.enableExperiments',
            '_extensionsGallery.enablePPE',
            'security.restrictUNCAccess'
        ]; }
        constructor(hostService, configurationService, productService, dialogService) {
            super();
            this.hostService = hostService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.dialogService = dialogService;
            this.titleBarStyle = new ChangeObserver('string');
            this.nativeTabs = new ChangeObserver('boolean');
            this.nativeFullScreen = new ChangeObserver('boolean');
            this.clickThroughInactive = new ChangeObserver('boolean');
            this.updateMode = new ChangeObserver('string');
            this.workspaceTrustEnabled = new ChangeObserver('boolean');
            this.experimentsEnabled = new ChangeObserver('boolean');
            this.enablePPEExtensionsGallery = new ChangeObserver('boolean');
            this.restrictUNCAccess = new ChangeObserver('boolean');
            this.onConfigurationChange(undefined);
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange(e)));
        }
        onConfigurationChange(e) {
            if (e && !SettingsChangeRelauncher_1.SETTINGS.some(key => e.affectsConfiguration(key))) {
                return;
            }
            let changed = false;
            function processChanged(didChange) {
                changed = changed || didChange;
            }
            const config = this.configurationService.getValue();
            if (platform_2.isNative) {
                // Titlebar style
                processChanged((config.window.titleBarStyle === "native" /* TitlebarStyle.NATIVE */ || config.window.titleBarStyle === "custom" /* TitlebarStyle.CUSTOM */) && this.titleBarStyle.handleChange(config.window?.titleBarStyle));
                // macOS: Native tabs
                processChanged(platform_2.isMacintosh && this.nativeTabs.handleChange(config.window?.nativeTabs));
                // macOS: Native fullscreen
                processChanged(platform_2.isMacintosh && this.nativeFullScreen.handleChange(config.window?.nativeFullScreen));
                // macOS: Click through (accept first mouse)
                processChanged(platform_2.isMacintosh && this.clickThroughInactive.handleChange(config.window?.clickThroughInactive));
                // Update mode
                processChanged(this.updateMode.handleChange(config.update?.mode));
                // On linux turning on accessibility support will also pass this flag to the chrome renderer, thus a restart is required
                if (platform_2.isLinux && typeof config.editor?.accessibilitySupport === 'string' && config.editor.accessibilitySupport !== this.accessibilitySupport) {
                    this.accessibilitySupport = config.editor.accessibilitySupport;
                    if (this.accessibilitySupport === 'on') {
                        changed = true;
                    }
                }
                // Workspace trust
                processChanged(this.workspaceTrustEnabled.handleChange(config?.security?.workspace?.trust?.enabled));
                // UNC host access restrictions
                processChanged(this.restrictUNCAccess.handleChange(config?.security?.restrictUNCAccess));
            }
            // Experiments
            processChanged(this.experimentsEnabled.handleChange(config.workbench?.enableExperiments));
            // Profiles
            processChanged(this.productService.quality !== 'stable' && this.enablePPEExtensionsGallery.handleChange(config._extensionsGallery?.enablePPE));
            // Notify only when changed from an event and the change
            // was not triggerd programmatically (e.g. from experiments)
            if (changed && e && e.source !== 7 /* ConfigurationTarget.DEFAULT */) {
                this.doConfirm(platform_2.isNative ?
                    (0, nls_1.localize)('relaunchSettingMessage', "A setting has changed that requires a restart to take effect.") :
                    (0, nls_1.localize)('relaunchSettingMessageWeb', "A setting has changed that requires a reload to take effect."), platform_2.isNative ?
                    (0, nls_1.localize)('relaunchSettingDetail', "Press the restart button to restart {0} and enable the setting.", this.productService.nameLong) :
                    (0, nls_1.localize)('relaunchSettingDetailWeb', "Press the reload button to reload {0} and enable the setting.", this.productService.nameLong), platform_2.isNative ?
                    (0, nls_1.localize)({ key: 'restart', comment: ['&& denotes a mnemonic'] }, "&&Restart") :
                    (0, nls_1.localize)({ key: 'restartWeb', comment: ['&& denotes a mnemonic'] }, "&&Reload"), () => this.hostService.restart());
            }
        }
        async doConfirm(message, detail, primaryButton, confirmedFn) {
            if (this.hostService.hasFocus) {
                const { confirmed } = await this.dialogService.confirm({ message, detail, primaryButton });
                if (confirmed) {
                    confirmedFn();
                }
            }
        }
    };
    exports.SettingsChangeRelauncher = SettingsChangeRelauncher;
    exports.SettingsChangeRelauncher = SettingsChangeRelauncher = SettingsChangeRelauncher_1 = __decorate([
        __param(0, host_1.IHostService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, productService_1.IProductService),
        __param(3, dialogs_1.IDialogService)
    ], SettingsChangeRelauncher);
    class ChangeObserver {
        static create(typeName) {
            return new ChangeObserver(typeName);
        }
        constructor(typeName) {
            this.typeName = typeName;
            this.lastValue = undefined;
        }
        /**
         * Returns if there was a change compared to the last value
         */
        handleChange(value) {
            if (typeof value === this.typeName && value !== this.lastValue) {
                this.lastValue = value;
                return true;
            }
            return false;
        }
    }
    let WorkspaceChangeExtHostRelauncher = class WorkspaceChangeExtHostRelauncher extends lifecycle_1.Disposable {
        constructor(contextService, extensionService, hostService, environmentService) {
            super();
            this.contextService = contextService;
            this.extensionHostRestarter = this._register(new async_1.RunOnceScheduler(async () => {
                if (!!environmentService.extensionTestsLocationURI) {
                    return; // no restart when in tests: see https://github.com/microsoft/vscode/issues/66936
                }
                if (environmentService.remoteAuthority) {
                    hostService.reload(); // TODO@aeschli, workaround
                }
                else if (platform_2.isNative) {
                    const stopped = await extensionService.stopExtensionHosts((0, nls_1.localize)('restartExtensionHost.reason', "Restarting extension host due to a workspace folder change."));
                    if (stopped) {
                        extensionService.startExtensionHosts();
                    }
                }
            }, 10));
            this.contextService.getCompleteWorkspace()
                .then(workspace => {
                this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
                this.handleWorkbenchState();
                this._register(this.contextService.onDidChangeWorkbenchState(() => setTimeout(() => this.handleWorkbenchState())));
            });
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.onDidChangeWorkspaceFoldersUnbind?.dispose();
            }));
        }
        handleWorkbenchState() {
            // React to folder changes when we are in workspace state
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                // Update our known first folder path if we entered workspace
                const workspace = this.contextService.getWorkspace();
                this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
                // Install workspace folder listener
                if (!this.onDidChangeWorkspaceFoldersUnbind) {
                    this.onDidChangeWorkspaceFoldersUnbind = this.contextService.onDidChangeWorkspaceFolders(() => this.onDidChangeWorkspaceFolders());
                }
            }
            // Ignore the workspace folder changes in EMPTY or FOLDER state
            else {
                (0, lifecycle_1.dispose)(this.onDidChangeWorkspaceFoldersUnbind);
                this.onDidChangeWorkspaceFoldersUnbind = undefined;
            }
        }
        onDidChangeWorkspaceFolders() {
            const workspace = this.contextService.getWorkspace();
            // Restart extension host if first root folder changed (impact on deprecated workspace.rootPath API)
            const newFirstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
            if (!(0, resources_1.isEqual)(this.firstFolderResource, newFirstFolderResource)) {
                this.firstFolderResource = newFirstFolderResource;
                this.extensionHostRestarter.schedule(); // buffer calls to extension host restart
            }
        }
    };
    exports.WorkspaceChangeExtHostRelauncher = WorkspaceChangeExtHostRelauncher;
    exports.WorkspaceChangeExtHostRelauncher = WorkspaceChangeExtHostRelauncher = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, extensions_1.IExtensionService),
        __param(2, host_1.IHostService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkspaceChangeExtHostRelauncher);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(SettingsChangeRelauncher, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(WorkspaceChangeExtHostRelauncher, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsYXVuY2hlci5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9yZWxhdW5jaGVyL2Jyb3dzZXIvcmVsYXVuY2hlci5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQThCekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTs7aUJBRXhDLGFBQVEsR0FBRzs7WUFFekIsbUJBQW1CO1lBQ25CLHlCQUF5QjtZQUN6Qiw2QkFBNkI7WUFDN0IsYUFBYTtZQUNiLDZCQUE2QjtZQUM3QixrQ0FBa0M7WUFDbEMsNkJBQTZCO1lBQzdCLDhCQUE4QjtZQUM5Qiw0QkFBNEI7U0FDNUIsQUFYc0IsQ0FXckI7UUFhRixZQUNlLFdBQTBDLEVBQ2pDLG9CQUE0RCxFQUNsRSxjQUFnRCxFQUNqRCxhQUE4QztZQUU5RCxLQUFLLEVBQUUsQ0FBQztZQUx1QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNoQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNoQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFmOUMsa0JBQWEsR0FBRyxJQUFJLGNBQWMsQ0FBZ0IsUUFBUSxDQUFDLENBQUM7WUFDNUQsZUFBVSxHQUFHLElBQUksY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNDLHFCQUFnQixHQUFHLElBQUksY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pELHlCQUFvQixHQUFHLElBQUksY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELGVBQVUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUUxQywwQkFBcUIsR0FBRyxJ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