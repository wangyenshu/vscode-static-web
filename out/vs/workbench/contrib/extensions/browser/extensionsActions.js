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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/async", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/json", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/common/extensionsFileTemplate", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/workbench/services/host/browser/host", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/configuration/common/jsonEditing", "vs/editor/common/services/resolverService", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/workbench/services/editor/common/editorService", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/base/browser/ui/aria/aria", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/label/common/label", "vs/workbench/services/textfile/common/textfiles", "vs/platform/product/common/productService", "vs/platform/dialogs/common/dialogs", "vs/platform/progress/common/progress", "vs/base/browser/ui/actionbar/actionViewItems", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig", "vs/base/common/errors", "vs/platform/userDataSync/common/userDataSync", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/platform/log/common/log", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/base/common/platform", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/workspace/common/workspaceTrust", "vs/platform/workspace/common/virtualWorkspace", "vs/base/common/htmlContent", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/arrays", "vs/base/common/date", "vs/workbench/services/preferences/common/preferences", "vs/platform/languagePacks/common/languagePacks", "vs/workbench/services/localization/common/locale", "vs/base/common/types", "vs/workbench/services/log/common/logConstants", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform", "vs/platform/update/common/update", "vs/css!./media/extensionActions"], function (require, exports, nls_1, actions_1, async_1, DOM, event_1, json, contextView_1, lifecycle_1, extensions_1, extensionsFileTemplate_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, extensionManagementUtil_1, extensions_2, instantiation_1, files_1, workspace_1, host_1, extensions_3, uri_1, commands_1, configuration_1, themeService_1, themables_1, colorRegistry_1, jsonEditing_1, resolverService_1, contextkey_1, actions_2, workspaceCommands_1, notification_1, opener_1, editorService_1, quickInput_1, cancellation_1, aria_1, workbenchThemeService_1, label_1, textfiles_1, productService_1, dialogs_1, progress_1, actionViewItems_1, workspaceExtensionsConfig_1, errors_1, userDataSync_1, dropdownActionViewItem_1, log_1, extensionsIcons_1, platform_1, extensionManifestPropertiesService_1, workspaceTrust_1, virtualWorkspace_1, htmlContent_1, panecomposite_1, arrays_1, date_1, preferences_1, languagePacks_1, locale_1, types_1, logConstants_1, telemetry_1, extensionFeatures_1, platform_2, update_1) {
    "use strict";
    var InstallAction_1, InstallInOtherServerAction_1, UninstallAction_1, ToggleAutoUpdateForExtensionAction_1, ToggleAutoUpdatesForPublisherAction_1, MigrateDeprecatedExtensionAction_1, ManageExtensionAction_1, TogglePreReleaseExtensionAction_1, InstallAnotherVersionAction_1, EnableForWorkspaceAction_1, EnableGloballyAction_1, DisableForWorkspaceAction_1, DisableGloballyAction_1, ExtensionRuntimeStateAction_1, SetColorThemeAction_1, SetFileIconThemeAction_1, SetProductIconThemeAction_1, SetLanguageAction_1, ClearLanguageAction_1, ShowRecommendedExtensionAction_1, InstallRecommendedExtensionAction_1, IgnoreExtensionRecommendationAction_1, UndoIgnoreExtensionRecommendationAction_1, ExtensionStatusLabelAction_1, ToggleSyncExtensionAction_1, ExtensionStatusAction_1, ReinstallAction_1, InstallSpecificVersionOfExtensionAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extensionButtonProminentBackground = exports.showExtensionsWithIdsCommandId = exports.InstallRemoteExtensionsInLocalAction = exports.InstallLocalExtensionsInRemoteAction = exports.AbstractInstallExtensionsInServerAction = exports.InstallSpecificVersionOfExtensionAction = exports.ReinstallAction = exports.ExtensionStatusAction = exports.ToggleSyncExtensionAction = exports.ExtensionStatusLabelAction = exports.ConfigureWorkspaceFolderRecommendedExtensionsAction = exports.ConfigureWorkspaceRecommendedExtensionsAction = exports.AbstractConfigureRecommendedExtensionsAction = exports.SearchExtensionsAction = exports.UndoIgnoreExtensionRecommendationAction = exports.IgnoreExtensionRecommendationAction = exports.InstallRecommendedExtensionAction = exports.ShowRecommendedExtensionAction = exports.ClearLanguageAction = exports.SetLanguageAction = exports.SetProductIconThemeAction = exports.SetFileIconThemeAction = exports.SetColorThemeAction = exports.ExtensionRuntimeStateAction = exports.DisableDropDownAction = exports.EnableDropDownAction = exports.DisableGloballyAction = exports.DisableForWorkspaceAction = exports.EnableGloballyAction = exports.EnableForWorkspaceAction = exports.InstallAnotherVersionAction = exports.TogglePreReleaseExtensionAction = exports.MenuItemExtensionAction = exports.ExtensionEditorManageExtensionAction = exports.ManageExtensionAction = exports.DropDownMenuActionViewItem = exports.ExtensionDropDownAction = exports.ExtensionActionWithDropdownActionViewItem = exports.MigrateDeprecatedExtensionAction = exports.ToggleAutoUpdatesForPublisherAction = exports.ToggleAutoUpdateForExtensionAction = exports.UpdateAction = exports.UninstallAction = exports.WebInstallAction = exports.LocalInstallAction = exports.RemoteInstallAction = exports.InstallInOtherServerAction = exports.InstallingLabelAction = exports.InstallDropdownAction = exports.InstallAction = exports.ActionWithDropDownAction = exports.ExtensionAction = exports.PromptExtensionInstallFailureAction = void 0;
    exports.getContextMenuActions = getContextMenuActions;
    let PromptExtensionInstallFailureAction = class PromptExtensionInstallFailureAction extends actions_1.Action {
        constructor(extension, version, installOperation, error, productService, openerService, notificationService, dialogService, commandService, logService, extensionManagementServerService, instantiationService, galleryService, extensionManifestPropertiesService) {
            super('extension.promptExtensionInstallFailure');
            this.extension = extension;
            this.version = version;
            this.installOperation = installOperation;
            this.error = error;
            this.productService = productService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.commandService = commandService;
            this.logService = logService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.instantiationService = instantiationService;
            this.galleryService = galleryService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
        }
        async run() {
            if ((0, errors_1.isCancellationError)(this.error)) {
                return;
            }
            this.logService.error(this.error);
            if (this.error.name === extensionManagement_1.ExtensionManagementErrorCode.Unsupported) {
                const productName = platform_1.isWeb ? (0, nls_1.localize)('VS Code for Web', "{0} for the Web", this.productService.nameLong) : this.productService.nameLong;
                const message = (0, nls_1.localize)('cannot be installed', "The '{0}' extension is not available in {1}. Click 'More Information' to learn more.", this.extension.displayName || this.extension.identifier.id, productName);
                const { confirmed } = await this.dialogService.confirm({
                    type: notification_1.Severity.Info,
                    message,
                    primaryButton: (0, nls_1.localize)({ key: 'more information', comment: ['&& denotes a mnemonic'] }, "&&More Information"),
                    cancelButton: (0, nls_1.localize)('close', "Close")
                });
                if (confirmed) {
                    this.openerService.open(platform_1.isWeb ? uri_1.URI.parse('https://aka.ms/vscode-web-extensions-guide') : uri_1.URI.parse('https://aka.ms/vscode-remote'));
                }
                return;
            }
            if (extensionManagement_1.ExtensionManagementErrorCode.ReleaseVersionNotFound === this.error.name) {
                await this.dialogService.prompt({
                    type: 'error',
                    message: (0, errors_1.getErrorMessage)(this.error),
                    buttons: [{
                            label: (0, nls_1.localize)('install prerelease', "Install Pre-Release"),
                            run: () => {
                                const installAction = this.instantiationService.createInstance(InstallAction, { installPreReleaseVersion: true });
                                installAction.extension = this.extension;
                                return installAction.run();
                            }
                        }],
                    cancelButton: (0, nls_1.localize)('cancel', "Cancel")
                });
                return;
            }
            if ([extensionManagement_1.ExtensionManagementErrorCode.Incompatible, extensionManagement_1.ExtensionManagementErrorCode.IncompatibleTargetPlatform, extensionManagement_1.ExtensionManagementErrorCode.Malicious, extensionManagement_1.ExtensionManagementErrorCode.Deprecated].includes(this.error.name)) {
                await this.dialogService.info((0, errors_1.getErrorMessage)(this.error));
                return;
            }
            if (extensionManagement_1.ExtensionManagementErrorCode.Signature === this.error.name) {
                await this.dialogService.prompt({
                    type: 'error',
                    message: (0, nls_1.localize)('signature verification failed', "{0} cannot verify the '{1}' extension. Are you sure you want to install it?", this.productService.nameLong, this.extension.displayName || this.extension.identifier.id),
                    buttons: [{
                            label: (0, nls_1.localize)('install anyway', "Install Anyway"),
                            run: () => {
                                const installAction = this.instantiationService.createInstance(InstallAction, { donotVerifySignature: true });
                                installAction.extension = this.extension;
                                return installAction.run();
                            }
                        }],
                    cancelButton: (0, nls_1.localize)('cancel', "Cancel")
                });
                return;
            }
            const operationMessage = this.installOperation === 3 /* InstallOperation.Update */ ? (0, nls_1.localize)('update operation', "Error while updating '{0}' extension.", this.extension.displayName || this.extension.identifier.id)
                : (0, nls_1.localize)('install operation', "Error while installing '{0}' extension.", this.extension.displayName || this.extension.identifier.id);
            let additionalMessage;
            const promptChoices = [];
            const downloadUrl = await this.getDownloadUrl();
            if (downloadUrl) {
                additionalMessage = (0, nls_1.localize)('check logs', "Please check the [log]({0}) for more details.", `command:${logConstants_1.showWindowLogActionId}`);
                promptChoices.push({
                    label: (0, nls_1.localize)('download', "Try Downloading Manually..."),
                    run: () => this.openerService.open(downloadUrl).then(() => {
                        this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('install vsix', 'Once downloaded, please manually install the downloaded VSIX of \'{0}\'.', this.extension.identifier.id), [{
                                label: (0, nls_1.localize)('installVSIX', "Install from VSIX..."),
                                run: () => this.commandService.executeCommand(extensions_1.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID)
                            }]);
                    })
                });
            }
            const message = `${operationMessage}${additionalMessage ? ` ${additionalMessage}` : ''}`;
            this.notificationService.prompt(notification_1.Severity.Error, message, promptChoices);
        }
        async getDownloadUrl() {
            if (platform_1.isIOS) {
                return undefined;
            }
            if (!this.extension.gallery) {
                return undefined;
            }
            if (!this.productService.extensionsGallery) {
                return undefined;
            }
            if (!this.extensionManagementServerService.localExtensionManagementServer && !this.extensionManagementServerService.remoteExtensionManagementServer) {
                return undefined;
            }
            let targetPlatform = this.extension.gallery.properties.targetPlatform;
            if (targetPlatform !== "universal" /* TargetPlatform.UNIVERSAL */ && targetPlatform !== "undefined" /* TargetPlatform.UNDEFINED */ && this.extensionManagementServerService.remoteExtensionManagementServer) {
                try {
                    const manifest = await this.galleryService.getManifest(this.extension.gallery, cancellation_1.CancellationToken.None);
                    if (manifest && this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(manifest)) {
                        targetPlatform = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getTargetPlatform();
                    }
                }
                catch (error) {
                    this.logService.error(error);
                    return undefined;
                }
            }
            if (targetPlatform === "unknown" /* TargetPlatform.UNKNOWN */) {
                return undefined;
            }
            return uri_1.URI.parse(`${this.productService.extensionsGallery.serviceUrl}/publishers/${this.extension.publisher}/vsextensions/${this.extension.name}/${this.version}/vspackage${targetPlatform !== "undefined" /* TargetPlatform.UNDEFINED */ ? `?targetPlatform=${targetPlatform}` : ''}`);
        }
    };
    exports.PromptExtensionInstallFailureAction = PromptExtensionInstallFailureAction;
    exports.PromptExtensionInstallFailureAction = PromptExtensionInstallFailureAction = __decorate([
        __param(4, productService_1.IProductService),
        __param(5, opener_1.IOpenerService),
        __param(6, notification_1.INotificationService),
        __param(7, dialogs_1.IDialogService),
        __param(8, commands_1.ICommandService),
        __param(9, log_1.ILogService),
        __param(10, extensionManagement_2.IExtensionManagementServerService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, extensionManagement_1.IExtensionGalleryService),
        __param(13, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], PromptExtensionInstallFailureAction);
    class ExtensionAction extends actions_1.Action {
        constructor() {
            super(...arguments);
            this._extension = null;
        }
        static { this.EXTENSION_ACTION_CLASS = 'extension-action'; }
        static { this.TEXT_ACTION_CLASS = `${ExtensionAction.EXTENSION_ACTION_CLASS} text`; }
        static { this.LABEL_ACTION_CLASS = `${ExtensionAction.EXTENSION_ACTION_CLASS} label`; }
        static { this.ICON_ACTION_CLASS = `${ExtensionAction.EXTENSION_ACTION_CLASS} icon`; }
        get extension() { return this._extension; }
        set extension(extension) { this._extension = extension; this.update(); }
    }
    exports.ExtensionAction = ExtensionAction;
    class ActionWithDropDownAction extends ExtensionAction {
        get menuActions() { return [...this._menuActions]; }
        get extension() {
            return super.extension;
        }
        set extension(extension) {
            this.extensionActions.forEach(a => a.extension = extension);
            super.extension = extension;
        }
        constructor(id, label, actionsGroups) {
            super(id, label);
            this.actionsGroups = actionsGroups;
            this._menuActions = [];
            this.extensionActions = (0, arrays_1.flatten)(actionsGroups);
            this.update();
            this._register(event_1.Event.any(...this.extensionActions.map(a => a.onDidChange))(() => this.update(true)));
            this.extensionActions.forEach(a => this._register(a));
        }
        update(donotUpdateActions) {
            if (!donotUpdateActions) {
                this.extensionActions.forEach(a => a.update());
            }
            const enabledActionsGroups = this.actionsGroups.map(actionsGroup => actionsGroup.filter(a => a.enabled));
            let actions = [];
            for (const enabledActions of enabledActionsGroups) {
                if (enabledActions.length) {
                    actions = [...actions, ...enabledActions, new actions_1.Separator()];
                }
            }
            actions = actions.length ? actions.slice(0, actions.length - 1) : actions;
            this.action = actions[0];
            this._menuActions = actions.length > 1 ? actions : [];
            this.enabled = !!this.action;
            if (this.action) {
                this.label = this.getLabel(this.action);
                this.tooltip = this.action.tooltip;
            }
            let clazz = (this.action || this.extensionActions[0])?.class || '';
            clazz = clazz ? `${clazz} action-dropdown` : 'action-dropdown';
            if (this._menuActions.length === 0) {
                clazz += ' action-dropdown';
            }
            this.class = clazz;
        }
        run() {
            const enabledActions = this.extensionActions.filter(a => a.enabled);
            return enabledActions[0].run();
        }
        getLabel(action) {
            return action.label;
        }
    }
    exports.ActionWithDropDownAction = ActionWithDropDownAction;
    let InstallAction = class InstallAction extends ExtensionAction {
        static { InstallAction_1 = this; }
        static { this.Class = `${ExtensionAction.LABEL_ACTION_CLASS} prominent install`; }
        set manifest(manifest) {
            this._manifest = manifest;
            this.updateLabel();
        }
        constructor(options, extensionsWorkbenchService, instantiationService, runtimeExtensionService, workbenchThemeService, labelService, dialogService, preferencesService, telemetryService, contextService) {
            super('extensions.install', (0, nls_1.localize)('install', "Install"), InstallAction_1.Class, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.instantiationService = instantiationService;
            this.runtimeExtensionService = runtimeExtensionService;
            this.workbenchThemeService = workbenchThemeService;
            this.labelService = labelService;
            this.dialogService = dialogService;
            this.preferencesService = preferencesService;
            this.telemetryService = telemetryService;
            this.contextService = contextService;
            this._manifest = null;
            this.updateThrottler = new async_1.Throttler();
            this.options = { ...options, isMachineScoped: false };
            this.update();
            this._register(this.labelService.onDidChangeFormatters(() => this.updateLabel(), this));
        }
        update() {
            this.updateThrottler.queue(() => this.computeAndUpdateEnablement());
        }
        async computeAndUpdateEnablement() {
            this.enabled = false;
            if (!this.extension) {
                return;
            }
            if (this.extension.isBuiltin) {
                return;
            }
            if (this.extensionsWorkbenchService.canSetLanguage(this.extension)) {
                return;
            }
            if (this.extension.state === 3 /* ExtensionState.Uninstalled */ && await this.extensionsWorkbenchService.canInstall(this.extension)) {
                this.enabled = this.options.installPreReleaseVersion ? this.extension.hasPreReleaseVersion : this.extension.hasReleaseVersion;
                this.updateLabel();
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            if (this.extension.deprecationInfo) {
                let detail = (0, nls_1.localize)('deprecated message', "This extension is deprecated as it is no longer being maintained.");
                let DeprecationChoice;
                (function (DeprecationChoice) {
                    DeprecationChoice[DeprecationChoice["InstallAnyway"] = 0] = "InstallAnyway";
                    DeprecationChoice[DeprecationChoice["ShowAlternateExtension"] = 1] = "ShowAlternateExtension";
                    DeprecationChoice[DeprecationChoice["ConfigureSettings"] = 2] = "ConfigureSettings";
                    DeprecationChoice[DeprecationChoice["Cancel"] = 3] = "Cancel";
                })(DeprecationChoice || (DeprecationChoice = {}));
                const buttons = [
                    {
                        label: (0, nls_1.localize)('install anyway', "Install Anyway"),
                        run: () => DeprecationChoice.InstallAnyway
                    }
                ];
                if (this.extension.deprecationInfo.extension) {
                    detail = (0, nls_1.localize)('deprecated with alternate extension message', "This extension is deprecated. Use the {0} extension instead.", this.extension.deprecationInfo.extension.displayName);
                    const alternateExtension = this.extension.deprecationInfo.extension;
                    buttons.push({
                        label: (0, nls_1.localize)({ key: 'Show alternate extension', comment: ['&& denotes a mnemonic'] }, "&&Open {0}", this.extension.deprecationInfo.extension.displayName),
                        run: async () => {
                            const [extension] = await this.extensionsWorkbenchService.getExtensions([{ id: alternateExtension.id, preRelease: alternateExtension.preRelease }], cancellation_1.CancellationToken.None);
                            await this.extensionsWorkbenchService.open(extension);
                            return DeprecationChoice.ShowAlternateExtension;
                        }
                    });
                }
                else if (this.extension.deprecationInfo.settings) {
                    detail = (0, nls_1.localize)('deprecated with alternate settings message', "This extension is deprecated as this functionality is now built-in to VS Code.");
                    const settings = this.extension.deprecationInfo.settings;
                    buttons.push({
                        label: (0, nls_1.localize)({ key: 'configure in settings', comment: ['&& denotes a mnemonic'] }, "&&Configure Settings"),
                        run: async () => {
                            await this.preferencesService.openSettings({ query: settings.map(setting => `@id:${setting}`).join(' ') });
                            return DeprecationChoice.ConfigureSettings;
                        }
                    });
                }
                else if (this.extension.deprecationInfo.additionalInfo) {
                    detail = new htmlContent_1.MarkdownString(`${detail} ${this.extension.deprecationInfo.additionalInfo}`);
                }
                const { result } = await this.dialogService.prompt({
                    type: notification_1.Severity.Warning,
                    message: (0, nls_1.localize)('install confirmation', "Are you sure you want to install '{0}'?", this.extension.displayName),
                    detail: (0, types_1.isString)(detail) ? detail : undefined,
                    custom: (0, types_1.isString)(detail) ? undefined : {
                        markdownDetails: [{
                                markdown: detail
                            }]
                    },
                    buttons,
                    cancelButton: {
                        run: () => DeprecationChoice.Cancel
                    }
                });
                if (result !== DeprecationChoice.InstallAnyway) {
                    return;
                }
            }
            this.extensionsWorkbenchService.open(this.extension, { showPreReleaseVersion: this.options.installPreReleaseVersion });
            (0, aria_1.alert)((0, nls_1.localize)('installExtensionStart', "Installing extension {0} started. An editor is now open with more details on this extension", this.extension.displayName));
            /* __GDPR__
                "extensions:action:install" : {
                    "owner": "sandy081",
                    "actionId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "${include}": [
                        "${GalleryExtensionTelemetryData}"
                    ]
                }
            */
            this.telemetryService.publicLog('extensions:action:install', { ...this.extension.telemetryData, actionId: this.id });
            const extension = await this.install(this.extension);
            if (extension?.local) {
                (0, aria_1.alert)((0, nls_1.localize)('installExtensionComplete', "Installing extension {0} is completed.", this.extension.displayName));
                const runningExtension = await this.getRunningExtension(extension.local);
                if (runningExtension && !(runningExtension.activationEvents && runningExtension.activationEvents.some(activationEent => activationEent.startsWith('onLanguage')))) {
                    const action = await this.getThemeAction(extension);
                    if (action) {
                        action.extension = extension;
                        try {
                            return action.run({ showCurrentTheme: true, ignoreFocusLost: true });
                        }
                        finally {
                            action.dispose();
                        }
                    }
                }
            }
        }
        async getThemeAction(extension) {
            const colorThemes = await this.workbenchThemeService.getColorThemes();
            if (colorThemes.some(theme => isThemeFromExtension(theme, extension))) {
                return this.instantiationService.createInstance(SetColorThemeAction);
            }
            const fileIconThemes = await this.workbenchThemeService.getFileIconThemes();
            if (fileIconThemes.some(theme => isThemeFromExtension(theme, extension))) {
                return this.instantiationService.createInstance(SetFileIconThemeAction);
            }
            const productIconThemes = await this.workbenchThemeService.getProductIconThemes();
            if (productIconThemes.some(theme => isThemeFromExtension(theme, extension))) {
                return this.instantiationService.createInstance(SetProductIconThemeAction);
            }
            return undefined;
        }
        async install(extension) {
            try {
                return await this.extensionsWorkbenchService.install(extension, this.options);
            }
            catch (error) {
                await this.instantiationService.createInstance(PromptExtensionInstallFailureAction, extension, extension.latestVersion, 2 /* InstallOperation.Install */, error).run();
                return undefined;
            }
        }
        async getRunningExtension(extension) {
            const runningExtension = await this.runtimeExtensionService.getExtension(extension.identifier.id);
            if (runningExtension) {
                return runningExtension;
            }
            if (this.runtimeExtensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension))) {
                return new Promise((c, e) => {
                    const disposable = this.runtimeExtensionService.onDidChangeExtensions(async () => {
                        const runningExtension = await this.runtimeExtensionService.getExtension(extension.identifier.id);
                        if (runningExtension) {
                            disposable.dispose();
                            c(runningExtension);
                        }
                    });
                });
            }
            return null;
        }
        updateLabel() {
            this.label = this.getLabel();
        }
        getLabel(primary) {
            if (this.extension?.isWorkspaceScoped && this.extension.resourceExtension && this.contextService.isInsideWorkspace(this.extension.resourceExtension.location)) {
                return (0, nls_1.localize)('install workspace version', "Install Workspace Extension");
            }
            /* install pre-release version */
            if (this.options.installPreReleaseVersion && this.extension?.hasPreReleaseVersion) {
                return primary ? (0, nls_1.localize)('install pre-release', "Install Pre-Release") : (0, nls_1.localize)('install pre-release version', "Install Pre-Release Version");
            }
            /* install released version that has a pre release version */
            if (this.extension?.hasPreReleaseVersion) {
                return primary ? (0, nls_1.localize)('install', "Install") : (0, nls_1.localize)('install release version', "Install Release Version");
            }
            return (0, nls_1.localize)('install', "Install");
        }
    };
    exports.InstallAction = InstallAction;
    exports.InstallAction = InstallAction = InstallAction_1 = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extensions_3.IExtensionService),
        __param(4, workbenchThemeService_1.IWorkbenchThemeService),
        __param(5, label_1.ILabelService),
        __param(6, dialogs_1.IDialogService),
        __param(7, preferences_1.IPreferencesService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, workspace_1.IWorkspaceContextService)
    ], InstallAction);
    let InstallDropdownAction = class InstallDropdownAction extends ActionWithDropDownAction {
        set manifest(manifest) {
            this.extensionActions.forEach(a => a.manifest = manifest);
            this.update();
        }
        constructor(instantiationService, extensionsWorkbenchService) {
            super(`extensions.installActions`, '', [
                [
                    instantiationService.createInstance(InstallAction, { installPreReleaseVersion: extensionsWorkbenchService.preferPreReleases }),
                    instantiationService.createInstance(InstallAction, { installPreReleaseVersion: !extensionsWorkbenchService.preferPreReleases }),
                ]
            ]);
        }
        getLabel(action) {
            return action.getLabel(true);
        }
    };
    exports.InstallDropdownAction = InstallDropdownAction;
    exports.InstallDropdownAction = InstallDropdownAction = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensions_1.IExtensionsWorkbenchService)
    ], InstallDropdownAction);
    class InstallingLabelAction extends ExtensionAction {
        static { this.LABEL = (0, nls_1.localize)('installing', "Installing"); }
        static { this.CLASS = `${ExtensionAction.LABEL_ACTION_CLASS} install installing`; }
        constructor() {
            super('extension.installing', InstallingLabelAction.LABEL, InstallingLabelAction.CLASS, false);
        }
        update() {
            this.class = `${InstallingLabelAction.CLASS}${this.extension && this.extension.state === 0 /* ExtensionState.Installing */ ? '' : ' hide'}`;
        }
    }
    exports.InstallingLabelAction = InstallingLabelAction;
    let InstallInOtherServerAction = class InstallInOtherServerAction extends ExtensionAction {
        static { InstallInOtherServerAction_1 = this; }
        static { this.INSTALL_LABEL = (0, nls_1.localize)('install', "Install"); }
        static { this.INSTALLING_LABEL = (0, nls_1.localize)('installing', "Installing"); }
        static { this.Class = `${ExtensionAction.LABEL_ACTION_CLASS} prominent install`; }
        static { this.InstallingClass = `${ExtensionAction.LABEL_ACTION_CLASS} install installing`; }
        constructor(id, server, canInstallAnyWhere, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(id, InstallInOtherServerAction_1.INSTALL_LABEL, InstallInOtherServerAction_1.Class, false);
            this.server = server;
            this.canInstallAnyWhere = canInstallAnyWhere;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.updateWhenCounterExtensionChanges = true;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = InstallInOtherServerAction_1.Class;
            if (this.canInstall()) {
                const extensionInOtherServer = this.extensionsWorkbenchService.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server === this.server)[0];
                if (extensionInOtherServer) {
                    // Getting installed in other server
                    if (extensionInOtherServer.state === 0 /* ExtensionState.Installing */ && !extensionInOtherServer.local) {
                        this.enabled = true;
                        this.label = InstallInOtherServerAction_1.INSTALLING_LABEL;
                        this.class = InstallInOtherServerAction_1.InstallingClass;
                    }
                }
                else {
                    // Not installed in other server
                    this.enabled = true;
                    this.label = this.getInstallLabel();
                }
            }
        }
        canInstall() {
            // Disable if extension is not installed or not an user extension
            if (!this.extension
                || !this.server
                || !this.extension.local
                || this.extension.state !== 1 /* ExtensionState.Installed */
                || this.extension.type !== 1 /* ExtensionType.User */
                || this.extension.enablementState === 2 /* EnablementState.DisabledByEnvironment */ || this.extension.enablementState === 0 /* EnablementState.DisabledByTrustRequirement */ || this.extension.enablementState === 4 /* EnablementState.DisabledByVirtualWorkspace */) {
                return false;
            }
            if ((0, extensions_2.isLanguagePackExtension)(this.extension.local.manifest)) {
                return true;
            }
            // Prefers to run on UI
            if (this.server === this.extensionManagementServerService.localExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                return true;
            }
            // Prefers to run on Workspace
            if (this.server === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                return true;
            }
            // Prefers to run on Web
            if (this.server === this.extensionManagementServerService.webExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnWeb(this.extension.local.manifest)) {
                return true;
            }
            if (this.canInstallAnyWhere) {
                // Can run on UI
                if (this.server === this.extensionManagementServerService.localExtensionManagementServer && this.extensionManifestPropertiesService.canExecuteOnUI(this.extension.local.manifest)) {
                    return true;
                }
                // Can run on Workspace
                if (this.server === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManifestPropertiesService.canExecuteOnWorkspace(this.extension.local.manifest)) {
                    return true;
                }
            }
            return false;
        }
        async run() {
            if (!this.extension?.local) {
                return;
            }
            if (!this.extension?.server) {
                return;
            }
            if (!this.server) {
                return;
            }
            this.extensionsWorkbenchService.open(this.extension);
            (0, aria_1.alert)((0, nls_1.localize)('installExtensionStart', "Installing extension {0} started. An editor is now open with more details on this extension", this.extension.displayName));
            return this.extensionsWorkbenchService.installInServer(this.extension, this.server);
        }
    };
    exports.InstallInOtherServerAction = InstallInOtherServerAction;
    exports.InstallInOtherServerAction = InstallInOtherServerAction = InstallInOtherServerAction_1 = __decorate([
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensionManagement_2.IExtensionManagementServerService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], InstallInOtherServerAction);
    let RemoteInstallAction = class RemoteInstallAction extends InstallInOtherServerAction {
        constructor(canInstallAnyWhere, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(`extensions.remoteinstall`, extensionManagementServerService.remoteExtensionManagementServer, canInstallAnyWhere, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService);
        }
        getInstallLabel() {
            return this.extensionManagementServerService.remoteExtensionManagementServer
                ? (0, nls_1.localize)({ key: 'install in remote', comment: ['This is the name of the action to install an extension in remote server. Placeholder is for the name of remote server.'] }, "Install in {0}", this.extensionManagementServerService.remoteExtensionManagementServer.label)
                : InstallInOtherServerAction.INSTALL_LABEL;
        }
    };
    exports.RemoteInstallAction = RemoteInstallAction;
    exports.RemoteInstallAction = RemoteInstallAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IExtensionManagementServerService),
        __param(3, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], RemoteInstallAction);
    let LocalInstallAction = class LocalInstallAction extends InstallInOtherServerAction {
        constructor(extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(`extensions.localinstall`, extensionManagementServerService.localExtensionManagementServer, false, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService);
        }
        getInstallLabel() {
            return (0, nls_1.localize)('install locally', "Install Locally");
        }
    };
    exports.LocalInstallAction = LocalInstallAction;
    exports.LocalInstallAction = LocalInstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], LocalInstallAction);
    let WebInstallAction = class WebInstallAction extends InstallInOtherServerAction {
        constructor(extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(`extensions.webInstall`, extensionManagementServerService.webExtensionManagementServer, false, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService);
        }
        getInstallLabel() {
            return (0, nls_1.localize)('install browser', "Install in Browser");
        }
    };
    exports.WebInstallAction = WebInstallAction;
    exports.WebInstallAction = WebInstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], WebInstallAction);
    let UninstallAction = class UninstallAction extends ExtensionAction {
        static { UninstallAction_1 = this; }
        static { this.UninstallLabel = (0, nls_1.localize)('uninstallAction', "Uninstall"); }
        static { this.UninstallingLabel = (0, nls_1.localize)('Uninstalling', "Uninstalling"); }
        static { this.UninstallClass = `${ExtensionAction.LABEL_ACTION_CLASS} uninstall`; }
        static { this.UnInstallingClass = `${ExtensionAction.LABEL_ACTION_CLASS} uninstall uninstalling`; }
        constructor(extensionsWorkbenchService, dialogService) {
            super('extensions.uninstall', UninstallAction_1.UninstallLabel, UninstallAction_1.UninstallClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.dialogService = dialogService;
            this.update();
        }
        update() {
            if (!this.extension) {
                this.enabled = false;
                return;
            }
            const state = this.extension.state;
            if (state === 2 /* ExtensionState.Uninstalling */) {
                this.label = UninstallAction_1.UninstallingLabel;
                this.class = UninstallAction_1.UnInstallingClass;
                this.enabled = false;
                return;
            }
            this.label = UninstallAction_1.UninstallLabel;
            this.class = UninstallAction_1.UninstallClass;
            this.tooltip = UninstallAction_1.UninstallLabel;
            if (state !== 1 /* ExtensionState.Installed */) {
                this.enabled = false;
                return;
            }
            if (this.extension.isBuiltin) {
                this.enabled = false;
                return;
            }
            this.enabled = true;
        }
        async run() {
            if (!this.extension) {
                return;
            }
            (0, aria_1.alert)((0, nls_1.localize)('uninstallExtensionStart', "Uninstalling extension {0} started.", this.extension.displayName));
            try {
                await this.extensionsWorkbenchService.uninstall(this.extension);
                (0, aria_1.alert)((0, nls_1.localize)('uninstallExtensionComplete', "Please reload Visual Studio Code to complete the uninstallation of the extension {0}.", this.extension.displayName));
            }
            catch (error) {
                this.dialogService.error((0, errors_1.getErrorMessage)(error));
            }
        }
    };
    exports.UninstallAction = UninstallAction;
    exports.UninstallAction = UninstallAction = UninstallAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, dialogs_1.IDialogService)
    ], UninstallAction);
    class AbstractUpdateAction extends ExtensionAction {
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} prominent update`; }
        static { this.DisabledClass = `${AbstractUpdateAction.EnabledClass} disabled`; }
        constructor(id, label, extensionsWorkbenchService) {
            super(id, label, AbstractUpdateAction.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.updateThrottler = new async_1.Throttler();
            this.update();
        }
        update() {
            this.updateThrottler.queue(() => this.computeAndUpdateEnablement());
        }
        async computeAndUpdateEnablement() {
            this.enabled = false;
            this.class = UpdateAction.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (this.extension.deprecationInfo) {
                return;
            }
            const canInstall = await this.extensionsWorkbenchService.canInstall(this.extension);
            const isInstalled = this.extension.state === 1 /* ExtensionState.Installed */;
            this.enabled = canInstall && isInstalled && this.extension.outdated;
            this.class = this.enabled ? AbstractUpdateAction.EnabledClass : AbstractUpdateAction.DisabledClass;
        }
    }
    let UpdateAction = class UpdateAction extends AbstractUpdateAction {
        constructor(verbose, extensionsWorkbenchService, instantiationService) {
            super(`extensions.update`, (0, nls_1.localize)('update', "Update"), extensionsWorkbenchService);
            this.verbose = verbose;
            this.instantiationService = instantiationService;
        }
        update() {
            super.update();
            if (this.extension) {
                this.label = this.verbose ? (0, nls_1.localize)('update to', "Update to v{0}", this.extension.latestVersion) : (0, nls_1.localize)('update', "Update");
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            (0, aria_1.alert)((0, nls_1.localize)('updateExtensionStart', "Updating extension {0} to version {1} started.", this.extension.displayName, this.extension.latestVersion));
            return this.install(this.extension);
        }
        async install(extension) {
            try {
                await this.extensionsWorkbenchService.install(extension, extension.local?.preRelease ? { installPreReleaseVersion: true } : undefined);
                (0, aria_1.alert)((0, nls_1.localize)('updateExtensionComplete', "Updating extension {0} to version {1} completed.", extension.displayName, extension.latestVersion));
            }
            catch (err) {
                this.instantiationService.createInstance(PromptExtensionInstallFailureAction, extension, extension.latestVersion, 3 /* InstallOperation.Update */, err).run();
            }
        }
    };
    exports.UpdateAction = UpdateAction;
    exports.UpdateAction = UpdateAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, instantiation_1.IInstantiationService)
    ], UpdateAction);
    let ToggleAutoUpdateForExtensionAction = class ToggleAutoUpdateForExtensionAction extends ExtensionAction {
        static { ToggleAutoUpdateForExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.toggleAutoUpdateForExtension'; }
        static { this.LABEL = (0, nls_1.localize2)('enableAutoUpdateLabel', "Auto Update"); }
        static { this.EnabledClass = `${ExtensionAction.EXTENSION_ACTION_CLASS} auto-update`; }
        static { this.DisabledClass = `${ToggleAutoUpdateForExtensionAction_1.EnabledClass} hide`; }
        constructor(enableWhenOutdated, enableWhenAutoUpdateValue, extensionsWorkbenchService, configurationService) {
            super(ToggleAutoUpdateForExtensionAction_1.ID, ToggleAutoUpdateForExtensionAction_1.LABEL.value, ToggleAutoUpdateForExtensionAction_1.DisabledClass);
            this.enableWhenOutdated = enableWhenOutdated;
            this.enableWhenAutoUpdateValue = enableWhenAutoUpdateValue;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(extensions_1.AutoUpdateConfigurationKey)) {
                    this.update();
                }
            }));
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = ToggleAutoUpdateForExtensionAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (this.extension.isBuiltin) {
                return;
            }
            if (this.enableWhenOutdated && (this.extension.state !== 1 /* ExtensionState.Installed */ || !this.extension.outdated)) {
                return;
            }
            if (!this.enableWhenAutoUpdateValue.includes(this.extensionsWorkbenchService.getAutoUpdateValue())) {
                return;
            }
            this.enabled = true;
            this.class = ToggleAutoUpdateForExtensionAction_1.EnabledClass;
            this.checked = this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension);
        }
        async run() {
            if (!this.extension) {
                return;
            }
            const enableAutoUpdate = !this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension);
            await this.extensionsWorkbenchService.updateAutoUpdateEnablementFor(this.extension, enableAutoUpdate);
            if (enableAutoUpdate) {
                (0, aria_1.alert)((0, nls_1.localize)('enableAutoUpdate', "Enabled auto updates for", this.extension.displayName));
            }
            else {
                (0, aria_1.alert)((0, nls_1.localize)('disableAutoUpdate', "Disabled auto updates for", this.extension.displayName));
            }
        }
    };
    exports.ToggleAutoUpdateForExtensionAction = ToggleAutoUpdateForExtensionAction;
    exports.ToggleAutoUpdateForExtensionAction = ToggleAutoUpdateForExtensionAction = ToggleAutoUpdateForExtensionAction_1 = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, configuration_1.IConfigurationService)
    ], ToggleAutoUpdateForExtensionAction);
    let ToggleAutoUpdatesForPublisherAction = class ToggleAutoUpdatesForPublisherAction extends ExtensionAction {
        static { ToggleAutoUpdatesForPublisherAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.toggleAutoUpdatesForPublisher'; }
        static { this.LABEL = (0, nls_1.localize)('toggleAutoUpdatesForPublisherLabel', "Auto Update All (From Publisher)"); }
        constructor(extensionsWorkbenchService) {
            super(ToggleAutoUpdatesForPublisherAction_1.ID, ToggleAutoUpdatesForPublisherAction_1.LABEL);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
        }
        update() { }
        async run() {
            if (!this.extension) {
                return;
            }
            (0, aria_1.alert)((0, nls_1.localize)('ignoreExtensionUpdatePublisher', "Ignoring updates published by {0}.", this.extension.publisherDisplayName));
            const enableAutoUpdate = !this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension.publisher);
            await this.extensionsWorkbenchService.updateAutoUpdateEnablementFor(this.extension.publisher, enableAutoUpdate);
            if (enableAutoUpdate) {
                (0, aria_1.alert)((0, nls_1.localize)('enableAutoUpdate', "Enabled auto updates for", this.extension.displayName));
            }
            else {
                (0, aria_1.alert)((0, nls_1.localize)('disableAutoUpdate', "Disabled auto updates for", this.extension.displayName));
            }
        }
    };
    exports.ToggleAutoUpdatesForPublisherAction = ToggleAutoUpdatesForPublisherAction;
    exports.ToggleAutoUpdatesForPublisherAction = ToggleAutoUpdatesForPublisherAction = ToggleAutoUpdatesForPublisherAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], ToggleAutoUpdatesForPublisherAction);
    let MigrateDeprecatedExtensionAction = class MigrateDeprecatedExtensionAction extends ExtensionAction {
        static { MigrateDeprecatedExtensionAction_1 = this; }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} migrate`; }
        static { this.DisabledClass = `${MigrateDeprecatedExtensionAction_1.EnabledClass} disabled`; }
        constructor(small, extensionsWorkbenchService) {
            super('extensionsAction.migrateDeprecatedExtension', (0, nls_1.localize)('migrateExtension', "Migrate"), MigrateDeprecatedExtensionAction_1.DisabledClass, false);
            this.small = small;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = MigrateDeprecatedExtensionAction_1.DisabledClass;
            if (!this.extension?.local) {
                return;
            }
            if (this.extension.state !== 1 /* ExtensionState.Installed */) {
                return;
            }
            if (!this.extension.deprecationInfo?.extension) {
                return;
            }
            const id = this.extension.deprecationInfo.extension.id;
            if (this.extensionsWorkbenchService.local.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }))) {
                return;
            }
            this.enabled = true;
            this.class = MigrateDeprecatedExtensionAction_1.EnabledClass;
            this.tooltip = (0, nls_1.localize)('migrate to', "Migrate to {0}", this.extension.deprecationInfo.extension.displayName);
            this.label = this.small ? (0, nls_1.localize)('migrate', "Migrate") : this.tooltip;
        }
        async run() {
            if (!this.extension?.deprecationInfo?.extension) {
                return;
            }
            const local = this.extension.local;
            await this.extensionsWorkbenchService.uninstall(this.extension);
            const [extension] = await this.extensionsWorkbenchService.getExtensions([{ id: this.extension.deprecationInfo.extension.id, preRelease: this.extension.deprecationInfo?.extension?.preRelease }], cancellation_1.CancellationToken.None);
            await this.extensionsWorkbenchService.install(extension, { isMachineScoped: local?.isMachineScoped });
        }
    };
    exports.MigrateDeprecatedExtensionAction = MigrateDeprecatedExtensionAction;
    exports.MigrateDeprecatedExtensionAction = MigrateDeprecatedExtensionAction = MigrateDeprecatedExtensionAction_1 = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService)
    ], MigrateDeprecatedExtensionAction);
    class ExtensionActionWithDropdownActionViewItem extends dropdownActionViewItem_1.ActionWithDropdownActionViewItem {
        constructor(action, options, contextMenuProvider) {
            super(null, action, options, contextMenuProvider);
        }
        render(container) {
            super.render(container);
            this.updateClass();
        }
        updateClass() {
            super.updateClass();
            if (this.element && this.dropdownMenuActionViewItem && this.dropdownMenuActionViewItem.element) {
                this.element.classList.toggle('empty', this._action.menuActions.length === 0);
                this.dropdownMenuActionViewItem.element.classList.toggle('hide', this._action.menuActions.length === 0);
            }
        }
    }
    exports.ExtensionActionWithDropdownActionViewItem = ExtensionActionWithDropdownActionViewItem;
    let ExtensionDropDownAction = class ExtensionDropDownAction extends ExtensionAction {
        constructor(id, label, cssClass, enabled, instantiationService) {
            super(id, label, cssClass, enabled);
            this.instantiationService = instantiationService;
            this._actionViewItem = null;
        }
        createActionViewItem(options) {
            this._actionViewItem = this.instantiationService.createInstance(DropDownMenuActionViewItem, this, options);
            return this._actionViewItem;
        }
        run({ actionGroups, disposeActionsOnHide }) {
            this._actionViewItem?.showMenu(actionGroups, disposeActionsOnHide);
            return Promise.resolve();
        }
    };
    exports.ExtensionDropDownAction = ExtensionDropDownAction;
    exports.ExtensionDropDownAction = ExtensionDropDownAction = __decorate([
        __param(4, instantiation_1.IInstantiationService)
    ], ExtensionDropDownAction);
    let DropDownMenuActionViewItem = class DropDownMenuActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action, options, contextMenuService) {
            super(null, action, { ...options, icon: true, label: true });
            this.contextMenuService = contextMenuService;
        }
        showMenu(menuActionGroups, disposeActionsOnHide) {
            if (this.element) {
                const actions = this.getActions(menuActionGroups);
                const elementPosition = DOM.getDomNodePagePosition(this.element);
                const anchor = { x: elementPosition.left, y: elementPosition.top + elementPosition.height + 10 };
                this.contextMenuService.showContextMenu({
                    getAnchor: () => anchor,
                    getActions: () => actions,
                    actionRunner: this.actionRunner,
                    onHide: () => { if (disposeActionsOnHide) {
                        (0, lifecycle_1.disposeIfDisposable)(actions);
                    } }
                });
            }
        }
        getActions(menuActionGroups) {
            let actions = [];
            for (const menuActions of menuActionGroups) {
                actions = [...actions, ...menuActions, new actions_1.Separator()];
            }
            return actions.length ? actions.slice(0, actions.length - 1) : actions;
        }
    };
    exports.DropDownMenuActionViewItem = DropDownMenuActionViewItem;
    exports.DropDownMenuActionViewItem = DropDownMenuActionViewItem = __decorate([
        __param(2, contextView_1.IContextMenuService)
    ], DropDownMenuActionViewItem);
    async function getContextMenuActionsGroups(extension, contextKeyService, instantiationService) {
        return instantiationService.invokeFunction(async (accessor) => {
            const extensionsWorkbenchService = accessor.get(extensions_1.IExtensionsWorkbenchService);
            const menuService = accessor.get(actions_2.IMenuService);
            const extensionRecommendationsService = accessor.get(extensionRecommendations_1.IExtensionRecommendationsService);
            const extensionIgnoredRecommendationsService = accessor.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService);
            const workbenchThemeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const cksOverlay = [];
            if (extension) {
                cksOverlay.push(['extension', extension.identifier.id]);
                cksOverlay.push(['isBuiltinExtension', extension.isBuiltin]);
                cksOverlay.push(['isDefaultApplicationScopedExtension', extension.local && (0, extensions_2.isApplicationScopedExtension)(extension.local.manifest)]);
                cksOverlay.push(['isApplicationScopedExtension', extension.local && extension.local.isApplicationScoped]);
                cksOverlay.push(['isWorkspaceScopedExtension', extension.isWorkspaceScoped]);
                if (extension.local) {
                    cksOverlay.push(['extensionSource', extension.local.source]);
                }
                cksOverlay.push(['extensionHasConfiguration', extension.local && !!extension.local.manifest.contributes && !!extension.local.manifest.contributes.configuration]);
                cksOverlay.push(['extensionHasKeybindings', extension.local && !!extension.local.manifest.contributes && !!extension.local.manifest.contributes.keybindings]);
                cksOverlay.push(['extensionHasCommands', extension.local && !!extension.local.manifest.contributes && !!extension.local.manifest.contributes?.commands]);
                cksOverlay.push(['isExtensionRecommended', !!extensionRecommendationsService.getAllRecommendationsWithReason()[extension.identifier.id.toLowerCase()]]);
                cksOverlay.push(['isExtensionWorkspaceRecommended', extensionRecommendationsService.getAllRecommendationsWithReason()[extension.identifier.id.toLowerCase()]?.reasonId === 0 /* ExtensionRecommendationReason.Workspace */]);
                cksOverlay.push(['isUserIgnoredRecommendation', extensionIgnoredRecommendationsService.globalIgnoredRecommendations.some(e => e === extension.identifier.id.toLowerCase())]);
                if (extension.state === 1 /* ExtensionState.Installed */) {
                    cksOverlay.push(['extensionStatus', 'installed']);
                }
                cksOverlay.push(['installedExtensionIsPreReleaseVersion', !!extension.local?.isPreReleaseVersion]);
                cksOverlay.push(['installedExtensionIsOptedToPreRelease', !!extension.local?.preRelease]);
                cksOverlay.push(['galleryExtensionIsPreReleaseVersion', !!extension.gallery?.properties.isPreReleaseVersion]);
                cksOverlay.push(['galleryExtensionHasPreReleaseVersion', extension.gallery?.hasPreReleaseVersion]);
                cksOverlay.push(['extensionHasReleaseVersion', extension.hasReleaseVersion]);
                const [colorThemes, fileIconThemes, productIconThemes] = await Promise.all([workbenchThemeService.getColorThemes(), workbenchThemeService.getFileIconThemes(), workbenchThemeService.getProductIconThemes()]);
                cksOverlay.push(['extensionHasColorThemes', colorThemes.some(theme => isThemeFromExtension(theme, extension))]);
                cksOverlay.push(['extensionHasFileIconThemes', fileIconThemes.some(theme => isThemeFromExtension(theme, extension))]);
                cksOverlay.push(['extensionHasProductIconThemes', productIconThemes.some(theme => isThemeFromExtension(theme, extension))]);
                cksOverlay.push(['canSetLanguage', extensionsWorkbenchService.canSetLanguage(extension)]);
                cksOverlay.push(['isActiveLanguagePackExtension', extension.gallery && platform_1.language === (0, languagePacks_1.getLocale)(extension.gallery)]);
            }
            const menu = menuService.createMenu(actions_2.MenuId.ExtensionContext, contextKeyService.createOverlay(cksOverlay));
            const actionsGroups = menu.getActions({ shouldForwardArgs: true });
            menu.dispose();
            return actionsGroups;
        });
    }
    function toActions(actionsGroups, instantiationService) {
        const result = [];
        for (const [, actions] of actionsGroups) {
            result.push(actions.map(action => {
                if (action instanceof actions_1.SubmenuAction) {
                    return action;
                }
                return instantiationService.createInstance(MenuItemExtensionAction, action);
            }));
        }
        return result;
    }
    async function getContextMenuActions(extension, contextKeyService, instantiationService) {
        const actionsGroups = await getContextMenuActionsGroups(extension, contextKeyService, instantiationService);
        return toActions(actionsGroups, instantiationService);
    }
    let ManageExtensionAction = class ManageExtensionAction extends ExtensionDropDownAction {
        static { ManageExtensionAction_1 = this; }
        static { this.ID = 'extensions.manage'; }
        static { this.Class = `${ExtensionAction.ICON_ACTION_CLASS} manage ` + themables_1.ThemeIcon.asClassName(extensionsIcons_1.manageExtensionIcon); }
        static { this.HideManageExtensionClass = `${ManageExtensionAction_1.Class} hide`; }
        constructor(instantiationService, extensionService, contextKeyService) {
            super(ManageExtensionAction_1.ID, '', '', true, instantiationService);
            this.extensionService = extensionService;
            this.contextKeyService = contextKeyService;
            this.tooltip = (0, nls_1.localize)('manage', "Manage");
            this.update();
        }
        async getActionGroups() {
            const groups = [];
            const contextMenuActionsGroups = await getContextMenuActionsGroups(this.extension, this.contextKeyService, this.instantiationService);
            const themeActions = [], installActions = [], updateActions = [], otherActionGroups = [];
            for (const [group, actions] of contextMenuActionsGroups) {
                if (group === extensions_1.INSTALL_ACTIONS_GROUP) {
                    installActions.push(...toActions([[group, actions]], this.instantiationService)[0]);
                }
                else if (group === extensions_1.UPDATE_ACTIONS_GROUP) {
                    updateActions.push(...toActions([[group, actions]], this.instantiationService)[0]);
                }
                else if (group === extensions_1.THEME_ACTIONS_GROUP) {
                    themeActions.push(...toActions([[group, actions]], this.instantiationService)[0]);
                }
                else {
                    otherActionGroups.push(...toActions([[group, actions]], this.instantiationService));
                }
            }
            if (themeActions.length) {
                groups.push(themeActions);
            }
            groups.push([
                this.instantiationService.createInstance(EnableGloballyAction),
                this.instantiationService.createInstance(EnableForWorkspaceAction)
            ]);
            groups.push([
                this.instantiationService.createInstance(DisableGloballyAction),
                this.instantiationService.createInstance(DisableForWorkspaceAction)
            ]);
            if (updateActions.length) {
                groups.push(updateActions);
            }
            groups.push([
                ...(installActions.length ? installActions : []),
                this.instantiationService.createInstance(InstallAnotherVersionAction),
                this.instantiationService.createInstance(UninstallAction),
            ]);
            otherActionGroups.forEach(actions => groups.push(actions));
            groups.forEach(group => group.forEach(extensionAction => {
                if (extensionAction instanceof ExtensionAction) {
                    extensionAction.extension = this.extension;
                }
            }));
            return groups;
        }
        async run() {
            await this.extensionService.whenInstalledExtensionsRegistered();
            return super.run({ actionGroups: await this.getActionGroups(), disposeActionsOnHide: true });
        }
        update() {
            this.class = ManageExtensionAction_1.HideManageExtensionClass;
            this.enabled = false;
            if (this.extension) {
                const state = this.extension.state;
                this.enabled = state === 1 /* ExtensionState.Installed */;
                this.class = this.enabled || state === 2 /* ExtensionState.Uninstalling */ ? ManageExtensionAction_1.Class : ManageExtensionAction_1.HideManageExtensionClass;
            }
        }
    };
    exports.ManageExtensionAction = ManageExtensionAction;
    exports.ManageExtensionAction = ManageExtensionAction = ManageExtensionAction_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensions_3.IExtensionService),
        __param(2, contextkey_1.IContextKeyService)
    ], ManageExtensionAction);
    class ExtensionEditorManageExtensionAction extends ExtensionDropDownAction {
        constructor(contextKeyService, instantiationService) {
            super('extensionEditor.manageExtension', '', `${ExtensionAction.ICON_ACTION_CLASS} manage ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.manageExtensionIcon)}`, true, instantiationService);
            this.contextKeyService = contextKeyService;
            this.tooltip = (0, nls_1.localize)('manage', "Manage");
        }
        update() { }
        async run() {
            const actionGroups = [];
            (await getContextMenuActions(this.extension, this.contextKeyService, this.instantiationService)).forEach(actions => actionGroups.push(actions));
            actionGroups.forEach(group => group.forEach(extensionAction => {
                if (extensionAction instanceof ExtensionAction) {
                    extensionAction.extension = this.extension;
                }
            }));
            return super.run({ actionGroups, disposeActionsOnHide: true });
        }
    }
    exports.ExtensionEditorManageExtensionAction = ExtensionEditorManageExtensionAction;
    let MenuItemExtensionAction = class MenuItemExtensionAction extends ExtensionAction {
        constructor(action, extensionsWorkbenchService) {
            super(action.id, action.label);
            this.action = action;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
        }
        update() {
            if (!this.extension) {
                return;
            }
            if (this.action.id === extensions_1.TOGGLE_IGNORE_EXTENSION_ACTION_ID) {
                this.checked = !this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension);
            }
            else if (this.action.id === ToggleAutoUpdateForExtensionAction.ID) {
                this.checked = this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension);
            }
            else if (this.action.id === ToggleAutoUpdatesForPublisherAction.ID) {
                this.checked = this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension.publisher);
            }
            else {
                this.checked = this.action.checked;
            }
        }
        async run() {
            if (this.extension) {
                await this.action.run(this.extension.local ? (0, extensionManagementUtil_1.getExtensionId)(this.extension.local.manifest.publisher, this.extension.local.manifest.name)
                    : this.extension.gallery ? (0, extensionManagementUtil_1.getExtensionId)(this.extension.gallery.publisher, this.extension.gallery.name)
                        : this.extension.identifier.id);
            }
        }
    };
    exports.MenuItemExtensionAction = MenuItemExtensionAction;
    exports.MenuItemExtensionAction = MenuItemExtensionAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService)
    ], MenuItemExtensionAction);
    let TogglePreReleaseExtensionAction = class TogglePreReleaseExtensionAction extends ExtensionAction {
        static { TogglePreReleaseExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.togglePreRlease'; }
        static { this.LABEL = (0, nls_1.localize)('togglePreRleaseLabel', "Pre-Release"); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} pre-release`; }
        static { this.DisabledClass = `${TogglePreReleaseExtensionAction_1.EnabledClass} hide`; }
        constructor(extensionsWorkbenchService) {
            super(TogglePreReleaseExtensionAction_1.ID, TogglePreReleaseExtensionAction_1.LABEL, TogglePreReleaseExtensionAction_1.DisabledClass);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = TogglePreReleaseExtensionAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (this.extension.isBuiltin) {
                return;
            }
            if (this.extension.state !== 1 /* ExtensionState.Installed */) {
                return;
            }
            if (!this.extension.hasPreReleaseVersion) {
                return;
            }
            if (!this.extension.gallery) {
                return;
            }
            if (this.extension.preRelease && !this.extension.isPreReleaseVersion) {
                return;
            }
            if (!this.extension.preRelease && !this.extension.gallery.hasPreReleaseVersion) {
                return;
            }
            this.enabled = true;
            this.class = TogglePreReleaseExtensionAction_1.EnabledClass;
            if (this.extension.preRelease) {
                this.label = (0, nls_1.localize)('togglePreRleaseDisableLabel', "Switch to Release Version");
                this.tooltip = (0, nls_1.localize)('togglePreRleaseDisableTooltip', "This will switch and enable updates to release versions");
            }
            else {
                this.label = (0, nls_1.localize)('switchToPreReleaseLabel', "Switch to Pre-Release Version");
                this.tooltip = (0, nls_1.localize)('switchToPreReleaseTooltip', "This will switch to pre-release version and enable updates to latest version always");
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            this.extensionsWorkbenchService.open(this.extension, { showPreReleaseVersion: !this.extension.preRelease });
            await this.extensionsWorkbenchService.togglePreRelease(this.extension);
        }
    };
    exports.TogglePreReleaseExtensionAction = TogglePreReleaseExtensionAction;
    exports.TogglePreReleaseExtensionAction = TogglePreReleaseExtensionAction = TogglePreReleaseExtensionAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], TogglePreReleaseExtensionAction);
    let InstallAnotherVersionAction = class InstallAnotherVersionAction extends ExtensionAction {
        static { InstallAnotherVersionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.install.anotherVersion'; }
        static { this.LABEL = (0, nls_1.localize)('install another version', "Install Another Version..."); }
        constructor(extensionsWorkbenchService, extensionGalleryService, quickInputService, instantiationService, dialogService) {
            super(InstallAnotherVersionAction_1.ID, InstallAnotherVersionAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionGalleryService = extensionGalleryService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.dialogService = dialogService;
            this.update();
        }
        update() {
            this.enabled = !!this.extension && !this.extension.isBuiltin && !!this.extension.gallery && !!this.extension.local && !!this.extension.server && this.extension.state === 1 /* ExtensionState.Installed */ && !this.extension.deprecationInfo;
        }
        async run() {
            if (!this.enabled) {
                return;
            }
            const targetPlatform = await this.extension.server.extensionManagementService.getTargetPlatform();
            const allVersions = await this.extensionGalleryService.getAllCompatibleVersions(this.extension.gallery, this.extension.local.preRelease, targetPlatform);
            if (!allVersions.length) {
                await this.dialogService.info((0, nls_1.localize)('no versions', "This extension has no other versions."));
                return;
            }
            const picks = allVersions.map((v, i) => {
                return {
                    id: v.version,
                    label: v.version,
                    description: `${(0, date_1.fromNow)(new Date(Date.parse(v.date)), true)}${v.isPreReleaseVersion ? ` (${(0, nls_1.localize)('pre-release', "pre-release")})` : ''}${v.version === this.extension.version ? ` (${(0, nls_1.localize)('current', "current")})` : ''}`,
                    latest: i === 0,
                    ariaLabel: `${v.isPreReleaseVersion ? 'Pre-Release version' : 'Release version'} ${v.version}`,
                    isPreReleaseVersion: v.isPreReleaseVersion
                };
            });
            const pick = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('selectVersion', "Select Version to Install"),
                matchOnDetail: true
            });
            if (pick) {
                if (this.extension.version === pick.id) {
                    return;
                }
                try {
                    if (pick.latest) {
                        const [extension] = pick.id !== this.extension?.version ? await this.extensionsWorkbenchService.getExtensions([{ id: this.extension.identifier.id, preRelease: pick.isPreReleaseVersion }], cancellation_1.CancellationToken.None) : [this.extension];
                        await this.extensionsWorkbenchService.install(extension ?? this.extension, { installPreReleaseVersion: pick.isPreReleaseVersion });
                    }
                    else {
                        await this.extensionsWorkbenchService.install(this.extension, { installPreReleaseVersion: pick.isPreReleaseVersion, version: pick.id });
                    }
                }
                catch (error) {
                    this.instantiationService.createInstance(PromptExtensionInstallFailureAction, this.extension, pick.latest ? this.extension.latestVersion : pick.id, 2 /* InstallOperation.Install */, error).run();
                }
            }
            return null;
        }
    };
    exports.InstallAnotherVersionAction = InstallAnotherVersionAction;
    exports.InstallAnotherVersionAction = InstallAnotherVersionAction = InstallAnotherVersionAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, dialogs_1.IDialogService)
    ], InstallAnotherVersionAction);
    let EnableForWorkspaceAction = class EnableForWorkspaceAction extends ExtensionAction {
        static { EnableForWorkspaceAction_1 = this; }
        static { this.ID = 'extensions.enableForWorkspace'; }
        static { this.LABEL = (0, nls_1.localize)('enableForWorkspaceAction', "Enable (Workspace)"); }
        constructor(extensionsWorkbenchService, extensionEnablementService) {
            super(EnableForWorkspaceAction_1.ID, EnableForWorkspaceAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.tooltip = (0, nls_1.localize)('enableForWorkspaceActionToolTip', "Enable this extension only in this workspace");
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && !this.extension.isWorkspaceScoped) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && !this.extensionEnablementService.isEnabled(this.extension.local)
                    && this.extensionEnablementService.canChangeWorkspaceEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 9 /* EnablementState.EnabledWorkspace */);
        }
    };
    exports.EnableForWorkspaceAction = EnableForWorkspaceAction;
    exports.EnableForWorkspaceAction = EnableForWorkspaceAction = EnableForWorkspaceAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], EnableForWorkspaceAction);
    let EnableGloballyAction = class EnableGloballyAction extends ExtensionAction {
        static { EnableGloballyAction_1 = this; }
        static { this.ID = 'extensions.enableGlobally'; }
        static { this.LABEL = (0, nls_1.localize)('enableGloballyAction', "Enable"); }
        constructor(extensionsWorkbenchService, extensionEnablementService) {
            super(EnableGloballyAction_1.ID, EnableGloballyAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.tooltip = (0, nls_1.localize)('enableGloballyActionToolTip', "Enable this extension");
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && !this.extension.isWorkspaceScoped) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && this.extensionEnablementService.isDisabledGlobally(this.extension.local)
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 8 /* EnablementState.EnabledGlobally */);
        }
    };
    exports.EnableGloballyAction = EnableGloballyAction;
    exports.EnableGloballyAction = EnableGloballyAction = EnableGloballyAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], EnableGloballyAction);
    let DisableForWorkspaceAction = class DisableForWorkspaceAction extends ExtensionAction {
        static { DisableForWorkspaceAction_1 = this; }
        static { this.ID = 'extensions.disableForWorkspace'; }
        static { this.LABEL = (0, nls_1.localize)('disableForWorkspaceAction', "Disable (Workspace)"); }
        constructor(workspaceContextService, extensionsWorkbenchService, extensionEnablementService, extensionService) {
            super(DisableForWorkspaceAction_1.ID, DisableForWorkspaceAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.workspaceContextService = workspaceContextService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionService = extensionService;
            this.tooltip = (0, nls_1.localize)('disableForWorkspaceActionToolTip', "Disable this extension only in this workspace");
            this.update();
            this._register(this.extensionService.onDidChangeExtensions(() => this.update()));
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && !this.extension.isWorkspaceScoped && this.extensionService.extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier) && this.workspaceContextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */)) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && (this.extension.enablementState === 8 /* EnablementState.EnabledGlobally */ || this.extension.enablementState === 9 /* EnablementState.EnabledWorkspace */)
                    && this.extensionEnablementService.canChangeWorkspaceEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 7 /* EnablementState.DisabledWorkspace */);
        }
    };
    exports.DisableForWorkspaceAction = DisableForWorkspaceAction;
    exports.DisableForWorkspaceAction = DisableForWorkspaceAction = DisableForWorkspaceAction_1 = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(3, extensions_3.IExtensionService)
    ], DisableForWorkspaceAction);
    let DisableGloballyAction = class DisableGloballyAction extends ExtensionAction {
        static { DisableGloballyAction_1 = this; }
        static { this.ID = 'extensions.disableGlobally'; }
        static { this.LABEL = (0, nls_1.localize)('disableGloballyAction', "Disable"); }
        constructor(extensionsWorkbenchService, extensionEnablementService, extensionService) {
            super(DisableGloballyAction_1.ID, DisableGloballyAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionService = extensionService;
            this.tooltip = (0, nls_1.localize)('disableGloballyActionToolTip', "Disable this extension");
            this.update();
            this._register(this.extensionService.onDidChangeExtensions(() => this.update()));
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && !this.extension.isWorkspaceScoped && this.extensionService.extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && (this.extension.enablementState === 8 /* EnablementState.EnabledGlobally */ || this.extension.enablementState === 9 /* EnablementState.EnabledWorkspace */)
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 6 /* EnablementState.DisabledGlobally */);
        }
    };
    exports.DisableGloballyAction = DisableGloballyAction;
    exports.DisableGloballyAction = DisableGloballyAction = DisableGloballyAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(2, extensions_3.IExtensionService)
    ], DisableGloballyAction);
    let EnableDropDownAction = class EnableDropDownAction extends ActionWithDropDownAction {
        constructor(instantiationService) {
            super('extensions.enable', (0, nls_1.localize)('enableAction', "Enable"), [
                [
                    instantiationService.createInstance(EnableGloballyAction),
                    instantiationService.createInstance(EnableForWorkspaceAction)
                ]
            ]);
        }
    };
    exports.EnableDropDownAction = EnableDropDownAction;
    exports.EnableDropDownAction = EnableDropDownAction = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], EnableDropDownAction);
    let DisableDropDownAction = class DisableDropDownAction extends ActionWithDropDownAction {
        constructor(instantiationService) {
            super('extensions.disable', (0, nls_1.localize)('disableAction', "Disable"), [[
                    instantiationService.createInstance(DisableGloballyAction),
                    instantiationService.createInstance(DisableForWorkspaceAction)
                ]]);
        }
    };
    exports.DisableDropDownAction = DisableDropDownAction;
    exports.DisableDropDownAction = DisableDropDownAction = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], DisableDropDownAction);
    let ExtensionRuntimeStateAction = class ExtensionRuntimeStateAction extends ExtensionAction {
        static { ExtensionRuntimeStateAction_1 = this; }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} reload`; }
        static { this.DisabledClass = `${ExtensionRuntimeStateAction_1.EnabledClass} disabled`; }
        constructor(hostService, extensionsWorkbenchService, updateService, extensionService, productService, telemetryService) {
            super('extensions.runtimeState', '', ExtensionRuntimeStateAction_1.DisabledClass, false);
            this.hostService = hostService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.updateService = updateService;
            this.extensionService = extensionService;
            this.productService = productService;
            this.telemetryService = telemetryService;
            this.updateWhenCounterExtensionChanges = true;
            this._register(this.extensionService.onDidChangeExtensions(() => this.update()));
            this.update();
        }
        update() {
            this.enabled = false;
            this.tooltip = '';
            this.class = ExtensionRuntimeStateAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            const state = this.extension.state;
            if (state === 0 /* ExtensionState.Installing */ || state === 2 /* ExtensionState.Uninstalling */) {
                return;
            }
            if (this.extension.local && this.extension.local.manifest && this.extension.local.manifest.contributes && this.extension.local.manifest.contributes.localizations && this.extension.local.manifest.contributes.localizations.length > 0) {
                return;
            }
            const runtimeState = this.extension.runtimeState;
            if (!runtimeState) {
                return;
            }
            this.enabled = true;
            this.class = ExtensionRuntimeStateAction_1.EnabledClass;
            this.tooltip = runtimeState.reason;
            this.label = runtimeState.action === "reloadWindow" /* ExtensionRuntimeActionType.ReloadWindow */ ? (0, nls_1.localize)('reload window', 'Reload Window')
                : runtimeState.action === "restartExtensions" /* ExtensionRuntimeActionType.RestartExtensions */ ? (0, nls_1.localize)('restart extensions', 'Restart Extensions')
                    : runtimeState.action === "quitAndInstall" /* ExtensionRuntimeActionType.QuitAndInstall */ ? (0, nls_1.localize)('restart product', 'Restart to Update')
                        : runtimeState.action === "applyUpdate" /* ExtensionRuntimeActionType.ApplyUpdate */ || runtimeState.action === "downloadUpdate" /* ExtensionRuntimeActionType.DownloadUpdate */ ? (0, nls_1.localize)('update product', 'Update {0}', this.productService.nameShort) : '';
        }
        async run() {
            const runtimeState = this.extension?.runtimeState;
            if (!runtimeState?.action) {
                return;
            }
            this.telemetryService.publicLog2('extensions:runtimestate:action', {
                action: runtimeState.action
            });
            if (runtimeState?.action === "reloadWindow" /* ExtensionRuntimeActionType.ReloadWindow */) {
                return this.hostService.reload();
            }
            else if (runtimeState?.action === "restartExtensions" /* ExtensionRuntimeActionType.RestartExtensions */) {
                return this.extensionsWorkbenchService.updateRunningExtensions();
            }
            else if (runtimeState?.action === "downloadUpdate" /* ExtensionRuntimeActionType.DownloadUpdate */) {
                return this.updateService.downloadUpdate();
            }
            else if (runtimeState?.action === "applyUpdate" /* ExtensionRuntimeActionType.ApplyUpdate */) {
                return this.updateService.applyUpdate();
            }
            else if (runtimeState?.action === "quitAndInstall" /* ExtensionRuntimeActionType.QuitAndInstall */) {
                return this.updateService.quitAndInstall();
            }
        }
    };
    exports.ExtensionRuntimeStateAction = ExtensionRuntimeStateAction;
    exports.ExtensionRuntimeStateAction = ExtensionRuntimeStateAction = ExtensionRuntimeStateAction_1 = __decorate([
        __param(0, host_1.IHostService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, update_1.IUpdateService),
        __param(3, extensions_3.IExtensionService),
        __param(4, productService_1.IProductService),
        __param(5, telemetry_1.ITelemetryService)
    ], ExtensionRuntimeStateAction);
    function isThemeFromExtension(theme, extension) {
        return !!(extension && theme.extensionData && extensions_2.ExtensionIdentifier.equals(theme.extensionData.extensionId, extension.identifier.id));
    }
    function getQuickPickEntries(themes, currentTheme, extension, showCurrentTheme) {
        const picks = [];
        for (const theme of themes) {
            if (isThemeFromExtension(theme, extension) && !(showCurrentTheme && theme === currentTheme)) {
                picks.push({ label: theme.label, id: theme.id });
            }
        }
        if (showCurrentTheme) {
            picks.push({ type: 'separator', label: (0, nls_1.localize)('current', "current") });
            picks.push({ label: currentTheme.label, id: currentTheme.id });
        }
        return picks;
    }
    let SetColorThemeAction = class SetColorThemeAction extends ExtensionAction {
        static { SetColorThemeAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.setColorTheme'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.setColorTheme', 'Set Color Theme'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} theme`; }
        static { this.DisabledClass = `${SetColorThemeAction_1.EnabledClass} disabled`; }
        constructor(extensionService, workbenchThemeService, quickInputService, extensionEnablementService) {
            super(SetColorThemeAction_1.ID, SetColorThemeAction_1.TITLE.value, SetColorThemeAction_1.DisabledClass, false);
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.extensionEnablementService = extensionEnablementService;
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidColorThemeChange)(() => this.update(), this));
            this.update();
        }
        update() {
            this.workbenchThemeService.getColorThemes().then(colorThemes => {
                this.enabled = this.computeEnablement(colorThemes);
                this.class = this.enabled ? SetColorThemeAction_1.EnabledClass : SetColorThemeAction_1.DisabledClass;
            });
        }
        computeEnablement(colorThemes) {
            return !!this.extension && this.extension.state === 1 /* ExtensionState.Installed */ && this.extensionEnablementService.isEnabledEnablementState(this.extension.enablementState) && colorThemes.some(th => isThemeFromExtension(th, this.extension));
        }
        async run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            const colorThemes = await this.workbenchThemeService.getColorThemes();
            if (!this.computeEnablement(colorThemes)) {
                return;
            }
            const currentTheme = this.workbenchThemeService.getColorTheme();
            const delayer = new async_1.Delayer(100);
            const picks = getQuickPickEntries(colorThemes, currentTheme, this.extension, showCurrentTheme);
            const pickedTheme = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('select color theme', "Select Color Theme"),
                onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setColorTheme(item.id, undefined)),
                ignoreFocusLost
            });
            return this.workbenchThemeService.setColorTheme(pickedTheme ? pickedTheme.id : currentTheme.id, 'auto');
        }
    };
    exports.SetColorThemeAction = SetColorThemeAction;
    exports.SetColorThemeAction = SetColorThemeAction = SetColorThemeAction_1 = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], SetColorThemeAction);
    let SetFileIconThemeAction = class SetFileIconThemeAction extends ExtensionAction {
        static { SetFileIconThemeAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.setFileIconTheme'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.setFileIconTheme', 'Set File Icon Theme'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} theme`; }
        static { this.DisabledClass = `${SetFileIconThemeAction_1.EnabledClass} disabled`; }
        constructor(extensionService, workbenchThemeService, quickInputService, extensionEnablementService) {
            super(SetFileIconThemeAction_1.ID, SetFileIconThemeAction_1.TITLE.value, SetFileIconThemeAction_1.DisabledClass, false);
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.extensionEnablementService = extensionEnablementService;
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidFileIconThemeChange)(() => this.update(), this));
            this.update();
        }
        update() {
            this.workbenchThemeService.getFileIconThemes().then(fileIconThemes => {
                this.enabled = this.computeEnablement(fileIconThemes);
                this.class = this.enabled ? SetFileIconThemeAction_1.EnabledClass : SetFileIconThemeAction_1.DisabledClass;
            });
        }
        computeEnablement(colorThemfileIconThemess) {
            return !!this.extension && this.extension.state === 1 /* ExtensionState.Installed */ && this.extensionEnablementService.isEnabledEnablementState(this.extension.enablementState) && colorThemfileIconThemess.some(th => isThemeFromExtension(th, this.extension));
        }
        async run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            const fileIconThemes = await this.workbenchThemeService.getFileIconThemes();
            if (!this.computeEnablement(fileIconThemes)) {
                return;
            }
            const currentTheme = this.workbenchThemeService.getFileIconTheme();
            const delayer = new async_1.Delayer(100);
            const picks = getQuickPickEntries(fileIconThemes, currentTheme, this.extension, showCurrentTheme);
            const pickedTheme = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('select file icon theme', "Select File Icon Theme"),
                onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setFileIconTheme(item.id, undefined)),
                ignoreFocusLost
            });
            return this.workbenchThemeService.setFileIconTheme(pickedTheme ? pickedTheme.id : currentTheme.id, 'auto');
        }
    };
    exports.SetFileIconThemeAction = SetFileIconThemeAction;
    exports.SetFileIconThemeAction = SetFileIconThemeAction = SetFileIconThemeAction_1 = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], SetFileIconThemeAction);
    let SetProductIconThemeAction = class SetProductIconThemeAction extends ExtensionAction {
        static { SetProductIconThemeAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.setProductIconTheme'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.setProductIconTheme', 'Set Product Icon Theme'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} theme`; }
        static { this.DisabledClass = `${SetProductIconThemeAction_1.EnabledClass} disabled`; }
        constructor(extensionService, workbenchThemeService, quickInputService, extensionEnablementService) {
            super(SetProductIconThemeAction_1.ID, SetProductIconThemeAction_1.TITLE.value, SetProductIconThemeAction_1.DisabledClass, false);
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.extensionEnablementService = extensionEnablementService;
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidProductIconThemeChange)(() => this.update(), this));
            this.update();
        }
        update() {
            this.workbenchThemeService.getProductIconThemes().then(productIconThemes => {
                this.enabled = this.computeEnablement(productIconThemes);
                this.class = this.enabled ? SetProductIconThemeAction_1.EnabledClass : SetProductIconThemeAction_1.DisabledClass;
            });
        }
        computeEnablement(productIconThemes) {
            return !!this.extension && this.extension.state === 1 /* ExtensionState.Installed */ && this.extensionEnablementService.isEnabledEnablementState(this.extension.enablementState) && productIconThemes.some(th => isThemeFromExtension(th, this.extension));
        }
        async run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            const productIconThemes = await this.workbenchThemeService.getProductIconThemes();
            if (!this.computeEnablement(productIconThemes)) {
                return;
            }
            const currentTheme = this.workbenchThemeService.getProductIconTheme();
            const delayer = new async_1.Delayer(100);
            const picks = getQuickPickEntries(productIconThemes, currentTheme, this.extension, showCurrentTheme);
            const pickedTheme = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('select product icon theme', "Select Product Icon Theme"),
                onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setProductIconTheme(item.id, undefined)),
                ignoreFocusLost
            });
            return this.workbenchThemeService.setProductIconTheme(pickedTheme ? pickedTheme.id : currentTheme.id, 'auto');
        }
    };
    exports.SetProductIconThemeAction = SetProductIconThemeAction;
    exports.SetProductIconThemeAction = SetProductIconThemeAction = SetProductIconThemeAction_1 = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], SetProductIconThemeAction);
    let SetLanguageAction = class SetLanguageAction extends ExtensionAction {
        static { SetLanguageAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.setDisplayLanguage'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.setDisplayLanguage', 'Set Display Language'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} language`; }
        static { this.DisabledClass = `${SetLanguageAction_1.EnabledClass} disabled`; }
        constructor(extensionsWorkbenchService) {
            super(SetLanguageAction_1.ID, SetLanguageAction_1.TITLE.value, SetLanguageAction_1.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = SetLanguageAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (!this.extensionsWorkbenchService.canSetLanguage(this.extension)) {
                return;
            }
            if (this.extension.gallery && platform_1.language === (0, languagePacks_1.getLocale)(this.extension.gallery)) {
                return;
            }
            this.enabled = true;
            this.class = SetLanguageAction_1.EnabledClass;
        }
        async run() {
            return this.extension && this.extensionsWorkbenchService.setLanguage(this.extension);
        }
    };
    exports.SetLanguageAction = SetLanguageAction;
    exports.SetLanguageAction = SetLanguageAction = SetLanguageAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], SetLanguageAction);
    let ClearLanguageAction = class ClearLanguageAction extends ExtensionAction {
        static { ClearLanguageAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.clearLanguage'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.clearLanguage', 'Clear Display Language'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} language`; }
        static { this.DisabledClass = `${ClearLanguageAction_1.EnabledClass} disabled`; }
        constructor(extensionsWorkbenchService, localeService) {
            super(ClearLanguageAction_1.ID, ClearLanguageAction_1.TITLE.value, ClearLanguageAction_1.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.localeService = localeService;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = ClearLanguageAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (!this.extensionsWorkbenchService.canSetLanguage(this.extension)) {
                return;
            }
            if (this.extension.gallery && platform_1.language !== (0, languagePacks_1.getLocale)(this.extension.gallery)) {
                return;
            }
            this.enabled = true;
            this.class = ClearLanguageAction_1.EnabledClass;
        }
        async run() {
            return this.extension && this.localeService.clearLocalePreference();
        }
    };
    exports.ClearLanguageAction = ClearLanguageAction;
    exports.ClearLanguageAction = ClearLanguageAction = ClearLanguageAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, locale_1.ILocaleService)
    ], ClearLanguageAction);
    let ShowRecommendedExtensionAction = class ShowRecommendedExtensionAction extends actions_1.Action {
        static { ShowRecommendedExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.showRecommendedExtension'; }
        static { this.LABEL = (0, nls_1.localize)('showRecommendedExtension', "Show Recommended Extension"); }
        constructor(extensionId, paneCompositeService, extensionWorkbenchService) {
            super(ShowRecommendedExtensionAction_1.ID, ShowRecommendedExtensionAction_1.LABEL, undefined, false);
            this.paneCompositeService = paneCompositeService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.extensionId = extensionId;
        }
        async run() {
            const paneComposite = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const paneContainer = paneComposite?.getViewPaneContainer();
            paneContainer.search(`@id:${this.extensionId}`);
            paneContainer.focus();
            const [extension] = await this.extensionWorkbenchService.getExtensions([{ id: this.extensionId }], { source: 'install-recommendation' }, cancellation_1.CancellationToken.None);
            if (extension) {
                return this.extensionWorkbenchService.open(extension);
            }
            return null;
        }
    };
    exports.ShowRecommendedExtensionAction = ShowRecommendedExtensionAction;
    exports.ShowRecommendedExtensionAction = ShowRecommendedExtensionAction = ShowRecommendedExtensionAction_1 = __decorate([
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, extensions_1.IExtensionsWorkbenchService)
    ], ShowRecommendedExtensionAction);
    let InstallRecommendedExtensionAction = class InstallRecommendedExtensionAction extends actions_1.Action {
        static { InstallRecommendedExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.installRecommendedExtension'; }
        static { this.LABEL = (0, nls_1.localize)('installRecommendedExtension', "Install Recommended Extension"); }
        constructor(extensionId, paneCompositeService, instantiationService, extensionWorkbenchService) {
            super(InstallRecommendedExtensionAction_1.ID, InstallRecommendedExtensionAction_1.LABEL, undefined, false);
            this.paneCompositeService = paneCompositeService;
            this.instantiationService = instantiationService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.extensionId = extensionId;
        }
        async run() {
            const viewlet = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const viewPaneContainer = viewlet?.getViewPaneContainer();
            viewPaneContainer.search(`@id:${this.extensionId}`);
            viewPaneContainer.focus();
            const [extension] = await this.extensionWorkbenchService.getExtensions([{ id: this.extensionId }], { source: 'install-recommendation' }, cancellation_1.CancellationToken.None);
            if (extension) {
                await this.extensionWorkbenchService.open(extension);
                try {
                    await this.extensionWorkbenchService.install(extension);
                }
                catch (err) {
                    this.instantiationService.createInstance(PromptExtensionInstallFailureAction, extension, extension.latestVersion, 2 /* InstallOperation.Install */, err).run();
                }
            }
        }
    };
    exports.InstallRecommendedExtensionAction = InstallRecommendedExtensionAction;
    exports.InstallRecommendedExtensionAction = InstallRecommendedExtensionAction = InstallRecommendedExtensionAction_1 = __decorate([
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extensions_1.IExtensionsWorkbenchService)
    ], InstallRecommendedExtensionAction);
    let IgnoreExtensionRecommendationAction = class IgnoreExtensionRecommendationAction extends actions_1.Action {
        static { IgnoreExtensionRecommendationAction_1 = this; }
        static { this.ID = 'extensions.ignore'; }
        static { this.Class = `${ExtensionAction.LABEL_ACTION_CLASS} ignore`; }
        constructor(extension, extensionRecommendationsManagementService) {
            super(IgnoreExtensionRecommendationAction_1.ID, 'Ignore Recommendation');
            this.extension = extension;
            this.extensionRecommendationsManagementService = extensionRecommendationsManagementService;
            this.class = IgnoreExtensionRecommendationAction_1.Class;
            this.tooltip = (0, nls_1.localize)('ignoreExtensionRecommendation', "Do not recommend this extension again");
            this.enabled = true;
        }
        run() {
            this.extensionRecommendationsManagementService.toggleGlobalIgnoredRecommendation(this.extension.identifier.id, true);
            return Promise.resolve();
        }
    };
    exports.IgnoreExtensionRecommendationAction = IgnoreExtensionRecommendationAction;
    exports.IgnoreExtensionRecommendationAction = IgnoreExtensionRecommendationAction = IgnoreExtensionRecommendationAction_1 = __decorate([
        __param(1, extensionRecommendations_1.IExtensionIgnoredRecommendationsService)
    ], IgnoreExtensionRecommendationAction);
    let UndoIgnoreExtensionRecommendationAction = class UndoIgnoreExtensionRecommendationAction extends actions_1.Action {
        static { UndoIgnoreExtensionRecommendationAction_1 = this; }
        static { this.ID = 'extensions.ignore'; }
        static { this.Class = `${ExtensionAction.LABEL_ACTION_CLASS} undo-ignore`; }
        constructor(extension, extensionRecommendationsManagementService) {
            super(UndoIgnoreExtensionRecommendationAction_1.ID, 'Undo');
            this.extension = extension;
            this.extensionRecommendationsManagementService = extensionRecommendationsManagementService;
            this.class = UndoIgnoreExtensionRecommendationAction_1.Class;
            this.tooltip = (0, nls_1.localize)('undo', "Undo");
            this.enabled = true;
        }
        run() {
            this.extensionRecommendationsManagementService.toggleGlobalIgnoredRecommendation(this.extension.identifier.id, false);
            return Promise.resolve();
        }
    };
    exports.UndoIgnoreExtensionRecommendationAction = UndoIgnoreExtensionRecommendationAction;
    exports.UndoIgnoreExtensionRecommendationAction = UndoIgnoreExtensionRecommendationAction = UndoIgnoreExtensionRecommendationAction_1 = __decorate([
        __param(1, extensionRecommendations_1.IExtensionIgnoredRecommendationsService)
    ], UndoIgnoreExtensionRecommendationAction);
    let SearchExtensionsAction = class SearchExtensionsAction extends actions_1.Action {
        constructor(searchValue, paneCompositeService) {
            super('extensions.searchExtensions', (0, nls_1.localize)('search recommendations', "Search Extensions"), undefined, true);
            this.searchValue = searchValue;
            this.paneCompositeService = paneCompositeService;
        }
        async run() {
            const viewPaneContainer = (await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true))?.getViewPaneContainer();
            viewPaneContainer.search(this.searchValue);
            viewPaneContainer.focus();
        }
    };
    exports.SearchExtensionsAction = SearchExtensionsAction;
    exports.SearchExtensionsAction = SearchExtensionsAction = __decorate([
        __param(1, panecomposite_1.IPaneCompositePartService)
    ], SearchExtensionsAction);
    let AbstractConfigureRecommendedExtensionsAction = class AbstractConfigureRecommendedExtensionsAction extends actions_1.Action {
        constructor(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService) {
            super(id, label);
            this.contextService = contextService;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.jsonEditingService = jsonEditingService;
            this.textModelResolverService = textModelResolverService;
        }
        openExtensionsFile(extensionsFileResource) {
            return this.getOrCreateExtensionsFile(extensionsFileResource)
                .then(({ created, content }) => this.getSelectionPosition(content, extensionsFileResource, ['recommendations'])
                .then(selection => this.editorService.openEditor({
                resource: extensionsFileResource,
                options: {
                    pinned: created,
                    selection
                }
            })), error => Promise.reject(new Error((0, nls_1.localize)('OpenExtensionsFile.failed', "Unable to create 'extensions.json' file inside the '.vscode' folder ({0}).", error))));
        }
        openWorkspaceConfigurationFile(workspaceConfigurationFile) {
            return this.getOrUpdateWorkspaceConfigurationFile(workspaceConfigurationFile)
                .then(content => this.getSelectionPosition(content.value.toString(), content.resource, ['extensions', 'recommendations']))
                .then(selection => this.editorService.openEditor({
                resource: workspaceConfigurationFile,
                options: {
                    selection,
                    forceReload: true // because content has changed
                }
            }));
        }
        getOrUpdateWorkspaceConfigurationFile(workspaceConfigurationFile) {
            return Promise.resolve(this.fileService.readFile(workspaceConfigurationFile))
                .then(content => {
                const workspaceRecommendations = json.parse(content.value.toString())['extensions'];
                if (!workspaceRecommendations || !workspaceRecommendations.recommendations) {
                    return this.jsonEditingService.write(workspaceConfigurationFile, [{ path: ['extensions'], value: { recommendations: [] } }], true)
                        .then(() => this.fileService.readFile(workspaceConfigurationFile));
                }
                return content;
            });
        }
        getSelectionPosition(content, resource, path) {
            const tree = json.parseTree(content);
            const node = json.findNodeAtLocation(tree, path);
            if (node && node.parent && node.parent.children) {
                const recommendationsValueNode = node.parent.children[1];
                const lastExtensionNode = recommendationsValueNode.children && recommendationsValueNode.children.length ? recommendationsValueNode.children[recommendationsValueNode.children.length - 1] : null;
                const offset = lastExtensionNode ? lastExtensionNode.offset + lastExtensionNode.length : recommendationsValueNode.offset + 1;
                return Promise.resolve(this.textModelResolverService.createModelReference(resource))
                    .then(reference => {
                    const position = reference.object.textEditorModel.getPositionAt(offset);
                    reference.dispose();
                    return {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                    };
                });
            }
            return Promise.resolve(undefined);
        }
        getOrCreateExtensionsFile(extensionsFileResource) {
            return Promise.resolve(this.fileService.readFile(extensionsFileResource)).then(content => {
                return { created: false, extensionsFileResource, content: content.value.toString() };
            }, err => {
                return this.textFileService.write(extensionsFileResource, extensionsFileTemplate_1.ExtensionsConfigurationInitialContent).then(() => {
                    return { created: true, extensionsFileResource, content: extensionsFileTemplate_1.ExtensionsConfigurationInitialContent };
                });
            });
        }
    };
    exports.AbstractConfigureRecommendedExtensionsAction = AbstractConfigureRecommendedExtensionsAction;
    exports.AbstractConfigureRecommendedExtensionsAction = AbstractConfigureRecommendedExtensionsAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, files_1.IFileService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService)
    ], AbstractConfigureRecommendedExtensionsAction);
    let ConfigureWorkspaceRecommendedExtensionsAction = class ConfigureWorkspaceRecommendedExtensionsAction extends AbstractConfigureRecommendedExtensionsAction {
        static { this.ID = 'workbench.extensions.action.configureWorkspaceRecommendedExtensions'; }
        static { this.LABEL = (0, nls_1.localize)('configureWorkspaceRecommendedExtensions', "Configure Recommended Extensions (Workspace)"); }
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.update(), this));
            this.update();
        }
        update() {
            this.enabled = this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */;
        }
        run() {
            switch (this.contextService.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */:
                    return this.openExtensionsFile(this.contextService.getWorkspace().folders[0].toResource(workspaceExtensionsConfig_1.EXTENSIONS_CONFIG));
                case 3 /* WorkbenchState.WORKSPACE */:
                    return this.openWorkspaceConfigurationFile(this.contextService.getWorkspace().configuration);
            }
            return Promise.resolve();
        }
    };
    exports.ConfigureWorkspaceRecommendedExtensionsAction = ConfigureWorkspaceRecommendedExtensionsAction;
    exports.ConfigureWorkspaceRecommendedExtensionsAction = ConfigureWorkspaceRecommendedExtensionsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService)
    ], ConfigureWorkspaceRecommendedExtensionsAction);
    let ConfigureWorkspaceFolderRecommendedExtensionsAction = class ConfigureWorkspaceFolderRecommendedExtensionsAction extends AbstractConfigureRecommendedExtensionsAction {
        static { this.ID = 'workbench.extensions.action.configureWorkspaceFolderRecommendedExtensions'; }
        static { this.LABEL = (0, nls_1.localize)('configureWorkspaceFolderRecommendedExtensions', "Configure Recommended Extensions (Workspace Folder)"); }
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService, commandService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this.commandService = commandService;
        }
        run() {
            const folderCount = this.contextService.getWorkspace().folders.length;
            const pickFolderPromise = folderCount === 1 ? Promise.resolve(this.contextService.getWorkspace().folders[0]) : this.commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
            return Promise.resolve(pickFolderPromise)
                .then(workspaceFolder => {
                if (workspaceFolder) {
                    return this.openExtensionsFile(workspaceFolder.toResource(workspaceExtensionsConfig_1.EXTENSIONS_CONFIG));
                }
                return null;
            });
        }
    };
    exports.ConfigureWorkspaceFolderRecommendedExtensionsAction = ConfigureWorkspaceFolderRecommendedExtensionsAction;
    exports.ConfigureWorkspaceFolderRecommendedExtensionsAction = ConfigureWorkspaceFolderRecommendedExtensionsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService),
        __param(8, commands_1.ICommandService)
    ], ConfigureWorkspaceFolderRecommendedExtensionsAction);
    let ExtensionStatusLabelAction = class ExtensionStatusLabelAction extends actions_1.Action {
        static { ExtensionStatusLabelAction_1 = this; }
        static { this.ENABLED_CLASS = `${ExtensionAction.TEXT_ACTION_CLASS} extension-status-label`; }
        static { this.DISABLED_CLASS = `${ExtensionStatusLabelAction_1.ENABLED_CLASS} hide`; }
        get extension() { return this._extension; }
        set extension(extension) {
            if (!(this._extension && extension && (0, extensionManagementUtil_1.areSameExtensions)(this._extension.identifier, extension.identifier))) {
                // Different extension. Reset
                this.initialStatus = null;
                this.status = null;
                this.enablementState = null;
            }
            this._extension = extension;
            this.update();
        }
        constructor(extensionService, extensionManagementServerService, extensionEnablementService) {
            super('extensions.action.statusLabel', '', ExtensionStatusLabelAction_1.DISABLED_CLASS, false);
            this.extensionService = extensionService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionEnablementService = extensionEnablementService;
            this.initialStatus = null;
            this.status = null;
            this.version = null;
            this.enablementState = null;
            this._extension = null;
        }
        update() {
            const label = this.computeLabel();
            this.label = label || '';
            this.class = label ? ExtensionStatusLabelAction_1.ENABLED_CLASS : ExtensionStatusLabelAction_1.DISABLED_CLASS;
        }
        computeLabel() {
            if (!this.extension) {
                return null;
            }
            const currentStatus = this.status;
            const currentVersion = this.version;
            const currentEnablementState = this.enablementState;
            this.status = this.extension.state;
            this.version = this.extension.version;
            if (this.initialStatus === null) {
                this.initialStatus = this.status;
            }
            this.enablementState = this.extension.enablementState;
            const canAddExtension = () => {
                const runningExtension = this.extensionService.extensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))[0];
                if (this.extension.local) {
                    if (runningExtension && this.extension.version === runningExtension.version) {
                        return true;
                    }
                    return this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(this.extension.local));
                }
                return false;
            };
            const canRemoveExtension = () => {
                if (this.extension.local) {
                    if (this.extensionService.extensions.every(e => !((0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier) && this.extension.server === this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(e))))) {
                        return true;
                    }
                    return this.extensionService.canRemoveExtension((0, extensions_3.toExtensionDescription)(this.extension.local));
                }
                return false;
            };
            if (currentStatus !== null) {
                if (currentStatus === 0 /* ExtensionState.Installing */ && this.status === 1 /* ExtensionState.Installed */) {
                    return canAddExtension() ? this.initialStatus === 1 /* ExtensionState.Installed */ && this.version !== currentVersion ? (0, nls_1.localize)('updated', "Updated") : (0, nls_1.localize)('installed', "Installed") : null;
                }
                if (currentStatus === 2 /* ExtensionState.Uninstalling */ && this.status === 3 /* ExtensionState.Uninstalled */) {
                    this.initialStatus = this.status;
                    return canRemoveExtension() ? (0, nls_1.localize)('uninstalled', "Uninstalled") : null;
                }
            }
            if (currentEnablementState !== null) {
                const currentlyEnabled = this.extensionEnablementService.isEnabledEnablementState(currentEnablementState);
                const enabled = this.extensionEnablementService.isEnabledEnablementState(this.enablementState);
                if (!currentlyEnabled && enabled) {
                    return canAddExtension() ? (0, nls_1.localize)('enabled', "Enabled") : null;
                }
                if (currentlyEnabled && !enabled) {
                    return canRemoveExtension() ? (0, nls_1.localize)('disabled', "Disabled") : null;
                }
            }
            return null;
        }
        run() {
            return Promise.resolve();
        }
    };
    exports.ExtensionStatusLabelAction = ExtensionStatusLabelAction;
    exports.ExtensionStatusLabelAction = ExtensionStatusLabelAction = ExtensionStatusLabelAction_1 = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], ExtensionStatusLabelAction);
    let ToggleSyncExtensionAction = class ToggleSyncExtensionAction extends ExtensionDropDownAction {
        static { ToggleSyncExtensionAction_1 = this; }
        static { this.IGNORED_SYNC_CLASS = `${ExtensionAction.ICON_ACTION_CLASS} extension-sync ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.syncIgnoredIcon)}`; }
        static { this.SYNC_CLASS = `${ToggleSyncExtensionAction_1.ICON_ACTION_CLASS} extension-sync ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.syncEnabledIcon)}`; }
        constructor(configurationService, extensionsWorkbenchService, userDataSyncEnablementService, instantiationService) {
            super('extensions.sync', '', ToggleSyncExtensionAction_1.SYNC_CLASS, false, instantiationService);
            this.configurationService = configurationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('settingsSync.ignoredExtensions'))(() => this.update()));
            this._register(userDataSyncEnablementService.onDidChangeEnablement(() => this.update()));
            this.update();
        }
        update() {
            this.enabled = !!this.extension && this.userDataSyncEnablementService.isEnabled() && this.extension.state === 1 /* ExtensionState.Installed */;
            if (this.extension) {
                const isIgnored = this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension);
                this.class = isIgnored ? ToggleSyncExtensionAction_1.IGNORED_SYNC_CLASS : ToggleSyncExtensionAction_1.SYNC_CLASS;
                this.tooltip = isIgnored ? (0, nls_1.localize)('ignored', "This extension is ignored during sync") : (0, nls_1.localize)('synced', "This extension is synced");
            }
        }
        async run() {
            return super.run({
                actionGroups: [
                    [
                        new actions_1.Action('extensions.syncignore', this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension) ? (0, nls_1.localize)('sync', "Sync this extension") : (0, nls_1.localize)('do not sync', "Do not sync this extension"), undefined, true, () => this.extensionsWorkbenchService.toggleExtensionIgnoredToSync(this.extension))
                    ]
                ], disposeActionsOnHide: true
            });
        }
    };
    exports.ToggleSyncExtensionAction = ToggleSyncExtensionAction;
    exports.ToggleSyncExtensionAction = ToggleSyncExtensionAction = ToggleSyncExtensionAction_1 = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, userDataSync_1.IUserDataSyncEnablementService),
        __param(3, instantiation_1.IInstantiationService)
    ], ToggleSyncExtensionAction);
    let ExtensionStatusAction = class ExtensionStatusAction extends ExtensionAction {
        static { ExtensionStatusAction_1 = this; }
        static { this.CLASS = `${ExtensionAction.ICON_ACTION_CLASS} extension-status`; }
        get status() { return this._status; }
        constructor(extensionManagementServerService, labelService, commandService, workspaceTrustEnablementService, workspaceTrustService, extensionsWorkbenchService, extensionService, extensionManifestPropertiesService, contextService, productService, workbenchExtensionEnablementService, extensionFeaturesManagementService) {
            super('extensions.status', '', `${ExtensionStatusAction_1.CLASS} hide`, false);
            this.extensionManagementServerService = extensionManagementServerService;
            this.labelService = labelService;
            this.commandService = commandService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.workspaceTrustService = workspaceTrustService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionService = extensionService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.contextService = contextService;
            this.productService = productService;
            this.workbenchExtensionEnablementService = workbenchExtensionEnablementService;
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this.updateWhenCounterExtensionChanges = true;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this.updateThrottler = new async_1.Throttler();
            this._register(this.labelService.onDidChangeFormatters(() => this.update(), this));
            this._register(this.extensionService.onDidChangeExtensions(() => this.update()));
            this._register(this.extensionFeaturesManagementService.onDidChangeAccessData(() => this.update()));
            this.update();
        }
        update() {
            this.updateThrottler.queue(() => this.computeAndUpdateStatus());
        }
        async computeAndUpdateStatus() {
            this.updateStatus(undefined, true);
            this.enabled = false;
            if (!this.extension) {
                return;
            }
            if (this.extension.isMalicious) {
                this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('malicious tooltip', "This extension was reported to be problematic.")) }, true);
                return;
            }
            if (this.extension.deprecationInfo) {
                if (this.extension.deprecationInfo.extension) {
                    const link = `[${this.extension.deprecationInfo.extension.displayName}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.deprecationInfo.extension.id]))}`)})`;
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('deprecated with alternate extension tooltip', "This extension is deprecated. Use the {0} extension instead.", link)) }, true);
                }
                else if (this.extension.deprecationInfo.settings) {
                    const link = `[${(0, nls_1.localize)('settings', "settings")}](${uri_1.URI.parse(`command:workbench.action.openSettings?${encodeURIComponent(JSON.stringify([this.extension.deprecationInfo.settings.map(setting => `@id:${setting}`).join(' ')]))}`)})`;
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('deprecated with alternate settings tooltip', "This extension is deprecated as this functionality is now built-in to VS Code. Configure these {0} to use this functionality.", link)) }, true);
                }
                else {
                    const message = new htmlContent_1.MarkdownString((0, nls_1.localize)('deprecated tooltip', "This extension is deprecated as it is no longer being maintained."));
                    if (this.extension.deprecationInfo.additionalInfo) {
                        message.appendMarkdown(` ${this.extension.deprecationInfo.additionalInfo}`);
                    }
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                }
                return;
            }
            if (this.extensionsWorkbenchService.canSetLanguage(this.extension)) {
                return;
            }
            if (this.extension.gallery && this.extension.state === 3 /* ExtensionState.Uninstalled */ && !await this.extensionsWorkbenchService.canInstall(this.extension)) {
                if (this.extensionManagementServerService.localExtensionManagementServer || this.extensionManagementServerService.remoteExtensionManagementServer) {
                    const targetPlatform = await (this.extensionManagementServerService.localExtensionManagementServer ? this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getTargetPlatform() : this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getTargetPlatform());
                    const message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('incompatible platform', "The '{0}' extension is not available in {1} for {2}.", this.extension.displayName || this.extension.identifier.id, this.productService.nameLong, (0, extensionManagement_1.TargetPlatformToString)(targetPlatform))} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-platform-specific-extensions)`);
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                    return;
                }
                if (this.extensionManagementServerService.webExtensionManagementServer) {
                    const productName = (0, nls_1.localize)('VS Code for Web', "{0} for the Web", this.productService.nameLong);
                    const message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('not web tooltip', "The '{0}' extension is not available in {1}.", this.extension.displayName || this.extension.identifier.id, productName)} [${(0, nls_1.localize)('learn why', "Learn Why")}](https://aka.ms/vscode-web-extensions-guide)`);
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                    return;
                }
            }
            if (!this.extension.local ||
                !this.extension.server ||
                this.extension.state !== 1 /* ExtensionState.Installed */) {
                return;
            }
            // Extension is disabled by environment
            if (this.extension.enablementState === 2 /* EnablementState.DisabledByEnvironment */) {
                this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('disabled by environment', "This extension is disabled by the environment.")) }, true);
                return;
            }
            // Extension is enabled by environment
            if (this.extension.enablementState === 3 /* EnablementState.EnabledByEnvironment */) {
                this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('enabled by environment', "This extension is enabled because it is required in the current environment.")) }, true);
                return;
            }
            // Extension is disabled by virtual workspace
            if (this.extension.enablementState === 4 /* EnablementState.DisabledByVirtualWorkspace */) {
                const details = (0, extensions_2.getWorkspaceSupportTypeMessage)(this.extension.local.manifest.capabilities?.virtualWorkspaces);
                this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(details ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(details) : (0, nls_1.localize)('disabled because of virtual workspace', "This extension has been disabled because it does not support virtual workspaces.")) }, true);
                return;
            }
            // Limited support in Virtual Workspace
            if ((0, virtualWorkspace_1.isVirtualWorkspace)(this.contextService.getWorkspace())) {
                const virtualSupportType = this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(this.extension.local.manifest);
                const details = (0, extensions_2.getWorkspaceSupportTypeMessage)(this.extension.local.manifest.capabilities?.virtualWorkspaces);
                if (virtualSupportType === 'limited' || details) {
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString(details ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(details) : (0, nls_1.localize)('extension limited because of virtual workspace', "This extension has limited features because the current workspace is virtual.")) }, true);
                    return;
                }
            }
            // Extension is disabled by untrusted workspace
            if (this.extension.enablementState === 0 /* EnablementState.DisabledByTrustRequirement */ ||
                // All disabled dependencies of the extension are disabled by untrusted workspace
                (this.extension.enablementState === 5 /* EnablementState.DisabledByExtensionDependency */ && this.workbenchExtensionEnablementService.getDependenciesEnablementStates(this.extension.local).every(([, enablementState]) => this.workbenchExtensionEnablementService.isEnabledEnablementState(enablementState) || enablementState === 0 /* EnablementState.DisabledByTrustRequirement */))) {
                this.enabled = true;
                const untrustedDetails = (0, extensions_2.getWorkspaceSupportTypeMessage)(this.extension.local.manifest.capabilities?.untrustedWorkspaces);
                this.updateStatus({ icon: extensionsIcons_1.trustIcon, message: new htmlContent_1.MarkdownString(untrustedDetails ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(untrustedDetails) : (0, nls_1.localize)('extension disabled because of trust requirement', "This extension has been disabled because the current workspace is not trusted.")) }, true);
                return;
            }
            // Limited support in Untrusted Workspace
            if (this.workspaceTrustEnablementService.isWorkspaceTrustEnabled() && !this.workspaceTrustService.isWorkspaceTrusted()) {
                const untrustedSupportType = this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(this.extension.local.manifest);
                const untrustedDetails = (0, extensions_2.getWorkspaceSupportTypeMessage)(this.extension.local.manifest.capabilities?.untrustedWorkspaces);
                if (untrustedSupportType === 'limited' || untrustedDetails) {
                    this.enabled = true;
                    this.updateStatus({ icon: extensionsIcons_1.trustIcon, message: new htmlContent_1.MarkdownString(untrustedDetails ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(untrustedDetails) : (0, nls_1.localize)('extension limited because of trust requirement', "This extension has limited features because the current workspace is not trusted.")) }, true);
                    return;
                }
            }
            // Extension is disabled by extension kind
            if (this.extension.enablementState === 1 /* EnablementState.DisabledByExtensionKind */) {
                if (!this.extensionsWorkbenchService.installed.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server !== this.extension.server)) {
                    let message;
                    // Extension on Local Server
                    if (this.extensionManagementServerService.localExtensionManagementServer === this.extension.server) {
                        if (this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                                message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Install in remote server to enable', "This extension is disabled in this workspace because it is defined to run in the Remote Extension Host. Please install the extension in '{0}' to enable.", this.extensionManagementServerService.remoteExtensionManagementServer.label)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://code.visualstudio.com/api/advanced-topics/remote-extensions#architecture-and-extension-kinds)`);
                            }
                        }
                    }
                    // Extension on Remote Server
                    else if (this.extensionManagementServerService.remoteExtensionManagementServer === this.extension.server) {
                        if (this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                            if (this.extensionManagementServerService.localExtensionManagementServer) {
                                message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Install in local server to enable', "This extension is disabled in this workspace because it is defined to run in the Local Extension Host. Please install the extension locally to enable.", this.extensionManagementServerService.remoteExtensionManagementServer.label)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://code.visualstudio.com/api/advanced-topics/remote-extensions#architecture-and-extension-kinds)`);
                            }
                            else if (platform_1.isWeb) {
                                message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Defined to run in desktop', "This extension is disabled because it is defined to run only in {0} for the Desktop.", this.productService.nameLong)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://code.visualstudio.com/api/advanced-topics/remote-extensions#architecture-and-extension-kinds)`);
                            }
                        }
                    }
                    // Extension on Web Server
                    else if (this.extensionManagementServerService.webExtensionManagementServer === this.extension.server) {
                        message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Cannot be enabled', "This extension is disabled because it is not supported in {0} for the Web.", this.productService.nameLong)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://code.visualstudio.com/api/advanced-topics/remote-extensions#architecture-and-extension-kinds)`);
                    }
                    if (message) {
                        this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                    }
                    return;
                }
            }
            const extensionId = new extensions_2.ExtensionIdentifier(this.extension.identifier.id);
            const features = platform_2.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).getExtensionFeatures();
            for (const feature of features) {
                const status = this.extensionFeaturesManagementService.getAccessData(extensionId, feature.id)?.current?.status;
                const manageAccessLink = `[${(0, nls_1.localize)('manage access', 'Manage Access')}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.identifier.id, "features" /* ExtensionEditorTab.Features */, false, feature.id]))}`)})`;
                if (status?.severity === notification_1.Severity.Error) {
                    this.updateStatus({ icon: extensionsIcons_1.errorIcon, message: new htmlContent_1.MarkdownString().appendText(status.message).appendMarkdown(` ${manageAccessLink}`) }, true);
                    return;
                }
                if (status?.severity === notification_1.Severity.Warning) {
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString().appendText(status.message).appendMarkdown(` ${manageAccessLink}`) }, true);
                    return;
                }
            }
            // Remote Workspace
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                if ((0, extensions_2.isLanguagePackExtension)(this.extension.local.manifest)) {
                    if (!this.extensionsWorkbenchService.installed.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server !== this.extension.server)) {
                        const message = this.extension.server === this.extensionManagementServerService.localExtensionManagementServer
                            ? new htmlContent_1.MarkdownString((0, nls_1.localize)('Install language pack also in remote server', "Install the language pack extension on '{0}' to enable it there also.", this.extensionManagementServerService.remoteExtensionManagementServer.label))
                            : new htmlContent_1.MarkdownString((0, nls_1.localize)('Install language pack also locally', "Install the language pack extension locally to enable it there also."));
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message }, true);
                    }
                    return;
                }
                const runningExtension = this.extensionService.extensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))[0];
                const runningExtensionServer = runningExtension ? this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(runningExtension)) : null;
                if (this.extension.server === this.extensionManagementServerService.localExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.remoteExtensionManagementServer) {
                    if (this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('enabled remotely', "This extension is enabled in the Remote Extension Host because it prefers to run there.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://code.visualstudio.com/api/advanced-topics/remote-extensions#architecture-and-extension-kinds)`) }, true);
                    }
                    return;
                }
                if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.localExtensionManagementServer) {
                    if (this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('enabled locally', "This extension is enabled in the Local Extension Host because it prefers to run there.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://code.visualstudio.com/api/advanced-topics/remote-extensions#architecture-and-extension-kinds)`) }, true);
                    }
                    return;
                }
                if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.webExtensionManagementServer) {
                    if (this.extensionManifestPropertiesService.canExecuteOnWeb(this.extension.local.manifest)) {
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('enabled in web worker', "This extension is enabled in the Web Worker Extension Host because it prefers to run there.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://code.visualstudio.com/api/advanced-topics/remote-extensions#architecture-and-extension-kinds)`) }, true);
                    }
                    return;
                }
            }
            // Extension is disabled by its dependency
            if (this.extension.enablementState === 5 /* EnablementState.DisabledByExtensionDependency */) {
                this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('extension disabled because of dependency', "This extension has been disabled because it depends on an extension that is disabled.")) }, true);
                return;
            }
            const isEnabled = this.workbenchExtensionEnablementService.isEnabled(this.extension.local);
            const isRunning = this.extensionService.extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier));
            if (!this.extension.isWorkspaceScoped && isEnabled && isRunning) {
                if (this.extension.enablementState === 9 /* EnablementState.EnabledWorkspace */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('workspace enabled', "This extension is enabled for this workspace by the user.")) }, true);
                    return;
                }
                if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                    if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                        this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('extension enabled on remote', "Extension is enabled on '{0}'", this.extension.server.label)) }, true);
                        return;
                    }
                }
                if (this.extension.enablementState === 8 /* EnablementState.EnabledGlobally */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('globally enabled', "This extension is enabled globally.")) }, true);
                    return;
                }
            }
            if (!isEnabled && !isRunning) {
                if (this.extension.enablementState === 6 /* EnablementState.DisabledGlobally */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('globally disabled', "This extension is disabled globally by the user.")) }, true);
                    return;
                }
                if (this.extension.enablementState === 7 /* EnablementState.DisabledWorkspace */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('workspace disabled', "This extension is disabled for this workspace by the user.")) }, true);
                    return;
                }
            }
            if (isEnabled && !isRunning && !this.extension.local.isValid) {
                const errors = this.extension.local.validations.filter(([severity]) => severity === notification_1.Severity.Error).map(([, message]) => message);
                this.updateStatus({ icon: extensionsIcons_1.errorIcon, message: new htmlContent_1.MarkdownString(errors.join(' ').trim()) }, true);
            }
        }
        updateStatus(status, updateClass) {
            if (this._status === status) {
                return;
            }
            if (this._status && status && this._status.message === status.message && this._status.icon?.id === status.icon?.id) {
                return;
            }
            this._status = status;
            if (updateClass) {
                if (this._status?.icon === extensionsIcons_1.errorIcon) {
                    this.class = `${ExtensionStatusAction_1.CLASS} extension-status-error ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.errorIcon)}`;
                }
                else if (this._status?.icon === extensionsIcons_1.warningIcon) {
                    this.class = `${ExtensionStatusAction_1.CLASS} extension-status-warning ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.warningIcon)}`;
                }
                else if (this._status?.icon === extensionsIcons_1.infoIcon) {
                    this.class = `${ExtensionStatusAction_1.CLASS} extension-status-info ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.infoIcon)}`;
                }
                else if (this._status?.icon === extensionsIcons_1.trustIcon) {
                    this.class = `${ExtensionStatusAction_1.CLASS} ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.trustIcon)}`;
                }
                else {
                    this.class = `${ExtensionStatusAction_1.CLASS} hide`;
                }
            }
            this._onDidChangeStatus.fire();
        }
        async run() {
            if (this._status?.icon === extensionsIcons_1.trustIcon) {
                return this.commandService.executeCommand('workbench.trust.manage');
            }
        }
    };
    exports.ExtensionStatusAction = ExtensionStatusAction;
    exports.ExtensionStatusAction = ExtensionStatusAction = ExtensionStatusAction_1 = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, label_1.ILabelService),
        __param(2, commands_1.ICommandService),
        __param(3, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(4, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(5, extensions_1.IExtensionsWorkbenchService),
        __param(6, extensions_3.IExtensionService),
        __param(7, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, productService_1.IProductService),
        __param(10, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(11, extensionFeatures_1.IExtensionFeaturesManagementService)
    ], ExtensionStatusAction);
    let ReinstallAction = class ReinstallAction extends actions_1.Action {
        static { ReinstallAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.reinstall'; }
        static { this.LABEL = (0, nls_1.localize)('reinstall', "Reinstall Extension..."); }
        constructor(id = ReinstallAction_1.ID, label = ReinstallAction_1.LABEL, extensionsWorkbenchService, extensionManagementServerService, quickInputService, notificationService, hostService, instantiationService, extensionService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.hostService = hostService;
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
        }
        get enabled() {
            return this.extensionsWorkbenchService.local.filter(l => !l.isBuiltin && l.local).length > 0;
        }
        run() {
            return this.quickInputService.pick(this.getEntries(), { placeHolder: (0, nls_1.localize)('selectExtensionToReinstall', "Select Extension to Reinstall") })
                .then(pick => pick && this.reinstallExtension(pick.extension));
        }
        getEntries() {
            return this.extensionsWorkbenchService.queryLocal()
                .then(local => {
                const entries = local
                    .filter(extension => !extension.isBuiltin && extension.server !== this.extensionManagementServerService.webExtensionManagementServer)
                    .map(extension => {
                    return {
                        id: extension.identifier.id,
                        label: extension.displayName,
                        description: extension.identifier.id,
                        extension,
                    };
                });
                return entries;
            });
        }
        reinstallExtension(extension) {
            return this.instantiationService.createInstance(SearchExtensionsAction, '@installed ').run()
                .then(() => {
                return this.extensionsWorkbenchService.reinstall(extension)
                    .then(extension => {
                    const requireReload = !(extension.local && this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension.local)));
                    const message = requireReload ? (0, nls_1.localize)('ReinstallAction.successReload', "Please reload Visual Studio Code to complete reinstalling the extension {0}.", extension.identifier.id)
                        : (0, nls_1.localize)('ReinstallAction.success', "Reinstalling the extension {0} is completed.", extension.identifier.id);
                    const actions = requireReload ? [{
                            label: (0, nls_1.localize)('InstallVSIXAction.reloadNow', "Reload Now"),
                            run: () => this.hostService.reload()
                        }] : [];
                    this.notificationService.prompt(notification_1.Severity.Info, message, actions, { sticky: true });
                }, error => this.notificationService.error(error));
            });
        }
    };
    exports.ReinstallAction = ReinstallAction;
    exports.ReinstallAction = ReinstallAction = ReinstallAction_1 = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, extensionManagement_2.IExtensionManagementServerService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, notification_1.INotificationService),
        __param(6, host_1.IHostService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, extensions_3.IExtensionService)
    ], ReinstallAction);
    let InstallSpecificVersionOfExtensionAction = class InstallSpecificVersionOfExtensionAction extends actions_1.Action {
        static { InstallSpecificVersionOfExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.install.specificVersion'; }
        static { this.LABEL = (0, nls_1.localize)('install previous version', "Install Specific Version of Extension..."); }
        constructor(id = InstallSpecificVersionOfExtensionAction_1.ID, label = InstallSpecificVersionOfExtensionAction_1.LABEL, extensionsWorkbenchService, quickInputService, instantiationService, extensionEnablementService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.extensionEnablementService = extensionEnablementService;
        }
        get enabled() {
            return this.extensionsWorkbenchService.local.some(l => this.isEnabled(l));
        }
        async run() {
            const extensionPick = await this.quickInputService.pick(this.getExtensionEntries(), { placeHolder: (0, nls_1.localize)('selectExtension', "Select Extension"), matchOnDetail: true });
            if (extensionPick && extensionPick.extension) {
                const action = this.instantiationService.createInstance(InstallAnotherVersionAction);
                action.extension = extensionPick.extension;
                await action.run();
                await this.instantiationService.createInstance(SearchExtensionsAction, extensionPick.extension.identifier.id).run();
            }
        }
        isEnabled(extension) {
            const action = this.instantiationService.createInstance(InstallAnotherVersionAction);
            action.extension = extension;
            return action.enabled && !!extension.local && this.extensionEnablementService.isEnabled(extension.local);
        }
        async getExtensionEntries() {
            const installed = await this.extensionsWorkbenchService.queryLocal();
            const entries = [];
            for (const extension of installed) {
                if (this.isEnabled(extension)) {
                    entries.push({
                        id: extension.identifier.id,
                        label: extension.displayName || extension.identifier.id,
                        description: extension.identifier.id,
                        extension,
                    });
                }
            }
            return entries.sort((e1, e2) => e1.extension.displayName.localeCompare(e2.extension.displayName));
        }
    };
    exports.InstallSpecificVersionOfExtensionAction = InstallSpecificVersionOfExtensionAction;
    exports.InstallSpecificVersionOfExtensionAction = InstallSpecificVersionOfExtensionAction = InstallSpecificVersionOfExtensionAction_1 = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], InstallSpecificVersionOfExtensionAction);
    let AbstractInstallExtensionsInServerAction = class AbstractInstallExtensionsInServerAction extends actions_1.Action {
        constructor(id, extensionsWorkbenchService, quickInputService, notificationService, progressService) {
            super(id);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.progressService = progressService;
            this.extensions = undefined;
            this.update();
            this.extensionsWorkbenchService.queryLocal().then(() => this.updateExtensions());
            this._register(this.extensionsWorkbenchService.onChange(() => {
                if (this.extensions) {
                    this.updateExtensions();
                }
            }));
        }
        updateExtensions() {
            this.extensions = this.extensionsWorkbenchService.local;
            this.update();
        }
        update() {
            this.enabled = !!this.extensions && this.getExtensionsToInstall(this.extensions).length > 0;
            this.tooltip = this.label;
        }
        async run() {
            return this.selectAndInstallExtensions();
        }
        async queryExtensionsToInstall() {
            const local = await this.extensionsWorkbenchService.queryLocal();
            return this.getExtensionsToInstall(local);
        }
        async selectAndInstallExtensions() {
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.busy = true;
            const disposable = quickPick.onDidAccept(() => {
                disposable.dispose();
                quickPick.hide();
                quickPick.dispose();
                this.onDidAccept(quickPick.selectedItems);
            });
            quickPick.show();
            const localExtensionsToInstall = await this.queryExtensionsToInstall();
            quickPick.busy = false;
            if (localExtensionsToInstall.length) {
                quickPick.title = this.getQuickPickTitle();
                quickPick.placeholder = (0, nls_1.localize)('select extensions to install', "Select extensions to install");
                quickPick.canSelectMany = true;
                localExtensionsToInstall.sort((e1, e2) => e1.displayName.localeCompare(e2.displayName));
                quickPick.items = localExtensionsToInstall.map(extension => ({ extension, label: extension.displayName, description: extension.version }));
            }
            else {
                quickPick.hide();
                quickPick.dispose();
                this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: (0, nls_1.localize)('no local extensions', "There are no extensions to install.")
                });
            }
        }
        async onDidAccept(selectedItems) {
            if (selectedItems.length) {
                const localExtensionsToInstall = selectedItems.filter(r => !!r.extension).map(r => r.extension);
                if (localExtensionsToInstall.length) {
                    await this.progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: (0, nls_1.localize)('installing extensions', "Installing Extensions...")
                    }, () => this.installExtensions(localExtensionsToInstall));
                    this.notificationService.info((0, nls_1.localize)('finished installing', "Successfully installed extensions."));
                }
            }
        }
    };
    exports.AbstractInstallExtensionsInServerAction = AbstractInstallExtensionsInServerAction;
    exports.AbstractInstallExtensionsInServerAction = AbstractInstallExtensionsInServerAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, notification_1.INotificationService),
        __param(4, progress_1.IProgressService)
    ], AbstractInstallExtensionsInServerAction);
    let InstallLocalExtensionsInRemoteAction = class InstallLocalExtensionsInRemoteAction extends AbstractInstallExtensionsInServerAction {
        constructor(extensionsWorkbenchService, quickInputService, progressService, notificationService, extensionManagementServerService, extensionGalleryService, instantiationService, fileService, logService) {
            super('workbench.extensions.actions.installLocalExtensionsInRemote', extensionsWorkbenchService, quickInputService, notificationService, progressService);
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.logService = logService;
        }
        get label() {
            if (this.extensionManagementServerService && this.extensionManagementServerService.remoteExtensionManagementServer) {
                return (0, nls_1.localize)('select and install local extensions', "Install Local Extensions in '{0}'...", this.extensionManagementServerService.remoteExtensionManagementServer.label);
            }
            return '';
        }
        getQuickPickTitle() {
            return (0, nls_1.localize)('install local extensions title', "Install Local Extensions in '{0}'", this.extensionManagementServerService.remoteExtensionManagementServer.label);
        }
        getExtensionsToInstall(local) {
            return local.filter(extension => {
                const action = this.instantiationService.createInstance(RemoteInstallAction, true);
                action.extension = extension;
                return action.enabled;
            });
        }
        async installExtensions(localExtensionsToInstall) {
            const galleryExtensions = [];
            const vsixs = [];
            const targetPlatform = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getTargetPlatform();
            await async_1.Promises.settled(localExtensionsToInstall.map(async (extension) => {
                if (this.extensionGalleryService.isEnabled()) {
                    const gallery = (await this.extensionGalleryService.getExtensions([{ ...extension.identifier, preRelease: !!extension.local?.preRelease }], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None))[0];
                    if (gallery) {
                        galleryExtensions.push(gallery);
                        return;
                    }
                }
                const vsix = await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.zip(extension.local);
                vsixs.push(vsix);
            }));
            await async_1.Promises.settled(galleryExtensions.map(gallery => this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.installFromGallery(gallery)));
            try {
                await async_1.Promises.settled(vsixs.map(vsix => this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.install(vsix)));
            }
            finally {
                try {
                    await Promise.allSettled(vsixs.map(vsix => this.fileService.del(vsix)));
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
        }
    };
    exports.InstallLocalExtensionsInRemoteAction = InstallLocalExtensionsInRemoteAction;
    exports.InstallLocalExtensionsInRemoteAction = InstallLocalExtensionsInRemoteAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, quickInput_1.IQuickInputService),
        __param(2, progress_1.IProgressService),
        __param(3, notification_1.INotificationService),
        __param(4, extensionManagement_2.IExtensionManagementServerService),
        __param(5, extensionManagement_1.IExtensionGalleryService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, files_1.IFileService),
        __param(8, log_1.ILogService)
    ], InstallLocalExtensionsInRemoteAction);
    let InstallRemoteExtensionsInLocalAction = class InstallRemoteExtensionsInLocalAction extends AbstractInstallExtensionsInServerAction {
        constructor(id, extensionsWorkbenchService, quickInputService, progressService, notificationService, extensionManagementServerService, extensionGalleryService, fileService, logService) {
            super(id, extensionsWorkbenchService, quickInputService, notificationService, progressService);
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.fileService = fileService;
            this.logService = logService;
        }
        get label() {
            return (0, nls_1.localize)('select and install remote extensions', "Install Remote Extensions Locally...");
        }
        getQuickPickTitle() {
            return (0, nls_1.localize)('install remote extensions', "Install Remote Extensions Locally");
        }
        getExtensionsToInstall(local) {
            return local.filter(extension => extension.type === 1 /* ExtensionType.User */ && extension.server !== this.extensionManagementServerService.localExtensionManagementServer
                && !this.extensionsWorkbenchService.installed.some(e => e.server === this.extensionManagementServerService.localExtensionManagementServer && (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier)));
        }
        async installExtensions(extensions) {
            const galleryExtensions = [];
            const vsixs = [];
            const targetPlatform = await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getTargetPlatform();
            await async_1.Promises.settled(extensions.map(async (extension) => {
                if (this.extensionGalleryService.isEnabled()) {
                    const gallery = (await this.extensionGalleryService.getExtensions([{ ...extension.identifier, preRelease: !!extension.local?.preRelease }], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None))[0];
                    if (gallery) {
                        galleryExtensions.push(gallery);
                        return;
                    }
                }
                const vsix = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.zip(extension.local);
                vsixs.push(vsix);
            }));
            await async_1.Promises.settled(galleryExtensions.map(gallery => this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(gallery)));
            try {
                await async_1.Promises.settled(vsixs.map(vsix => this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.install(vsix)));
            }
            finally {
                try {
                    await Promise.allSettled(vsixs.map(vsix => this.fileService.del(vsix)));
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
        }
    };
    exports.InstallRemoteExtensionsInLocalAction = InstallRemoteExtensionsInLocalAction;
    exports.InstallRemoteExtensionsInLocalAction = InstallRemoteExtensionsInLocalAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, progress_1.IProgressService),
        __param(4, notification_1.INotificationService),
        __param(5, extensionManagement_2.IExtensionManagementServerService),
        __param(6, extensionManagement_1.IExtensionGalleryService),
        __param(7, files_1.IFileService),
        __param(8, log_1.ILogService)
    ], InstallRemoteExtensionsInLocalAction);
    commands_1.CommandsRegistry.registerCommand('workbench.extensions.action.showExtensionsForLanguage', function (accessor, fileExtension) {
        const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
        return paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
            .then(viewlet => viewlet?.getViewPaneContainer())
            .then(viewlet => {
            viewlet.search(`ext:${fileExtension.replace(/^\./, '')}`);
            viewlet.focus();
        });
    });
    exports.showExtensionsWithIdsCommandId = 'workbench.extensions.action.showExtensionsWithIds';
    commands_1.CommandsRegistry.registerCommand(exports.showExtensionsWithIdsCommandId, function (accessor, extensionIds) {
        const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
        return paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
            .then(viewlet => viewlet?.getViewPaneContainer())
            .then(viewlet => {
            const query = extensionIds
                .map(id => `@id:${id}`)
                .join(' ');
            viewlet.search(query);
            viewlet.focus();
        });
    });
    (0, colorRegistry_1.registerColor)('extensionButton.background', {
        dark: colorRegistry_1.buttonBackground,
        light: colorRegistry_1.buttonBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonBackground', "Button background color for extension actions."));
    (0, colorRegistry_1.registerColor)('extensionButton.foreground', {
        dark: colorRegistry_1.buttonForeground,
        light: colorRegistry_1.buttonForeground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonForeground', "Button foreground color for extension actions."));
    (0, colorRegistry_1.registerColor)('extensionButton.hoverBackground', {
        dark: colorRegistry_1.buttonHoverBackground,
        light: colorRegistry_1.buttonHoverBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonHoverBackground', "Button background hover color for extension actions."));
    (0, colorRegistry_1.registerColor)('extensionButton.separator', {
        dark: colorRegistry_1.buttonSeparator,
        light: colorRegistry_1.buttonSeparator,
        hcDark: colorRegistry_1.buttonSeparator,
        hcLight: colorRegistry_1.buttonSeparator
    }, (0, nls_1.localize)('extensionButtonSeparator', "Button separator color for extension actions"));
    exports.extensionButtonProminentBackground = (0, colorRegistry_1.registerColor)('extensionButton.prominentBackground', {
        dark: colorRegistry_1.buttonBackground,
        light: colorRegistry_1.buttonBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonProminentBackground', "Button background color for extension actions that stand out (e.g. install button)."));
    (0, colorRegistry_1.registerColor)('extensionButton.prominentForeground', {
        dark: colorRegistry_1.buttonForeground,
        light: colorRegistry_1.buttonForeground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonProminentForeground', "Button foreground color for extension actions that stand out (e.g. install button)."));
    (0, colorRegistry_1.registerColor)('extensionButton.prominentHoverBackground', {
        dark: colorRegistry_1.buttonHoverBackground,
        light: colorRegistry_1.buttonHoverBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonProminentHoverBackground', "Button background hover color for extension actions that stand out (e.g. install button)."));
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const errorColor = theme.getColor(colorRegistry_1.editorErrorForeground);
        if (errorColor) {
            collector.addRule(`.extension-editor .header .actions-status-container > .status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.errorIcon)} { color: ${errorColor}; }`);
            collector.addRule(`.extension-editor .body .subcontent .runtime-status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.errorIcon)} { color: ${errorColor}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.errorIcon)} { color: ${errorColor}; }`);
        }
        const warningColor = theme.getColor(colorRegistry_1.editorWarningForeground);
        if (warningColor) {
            collector.addRule(`.extension-editor .header .actions-status-container > .status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.warningIcon)} { color: ${warningColor}; }`);
            collector.addRule(`.extension-editor .body .subcontent .runtime-status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.warningIcon)} { color: ${warningColor}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.warningIcon)} { color: ${warningColor}; }`);
        }
        const infoColor = theme.getColor(colorRegistry_1.editorInfoForeground);
        if (infoColor) {
            collector.addRule(`.extension-editor .header .actions-status-container > .status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.infoIcon)} { color: ${infoColor}; }`);
            collector.addRule(`.extension-editor .body .subcontent .runtime-status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.infoIcon)} { color: ${infoColor}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.infoIcon)} { color: ${infoColor}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uc0FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTRtQ2hHLHNEQUdDO0lBcmlDTSxJQUFNLG1DQUFtQyxHQUF6QyxNQUFNLG1DQUFvQyxTQUFRLGdCQUFNO1FBRTlELFlBQ2tCLFNBQXFCLEVBQ3JCLE9BQWUsRUFDZixnQkFBa0MsRUFDbEMsS0FBWSxFQUNLLGNBQStCLEVBQ2hDLGFBQTZCLEVBQ3ZCLG1CQUF5QyxFQUMvQyxhQUE2QixFQUM1QixjQUErQixFQUNuQyxVQUF1QixFQUNELGdDQUFtRSxFQUMvRSxvQkFBMkMsRUFDeEMsY0FBd0MsRUFDN0Isa0NBQXVFO1lBRTdILEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBZmhDLGNBQVMsR0FBVCxTQUFTLENBQVk7WUFDckIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUNmLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDbEMsVUFBSyxHQUFMLEtBQUssQ0FBTztZQUNLLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNoQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDdkIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUMvQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDNUIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ25DLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDRCxxQ0FBZ0MsR0FBaEMsZ0NBQWdDLENBQW1DO1lBQy9FLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDeEMsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQzdCLHVDQUFrQyxHQUFs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