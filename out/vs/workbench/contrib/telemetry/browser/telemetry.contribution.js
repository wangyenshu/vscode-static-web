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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorService", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/environment/common/environmentService", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/platform/telemetry/browser/errorTelemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/resources", "vs/base/common/event", "vs/base/common/network", "vs/editor/common/services/languagesAssociations", "vs/base/common/hash", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/browser/window", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/types", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, platform_1, contributions_1, lifecycle_1, telemetry_1, workspace_1, editorService_1, keybinding_1, workbenchThemeService_1, environmentService_1, platform_2, lifecycle_2, errorTelemetry_1, telemetryUtils_1, configuration_1, textfiles_1, resources_1, event_1, network_1, languagesAssociations_1, hash_1, panecomposite_1, userDataProfile_1, window_1, configurationRegistry_1, types_1, extensions_1, chatService_1) {
    "use strict";
    var TelemetryContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryContribution = void 0;
    let TelemetryContribution = class TelemetryContribution extends lifecycle_2.Disposable {
        static { TelemetryContribution_1 = this; }
        static { this.ALLOWLIST_JSON = ['package.json', 'package-lock.json', 'tsconfig.json', 'jsconfig.json', 'bower.json', '.eslintrc.json', 'tslint.json', 'composer.json']; }
        static { this.ALLOWLIST_WORKSPACE_JSON = ['settings.json', 'extensions.json', 'tasks.json', 'launch.json']; }
        constructor(telemetryService, contextService, lifecycleService, editorService, keybindingsService, themeService, environmentService, userDataProfileService, paneCompositeService, textFileService) {
            super();
            this.telemetryService = telemetryService;
            this.contextService = contextService;
            this.userDataProfileService = userDataProfileService;
            const { filesToOpenOrCreate, filesToDiff, filesToMerge } = environmentService;
            const activeViewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            telemetryService.publicLog2('workspaceLoad', {
                windowSize: { innerHeight: window_1.mainWindow.innerHeight, innerWidth: window_1.mainWindow.innerWidth, outerHeight: window_1.mainWindow.outerHeight, outerWidth: window_1.mainWindow.outerWidth },
                emptyWorkbench: contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */,
                'workbench.filesToOpenOrCreate': filesToOpenOrCreate && filesToOpenOrCreate.length || 0,
                'workbench.filesToDiff': filesToDiff && filesToDiff.length || 0,
                'workbench.filesToMerge': filesToMerge && filesToMerge.length || 0,
                customKeybindingsCount: keybindingsService.customKeybindingsCount(),
                theme: themeService.getColorTheme().id,
                language: platform_2.language,
                pinnedViewlets: paneCompositeService.getPinnedPaneCompositeIds(0 /* ViewContainerLocation.Sidebar */),
                restoredViewlet: activeViewlet ? activeViewlet.getId() : undefined,
                restoredEditors: editorService.visibleEditors.length,
                startupKind: lifecycleService.startupKind
            });
            // Error Telemetry
            this._register(new errorTelemetry_1.default(telemetryService));
            //  Files Telemetry
            this._register(textFileService.files.onDidResolve(e => this.onTextFileModelResolved(e)));
            this._register(textFileService.files.onDidSave(e => this.onTextFileModelSaved(e)));
            // Lifecycle
            this._register(lifecycleService.onDidShutdown(() => this.dispose()));
        }
        onTextFileModelResolved(e) {
            const settingsType = this.getTypeIfSettings(e.model.resource);
            if (settingsType) {
                this.telemetryService.publicLog2('settingsRead', { settingsType }); // Do not log read to user settings.json and .vscode folder as a fileGet event as it ruins our JSON usage data
            }
            else {
                this.telemetryService.publicLog2('fileGet', this.getTelemetryData(e.model.resource, e.reason));
            }
        }
        onTextFileModelSaved(e) {
            const settingsType = this.getTypeIfSettings(e.model.resource);
            if (settingsType) {
                this.telemetryService.publicLog2('settingsWritten', { settingsType }); // Do not log write to user settings.json and .vscode folder as a filePUT event as it ruins our JSON usage data
            }
            else {
                this.telemetryService.publicLog2('filePUT', this.getTelemetryData(e.model.resource, e.reason));
            }
        }
        getTypeIfSettings(resource) {
            if ((0, resources_1.extname)(resource) !== '.json') {
                return '';
            }
            // Check for global settings file
            if ((0, resources_1.isEqual)(resource, this.userDataProfileService.currentProfile.settingsResource)) {
                return 'global-settings';
            }
            // Check for keybindings file
            if ((0, resources_1.isEqual)(resource, this.userDataProfileService.currentProfile.keybindingsResource)) {
                return 'keybindings';
            }
            // Check for snippets
            if ((0, resources_1.isEqualOrParent)(resource, this.userDataProfileService.currentProfile.snippetsHome)) {
                return 'snippets';
            }
            // Check for workspace settings file
            const folders = this.contextService.getWorkspace().folders;
            for (const folder of folders) {
                if ((0, resources_1.isEqualOrParent)(resource, folder.toResource('.vscode'))) {
                    const filename = (0, resources_1.basename)(resource);
                    if (TelemetryContribution_1.ALLOWLIST_WORKSPACE_JSON.indexOf(filename) > -1) {
                        return `.vscode/${filename}`;
                    }
                }
            }
            return '';
        }
        getTelemetryData(resource, reason) {
            let ext = (0, resources_1.extname)(resource);
            // Remove query parameters from the resource extension
            const queryStringLocation = ext.indexOf('?');
            ext = queryStringLocation !== -1 ? ext.substr(0, queryStringLocation) : ext;
            const fileName = (0, resources_1.basename)(resource);
            const path = resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path;
            const telemetryData = {
                mimeType: new telemetryUtils_1.TelemetryTrustedValue((0, languagesAssociations_1.getMimeTypes)(resource).join(', ')),
                ext,
                path: (0, hash_1.hash)(path),
                reason,
                allowlistedjson: undefined
            };
            if (ext === '.json' && TelemetryContribution_1.ALLOWLIST_JSON.indexOf(fileName) > -1) {
                telemetryData['allowlistedjson'] = fileName;
            }
            return telemetryData;
        }
    };
    exports.TelemetryContribution = TelemetryContribution;
    exports.TelemetryContribution = TelemetryContribution = TelemetryContribution_1 = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, editorService_1.IEditorService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, workbenchThemeService_1.IWorkbenchThemeService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, userDataProfile_1.IUserDataProfileService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, textfiles_1.ITextFileService)
    ], TelemetryContribution);
    let ConfigurationTelemetryContribution = class ConfigurationTelemetryContribution extends lifecycle_2.Disposable {
        constructor(configurationService, telemetryService) {
            super();
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            // Debounce the event by 1000 ms and merge all affected keys into one event
            const debouncedConfigService = event_1.Event.debounce(configurationService.onDidChangeConfiguration, (last, cur) => {
                const newAffectedKeys = last ? new Set([...last.affectedKeys, ...cur.affectedKeys]) : cur.affectedKeys;
                return { ...cur, affectedKeys: newAffectedKeys };
            }, 1000, true);
            this._register(debouncedConfigService(event => {
                if (event.source !== 7 /* ConfigurationTarget.DEFAULT */) {
                    telemetryService.publicLog2('updateConfiguration', {
                        configurationSource: (0, configuration_1.ConfigurationTargetToString)(event.source),
                        configurationKeys: Array.from(event.affectedKeys)
                    });
                }
            }));
            const { user, workspace } = configurationService.keys();
            for (const setting of user) {
                this.reportTelemetry(setting, 3 /* ConfigurationTarget.USER_LOCAL */);
            }
            for (const setting of workspace) {
                this.reportTelemetry(setting, 5 /* ConfigurationTarget.WORKSPACE */);
            }
        }
        /**
         * Report value of a setting only if it is an enum, boolean, or number or an array of those.
         */
        getValueToReport(key, target) {
            const inpsectData = this.configurationService.inspect(key);
            const value = target === 3 /* ConfigurationTarget.USER_LOCAL */ ? inpsectData.user?.value : inpsectData.workspace?.value;
            if ((0, types_1.isNumber)(value) || (0, types_1.isBoolean)(value)) {
                return value.toString();
            }
            const schema = this.configurationRegistry.getConfigurationProperties()[key];
            if ((0, types_1.isString)(value)) {
                if (schema?.enum?.includes(value)) {
                    return value;
                }
                return undefined;
            }
            if (Array.isArray(value)) {
                if (value.every(v => (0, types_1.isNumber)(v) || (0, types_1.isBoolean)(v) || ((0, types_1.isString)(v) && schema?.enum?.includes(v)))) {
                    return JSON.stringify(value);
                }
            }
            return undefined;
        }
        reportTelemetry(key, target) {
            const source = (0, configuration_1.ConfigurationTargetToString)(target);
            switch (key) {
                case "workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */:
                    this.telemetryService.publicLog2('workbench.activityBar.location', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case extensions_1.AutoUpdateConfigurationKey:
                    this.telemetryService.publicLog2('extensions.autoUpdate', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'files.autoSave':
                    this.telemetryService.publicLog2('files.autoSave', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'editor.stickyScroll.enabled':
                    this.telemetryService.publicLog2('editor.stickyScroll.enabled', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case chatService_1.KEYWORD_ACTIVIATION_SETTING_ID:
                    this.telemetryService.publicLog2('accessibility.voice.keywordActivation', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.zoomLevel':
                    this.telemetryService.publicLog2('window.zoomLevel', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.zoomPerWindow':
                    this.telemetryService.publicLog2('window.zoomPerWindow', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.titleBarStyle':
                    this.telemetryService.publicLog2('window.titleBarStyle', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.customTitleBarVisibility':
                    this.telemetryService.publicLog2('window.customTitleBarVisibility', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.nativeTabs':
                    this.telemetryService.publicLog2('window.nativeTabs', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'extensions.verifySignature':
                    this.telemetryService.publicLog2('extensions.verifySignature', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.systemColorTheme':
                    this.telemetryService.publicLog2('window.systemColorTheme', { settingValue: this.getValueToReport(key, target), source });
                    return;
            }
        }
    };
    ConfigurationTelemetryContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, telemetry_1.ITelemetryService)
    ], ConfigurationTelemetryContribution);
    const workbenchContributionRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionRegistry.registerWorkbenchContribution(TelemetryContribution, 3 /* LifecyclePhase.Restored */);
    workbenchContributionRegistry.registerWorkbenchContribution(ConfigurationTelemetryContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5LmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3RlbGVtZXRyeS9icm93c2VyL3RlbGVtZXRyeS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlEekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxzQkFBVTs7aUJBRXJDLG1CQUFjLEdBQUcsQ0FBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLGVBQWUsQ0FBQyxBQUExSSxDQUEySTtpQkFDekosNkJBQXdCLEdBQUcsQ0FBQyxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxBQUFwRSxDQUFxRTtRQUU1RyxZQUNxQyxnQkFBbUMsRUFDNUIsY0FBd0MsRUFDaEUsZ0JBQW1DLEVBQ3RDLGFBQTZCLEVBQ3pCLGtCQUFzQyxFQUNsQyxZQUFvQyxFQUM5QixrQkFBZ0QsRUFDcEMsc0JBQStDLEVBQzlELG9CQUErQyxFQUN4RCxlQUFpQztZQUVuRCxLQUFLLEVBQUUsQ0FBQztZQVg0QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQzVCLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQU16QywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBTXpGLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLEdBQUcsa0JBQWtCLENBQUM7WUFDOUUsTUFBTSxhQUFhLEdBQUcsb0JBQW9CLENBQUMsc0JBQXNCLHVDQUErQixDQUFDO1lBMkNqRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQWtELGVBQWUsRUFB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