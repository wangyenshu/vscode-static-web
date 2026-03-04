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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/common/contributions", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/workbench/contrib/extensions/browser/extensionEditor", "vs/workbench/contrib/extensions/browser/extensionsViewlet", "vs/platform/configuration/common/configurationRegistry", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/contrib/extensions/common/extensionsFileTemplate", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensionsUtils", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/browser/editor", "vs/base/common/uri", "vs/workbench/contrib/extensions/browser/extensionsActivationProgress", "vs/base/common/errors", "vs/workbench/contrib/extensions/browser/extensionsDependencyChecker", "vs/base/common/cancellation", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/preferences/common/preferences", "vs/platform/contextkey/common/contextkey", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/extensions/browser/extensionsQuickAccess", "vs/workbench/contrib/extensions/browser/extensionRecommendationsService", "vs/workbench/services/userDataSync/common/userDataSync", "vs/editor/contrib/clipboard/browser/clipboard", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/platform/action/common/actionCommonCategories", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService", "vs/workbench/services/extensions/common/extensions", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/workbench/common/contextkeys", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig", "vs/base/common/network", "vs/workbench/contrib/extensions/browser/abstractRuntimeExtensionsEditor", "vs/workbench/contrib/extensions/browser/extensionEnablementWorkspaceTrustTransitionParticipant", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/base/common/labels", "vs/workbench/contrib/extensions/common/extensionQuery", "vs/base/common/async", "vs/workbench/common/editor", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/workbench/contrib/extensions/browser/extensionsCompletionItemsProvider", "vs/platform/quickinput/common/quickInput", "vs/base/common/event", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/extensions/browser/unsupportedExtensionsMigrationContribution", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/storage/common/storage", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/contrib/extensions/browser/deprecatedExtensionsChecker"], function (require, exports, nls_1, platform_1, actions_1, extensions_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, contributions_1, descriptors_1, extensions_2, extensionsActions_1, extensionsInput_1, extensionEditor_1, extensionsViewlet_1, configurationRegistry_1, jsonContributionRegistry, extensionsFileTemplate_1, commands_1, instantiation_1, extensionsUtils_1, extensionManagementUtil_1, editor_1, uri_1, extensionsActivationProgress_1, errors_1, extensionsDependencyChecker_1, cancellation_1, views_1, viewsService_1, clipboardService_1, preferences_1, contextkey_1, quickAccess_1, extensionsQuickAccess_1, extensionRecommendationsService_1, userDataSync_1, clipboard_1, editorService_1, extensionsWorkbenchService_1, actionCommonCategories_1, extensionRecommendations_2, extensionRecommendationNotificationService_1, extensions_3, notification_1, host_1, contextkeys_1, workspaceExtensionsConfig_1, network_1, abstractRuntimeExtensionsEditor_1, extensionEnablementWorkspaceTrustTransitionParticipant_1, extensionsIcons_1, extensions_4, lifecycle_1, configuration_1, dialogs_1, labels_1, extensionQuery_1, async_1, editor_2, workspaceTrust_1, extensionsCompletionItemsProvider_1, quickInput_1, event_1, panecomposite_1, unsupportedExtensionsMigrationContribution_1, platform_2, extensionStorage_1, storage_1, preferences_2, deprecatedExtensionsChecker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CONTEXT_HAS_WEB_SERVER = exports.CONTEXT_HAS_REMOTE_SERVER = exports.CONTEXT_HAS_LOCAL_SERVER = void 0;
    // Singletons
    (0, extensions_1.registerSingleton)(extensions_2.IExtensionsWorkbenchService, extensionsWorkbenchService_1.ExtensionsWorkbenchService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(extensionRecommendations_2.IExtensionRecommendationNotificationService, extensionRecommendationNotificationService_1.ExtensionRecommendationNotificationService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(extensionRecommendations_1.IExtensionRecommendationsService, extensionRecommendationsService_1.ExtensionRecommendationsService, 0 /* InstantiationType.Eager */);
    // Quick Access
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: extensionsQuickAccess_1.ManageExtensionsQuickAccessProvider,
        prefix: extensionsQuickAccess_1.ManageExtensionsQuickAccessProvider.PREFIX,
        placeholder: (0, nls_1.localize)('manageExtensionsQuickAccessPlaceholder', "Press Enter to manage extensions."),
        helpEntries: [{ description: (0, nls_1.localize)('manageExtensionsHelp', "Manage Extensions") }]
    });
    // Editor
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(extensionEditor_1.ExtensionEditor, extensionEditor_1.ExtensionEditor.ID, (0, nls_1.localize)('extension', "Extension")), [
        new descriptors_1.SyncDescriptor(extensionsInput_1.ExtensionsInput)
    ]);
    platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: extensions_2.VIEWLET_ID,
        title: (0, nls_1.localize2)('extensions', "Extensions"),
        openCommandActionDescriptor: {
            id: extensions_2.VIEWLET_ID,
            mnemonicTitle: (0, nls_1.localize)({ key: 'miViewExtensions', comment: ['&& denotes a mnemonic'] }, "E&&xtensions"),
            keybindings: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 54 /* KeyCode.KeyX */ },
            order: 4,
        },
        ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViewlet_1.ExtensionsViewPaneContainer),
        icon: extensionsIcons_1.extensionsViewIcon,
        order: 4,
        rejectAddedViews: true,
        alwaysUseContainerInfo: true,
    }, 0 /* ViewContainerLocation.Sidebar */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        ...extensionManagement_2.extensionsConfigurationNodeBase,
        properties: {
            'extensions.autoUpdate': {
                enum: [true, 'onlyEnabledExtensions', 'onlySelectedExtensions', false,],
                enumItemLabels: [
                    (0, nls_1.localize)('all', "All Extensions"),
                    (0, nls_1.localize)('enabled', "Only Enabled Extensions"),
                    (0, nls_1.localize)('selected', "Only Selected Extensions"),
                    (0, nls_1.localize)('none', "None"),
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('extensions.autoUpdate.true', 'Download and install updates automatically for all extensions except for those updates are ignored.'),
                    (0, nls_1.localize)('extensions.autoUpdate.enabled', 'Download and install updates automatically only for enabled extensions except for those updates are ignored. Disabled extensions are not updated automatically.'),
                    (0, nls_1.localize)('extensions.autoUpdate.selected', 'Download and install updates automatically only for selected extensions.'),
                    (0, nls_1.localize)('extensions.autoUpdate.false', 'Extensions are not automatically updated.'),
                ],
                description: (0, nls_1.localize)('extensions.autoUpdate', "Controls the automatic update behavior of extensions. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* ConfigurationScope.APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.autoCheckUpdates': {
                type: 'boolean',
                description: (0, nls_1.localize)('extensionsCheckUpdates', "When enabled, automatically checks extensions for updates. If an extension has an update, it is marked as outdated in the Extensions view. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* ConfigurationScope.APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.ignoreRecommendations': {
                type: 'boolean',
                description: (0, nls_1.localize)('extensionsIgnoreRecommendations', "When enabled, the notifications for extension recommendations will not be shown."),
                default: false
            },
            'extensions.showRecommendationsOnlyOnDemand': {
                type: 'boolean',
                deprecationMessage: (0, nls_1.localize)('extensionsShowRecommendationsOnlyOnDemand_Deprecated', "This setting is deprecated. Use extensions.ignoreRecommendations setting to control recommendation notifications. Use Extensions view's visibility actions to hide Recommended view by default."),
                default: false,
                tags: ['usesOnlineServices']
            },
            'extensions.closeExtensionDetailsOnViewChange': {
                type: 'boolean',
                description: (0, nls_1.localize)('extensionsCloseExtensionDetailsOnViewChange', "When enabled, editors with extension details will be automatically closed upon navigating away from the Extensions View."),
                default: false
            },
            'extensions.confirmedUriHandlerExtensionIds': {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: (0, nls_1.localize)('handleUriConfirmedExtensions', "When an extension is listed here, a confirmation prompt will not be shown when that extension handles a URI."),
                default: [],
                scope: 1 /* ConfigurationScope.APPLICATION */
            },
            'extensions.webWorker': {
                type: ['boolean', 'string'],
                enum: [true, false, 'auto'],
                enumDescriptions: [
                    (0, nls_1.localize)('extensionsWebWorker.true', "The Web Worker Extension Host will always be launched."),
                    (0, nls_1.localize)('extensionsWebWorker.false', "The Web Worker Extension Host will never be launched."),
                    (0, nls_1.localize)('extensionsWebWorker.auto', "The Web Worker Extension Host will be launched when a web extension needs it."),
                ],
                description: (0, nls_1.localize)('extensionsWebWorker', "Enable web worker extension host."),
                default: 'auto'
            },
            'extensions.supportVirtualWorkspaces': {
                type: 'object',
                markdownDescription: (0, nls_1.localize)('extensions.supportVirtualWorkspaces', "Override the virtual workspaces support of an extension."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$': {
                        type: 'boolean',
                        default: false
                    }
                },
                additionalProperties: false,
                default: {},
                defaultSnippets: [{
                        'body': {
                            'pub.name': false
                        }
                    }]
            },
            'extensions.experimental.affinity': {
                type: 'object',
                markdownDescription: (0, nls_1.localize)('extensions.affinity', "Configure an extension to execute in a different extension host process."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$': {
                        type: 'integer',
                        default: 1
                    }
                },
                additionalProperties: false,
                default: {},
                defaultSnippets: [{
                        'body': {
                            'pub.name': 1
                        }
                    }]
            },
            [workspaceTrust_1.WORKSPACE_TRUST_EXTENSION_SUPPORT]: {
                type: 'object',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                markdownDescription: (0, nls_1.localize)('extensions.supportUntrustedWorkspaces', "Override the untrusted workspace support of an extension. Extensions using `true` will always be enabled. Extensions using `limited` will always be enabled, and the extension will hide functionality that requires trust. Extensions using `false` will only be enabled only when the workspace is trusted."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$': {
                        type: 'object',
                        properties: {
                            'supported': {
                                type: ['boolean', 'string'],
                                enum: [true, false, 'limited'],
                                enumDescriptions: [
                                    (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.true', "Extension will always be enabled."),
                                    (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.false', "Extension will only be enabled only when the workspace is trusted."),
                                    (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.limited', "Extension will always be enabled, and the extension will hide functionality requiring trust."),
                                ],
                                description: (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.supported', "Defines the untrusted workspace support setting for the extension."),
                            },
                            'version': {
                                type: 'string',
                                description: (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.version', "Defines the version of the extension for which the override should be applied. If not specified, the override will be applied independent of the extension version."),
                            }
                        }
                    }
                }
            },
            'extensions.experimental.deferredStartupFinishedActivation': {
                type: 'boolean',
                description: (0, nls_1.localize)('extensionsDeferredStartupFinishedActivation', "When enabled, extensions which declare the `onStartupFinished` activation event will be activated after a timeout."),
                default: false
            },
            'extensions.experimental.issueQuickAccess': {
                type: 'boolean',
                description: (0, nls_1.localize)('extensionsInQuickAccess', "When enabled, extensions can be searched for via Quick Access and report issues from there."),
                default: true
            }
        }
    });
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry.Extensions.JSONContribution);
    jsonRegistry.registerSchema(extensionsFileTemplate_1.ExtensionsConfigurationSchemaId, extensionsFileTemplate_1.ExtensionsConfigurationSchema);
    // Register Commands
    commands_1.CommandsRegistry.registerCommand('_extensions.manage', (accessor, extensionId, tab, preserveFocus, feature) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        const extension = extensionService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }));
        if (extension) {
            extensionService.open(extension, { tab, preserveFocus, feature });
        }
        else {
            throw new Error((0, nls_1.localize)('notFound', "Extension '{0}' not found.", extensionId));
        }
    });
    commands_1.CommandsRegistry.registerCommand('extension.open', async (accessor, extensionId, tab, preserveFocus, feature) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        const commandService = accessor.get(commands_1.ICommandService);
        const [extension] = await extensionService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None);
        if (extension) {
            return extensionService.open(extension, { tab, preserveFocus, feature });
        }
        return commandService.executeCommand('_extensions.manage', extensionId, tab, preserveFocus, feature);
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.installExtension',
        metadata: {
            description: (0, nls_1.localize)('workbench.extensions.installExtension.description', "Install the given extension"),
            args: [
                {
                    name: 'extensionIdOrVSIXUri',
                    description: (0, nls_1.localize)('workbench.extensions.installExtension.arg.decription', "Extension id or VSIX resource uri"),
                    constraint: (value) => typeof value === 'string' || value instanceof uri_1.URI,
                },
                {
                    name: 'options',
                    description: '(optional) Options for installing the extension. Object with the following properties: ' +
                        '`installOnlyNewlyAddedFromExtensionPackVSIX`: When enabled, VS Code installs only newly added extensions from the extension pack VSIX. This option is considered only when installing VSIX. ',
                    isOptional: true,
                    schema: {
                        'type': 'object',
                        'properties': {
                            'installOnlyNewlyAddedFromExtensionPackVSIX': {
                                'type': 'boolean',
                                'description': (0, nls_1.localize)('workbench.extensions.installExtension.option.installOnlyNewlyAddedFromExtensionPackVSIX', "When enabled, VS Code installs only newly added extensions from the extension pack VSIX. This option is considered only while installing a VSIX."),
                                default: false
                            },
                            'installPreReleaseVersion': {
                                'type': 'boolean',
                                'description': (0, nls_1.localize)('workbench.extensions.installExtension.option.installPreReleaseVersion', "When enabled, VS Code installs the pre-release version of the extension if available."),
                                default: false
                            },
                            'donotSync': {
                                'type': 'boolean',
                                'description': (0, nls_1.localize)('workbench.extensions.installExtension.option.donotSync', "When enabled, VS Code do not sync this extension when Settings Sync is on."),
                                default: false
                            },
                            'justification': {
                                'type': ['string', 'object'],
                                'description': (0, nls_1.localize)('workbench.extensions.installExtension.option.justification', "Justification for installing the extension. This is a string or an object that can be used to pass any information to the installation handlers. i.e. `{reason: 'This extension wants to open a URI', action: 'Open URI'}` will show a message box with the reason and action upon install."),
                            },
                            'enable': {
                                'type': 'boolean',
                                'description': (0, nls_1.localize)('workbench.extensions.installExtension.option.enable', "When enabled, the extension will be enabled if it is installed but disabled. If the extension is already enabled, this has no effect."),
                                default: false
                            },
                            'context': {
                                'type': 'object',
                                'description': (0, nls_1.localize)('workbench.extensions.installExtension.option.context', "Context for the installation. This is a JSON object that can be used to pass any information to the installation handlers. i.e. `{skipWalkthrough: true}` will skip opening the walkthrough upon install."),
                            }
                        }
                    }
                }
            ]
        },
        handler: async (accessor, arg, options) => {
            const extensionsWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
            const extensionManagementService = accessor.get(extensionManagement_2.IWorkbenchExtensionManagementService);
            const extensionGalleryService = accessor.get(extensionManagement_1.IExtensionGalleryService);
            try {
                if (typeof arg === 'string') {
                    const [id, version] = (0, extensionManagementUtil_1.getIdAndVersion)(arg);
                    const extension = extensionsWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id, uuid: version }));
                    if (extension?.enablementState === 1 /* EnablementState.DisabledByExtensionKind */) {
                        const [gallery] = await extensionGalleryService.getExtensions([{ id, preRelease: options?.installPreReleaseVersion }], cancellation_1.CancellationToken.None);
                        if (!gallery) {
                            throw new Error((0, nls_1.localize)('notFound', "Extension '{0}' not found.", arg));
                        }
                        await extensionManagementService.installFromGallery(gallery, {
                            isMachineScoped: options?.donotSync ? true : undefined, /* do not allow syncing extensions automatically while installing through the command */
                            installPreReleaseVersion: options?.installPreReleaseVersion,
                            installGivenVersion: !!version,
                            context: options?.context
                        });
                    }
                    else {
                        await extensionsWorkbenchService.install(arg, {
                            version,
                            installPreReleaseVersion: options?.installPreReleaseVersion,
                            context: options?.context,
                            justification: options?.justification,
                            enable: options?.enable,
                            isMachineScoped: options?.donotSync ? true : undefined, /* do not allow syncing extensions automatically while installing through the command */
                        }, 15 /* ProgressLocation.Notification */);
                    }
                }
                else {
                    const vsix = uri_1.URI.revive(arg);
                    await extensionsWorkbenchService.install(vsix, { installOnlyNewlyAddedFromExtensionPack: options?.installOnlyNewlyAddedFromExtensionPackVSIX });
                }
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
                throw e;
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.uninstallExtension',
        metadata: {
            description: (0, nls_1.localize)('workbench.extensions.uninstallExtension.description', "Uninstall the given extension"),
            args: [
                {
                    name: (0, nls_1.localize)('workbench.extensions.uninstallExtension.arg.name', "Id of the extension to uninstall"),
                    schema: {
                        'type': 'string'
                    }
                }
            ]
        },
        handler: async (accessor, id) => {
            if (!id) {
                throw new Error((0, nls_1.localize)('id required', "Extension id required."));
            }
            const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
            const installed = await extensionManagementService.getInstalled();
            const [extensionToUninstall] = installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
            if (!extensionToUninstall) {
                throw new Error((0, nls_1.localize)('notInstalled', "Extension '{0}' is not installed. Make sure you use the full extension ID, including the publisher, e.g.: ms-dotnettools.csharp.", id));
            }
            if (extensionToUninstall.isBuiltin) {
                throw new Error((0, nls_1.localize)('builtin', "Extension '{0}' is a Built-in extension and cannot be installed", id));
            }
            try {
                await extensionManagementService.uninstall(extensionToUninstall);
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
                throw e;
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.search',
        metadata: {
            description: (0, nls_1.localize)('workbench.extensions.search.description', "Search for a specific extension"),
            args: [
                {
                    name: (0, nls_1.localize)('workbench.extensions.search.arg.name', "Query to use in search"),
                    schema: { 'type': 'string' }
                }
            ]
        },
        handler: async (accessor, query = '') => {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = await paneCompositeService.openPaneComposite(extensions_2.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            if (!viewlet) {
                return;
            }
            viewlet.getViewPaneContainer().search(query);
            viewlet.focus();
        }
    });
    function overrideActionForActiveExtensionEditorWebview(command, f) {
        command?.addImplementation(105, 'extensions-editor', (accessor) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = editorService.activeEditorPane;
            if (editor instanceof extensionEditor_1.ExtensionEditor) {
                if (editor.activeWebview?.isFocused) {
                    f(editor.activeWebview);
                    return true;
                }
            }
            return false;
        });
    }
    overrideActionForActiveExtensionEditorWebview(clipboard_1.CopyAction, webview => webview.copy());
    overrideActionForActiveExtensionEditorWebview(clipboard_1.CutAction, webview => webview.cut());
    overrideActionForActiveExtensionEditorWebview(clipboard_1.PasteAction, webview => webview.paste());
    // Contexts
    exports.CONTEXT_HAS_LOCAL_SERVER = new contextkey_1.RawContextKey('hasLocalServer', false);
    exports.CONTEXT_HAS_REMOTE_SERVER = new contextkey_1.RawContextKey('hasRemoteServer', false);
    exports.CONTEXT_HAS_WEB_SERVER = new contextkey_1.RawContextKey('hasWebServer', false);
    async function runAction(action) {
        try {
            await action.run();
        }
        finally {
            if ((0, lifecycle_1.isDisposable)(action)) {
                action.dispose();
            }
        }
    }
    let ExtensionsContributions = class ExtensionsContributions extends lifecycle_1.Disposable {
        constructor(extensionManagementServerService, extensionGalleryService, contextKeyService, paneCompositeService, extensionsWorkbenchService, extensionEnablementService, instantiationService, dialogService, commandService) {
            super();
            this.extensionManagementServerService = extensionManagementServerService;
            this.paneCompositeService = paneCompositeService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.instantiationService = instantiationService;
            this.dialogService = dialogService;
            this.commandService = commandService;
            const hasGalleryContext = extensions_2.CONTEXT_HAS_GALLERY.bindTo(contextKeyService);
            if (extensionGalleryService.isEnabled()) {
                hasGalleryContext.set(true);
            }
            const hasLocalServerContext = exports.CONTEXT_HAS_LOCAL_SERVER.bindTo(contextKeyService);
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                hasLocalServerContext.set(true);
            }
            const hasRemoteServerContext = exports.CONTEXT_HAS_REMOTE_SERVER.bindTo(contextKeyService);
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                hasRemoteServerContext.set(true);
            }
            const hasWebServerContext = exports.CONTEXT_HAS_WEB_SERVER.bindTo(contextKeyService);
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                hasWebServerContext.set(true);
            }
            this.registerGlobalActions();
            this.registerContextMenuActions();
            this.registerQuickAccessProvider();
        }
        registerQuickAccessProvider() {
            if (this.extensionManagementServerService.localExtensionManagementServer
                || this.extensionManagementServerService.remoteExtensionManagementServer
                || this.extensionManagementServerService.webExtensionManagementServer) {
                platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
                    ctor: extensionsQuickAccess_1.InstallExtensionQuickAccessProvider,
                    prefix: extensionsQuickAccess_1.InstallExtensionQuickAccessProvider.PREFIX,
                    placeholder: (0, nls_1.localize)('installExtensionQuickAccessPlaceholder', "Type the name of an extension to install or search."),
                    helpEntries: [{ description: (0, nls_1.localize)('installExtensionQuickAccessHelp', "Install or Search Extensions") }]
                });
            }
        }
        // Global actions
        registerGlobalActions() {
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
                command: {
                    id: extensions_2.VIEWLET_ID,
                    title: (0, nls_1.localize)({ key: 'miPreferencesExtensions', comment: ['&& denotes a mnemonic'] }, "&&Extensions")
                },
                group: '2_configuration',
                order: 3
            }));
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                command: {
                    id: extensions_2.VIEWLET_ID,
                    title: (0, nls_1.localize)('showExtensions', "Extensions")
                },
                group: '2_configuration',
                order: 3
            }));
            this.registerExtensionAction({
                id: 'workbench.extensions.action.focusExtensionsView',
                title: (0, nls_1.localize2)('focusExtensions', 'Focus on Extensions View'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                f1: true,
                run: async (accessor) => {
                    await accessor.get(panecomposite_1.IPaneCompositePartService).openPaneComposite(extensions_2.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.installExtensions',
                title: (0, nls_1.localize2)('installExtensions', 'Install Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(extensions_2.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                },
                run: async (accessor) => {
                    accessor.get(viewsService_1.IViewsService).openViewContainer(extensions_2.VIEWLET_ID, true);
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showRecommendedKeymapExtensions',
                title: (0, nls_1.localize2)('showRecommendedKeymapExtensionsShort', 'Keymaps'),
                category: extensionManagement_1.PreferencesLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: extensions_2.CONTEXT_HAS_GALLERY
                    }, {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(preferences_2.CONTEXT_KEYBINDINGS_EDITOR, extensions_2.CONTEXT_HAS_GALLERY),
                        group: '2_keyboard_discover_actions'
                    }],
                menuTitles: {
                    [actions_1.MenuId.EditorTitle.id]: (0, nls_1.localize)('importKeyboardShortcutsFroms', "Migrate Keyboard Shortcuts from...")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@recommended:keymaps '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showLanguageExtensions',
                title: (0, nls_1.localize2)('showLanguageExtensionsShort', 'Language Extensions'),
                category: extensionManagement_1.PreferencesLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: extensions_2.CONTEXT_HAS_GALLERY
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@recommended:languages '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.checkForUpdates',
                title: (0, nls_1.localize2)('checkForUpdates', 'Check for Extension Updates'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.and(extensions_2.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID), extensions_2.CONTEXT_HAS_GALLERY),
                        group: '1_updates',
                        order: 1
                    }],
                run: async () => {
                    await this.extensionsWorkbenchService.checkForUpdates();
                    const outdated = this.extensionsWorkbenchService.outdated;
                    if (outdated.length) {
                        return runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@outdated '));
                    }
                    else {
                        return this.dialogService.info((0, nls_1.localize)('noUpdatesAvailable', "All extensions are up to date."));
                    }
                }
            });
            const autoUpdateExtensionsSubMenu = new actions_1.MenuId('autoUpdateExtensionsSubMenu');
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
                submenu: autoUpdateExtensionsSubMenu,
                title: (0, nls_1.localize)('configure auto updating extensions', "Auto Update Extensions"),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID), extensions_2.CONTEXT_HAS_GALLERY),
                group: '1_updates',
                order: 5,
            });
            this.registerExtensionAction({
                id: 'configureExtensionsAutoUpdate.all',
                title: (0, nls_1.localize)('configureExtensionsAutoUpdate.all', "All Extensions"),
                toggled: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${extensions_2.AutoUpdateConfigurationKey}`), contextkey_1.ContextKeyExpr.notEquals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlyEnabledExtensions'), contextkey_1.ContextKeyExpr.notEquals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlySelectedExtensions')),
                menu: [{
                        id: autoUpdateExtensionsSubMenu,
                        order: 1,
                    }],
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, true)
            });
            this.registerExtensionAction({
                id: 'configureExtensionsAutoUpdate.enabled',
                title: (0, nls_1.localize)('configureExtensionsAutoUpdate.enabled', "Enabled Extensions"),
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlyEnabledExtensions'),
                menu: [{
                        id: autoUpdateExtensionsSubMenu,
                        order: 2,
                    }],
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, 'onlyEnabledExtensions')
            });
            this.registerExtensionAction({
                id: 'configureExtensionsAutoUpdate.selected',
                title: (0, nls_1.localize)('configureExtensionsAutoUpdate.selected', "Selected Extensions"),
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlySelectedExtensions'),
                menu: [{
                        id: autoUpdateExtensionsSubMenu,
                        order: 2,
                    }],
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, 'onlySelectedExtensions')
            });
            this.registerExtensionAction({
                id: 'configureExtensionsAutoUpdate.none',
                title: (0, nls_1.localize)('configureExtensionsAutoUpdate.none', "None"),
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, false),
                menu: [{
                        id: autoUpdateExtensionsSubMenu,
                        order: 3,
                    }],
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, false)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.updateAllExtensions',
                title: (0, nls_1.localize2)('updateAll', 'Update All Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                precondition: extensions_2.HasOutdatedExtensionsContext,
                menu: [
                    {
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.and(extensions_2.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.has(`config.${extensions_2.AutoUpdateConfigurationKey}`).negate(), contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlyEnabledExtensions'))),
                        group: '1_updates',
                        order: 2
                    }, {
                        id: actions_1.MenuId.ViewTitle,
                        when: contextkey_1.ContextKeyExpr.equals('view', extensions_2.OUTDATED_EXTENSIONS_VIEW_ID),
                        group: 'navigation',
                        order: 1
                    }
                ],
                icon: extensionsIcons_1.installWorkspaceRecommendedIcon,
                run: async () => {
                    const outdated = this.extensionsWorkbenchService.outdated;
                    const results = await this.extensionsWorkbenchService.updateAll();
                    results.forEach((result) => {
                        if (result.error) {
                            const extension = outdated.find((extension) => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, result.identifier));
                            if (extension) {
                                runAction(this.instantiationService.createInstance(extensionsActions_1.PromptExtensionInstallFailureAction, extension, extension.latestVersion, 3 /* InstallOperation.Update */, result.error));
                            }
                        }
                    });
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.disableAutoUpdate',
                title: (0, nls_1.localize2)('disableAutoUpdate', 'Disable Auto Update for All Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                f1: true,
                precondition: extensions_2.CONTEXT_HAS_GALLERY,
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, false)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.enableAutoUpdate',
                title: (0, nls_1.localize2)('enableAutoUpdate', 'Enable Auto Update for All Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                f1: true,
                precondition: extensions_2.CONTEXT_HAS_GALLERY,
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, true)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.enableAll',
                title: (0, nls_1.localize2)('enableAll', 'Enable All Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                        group: '2_enablement',
                        order: 1
                    }],
                run: async () => {
                    const extensionsToEnable = this.extensionsWorkbenchService.local.filter(e => !!e.local && this.extensionEnablementService.canChangeEnablement(e.local) && !this.extensionEnablementService.isEnabled(e.local));
                    if (extensionsToEnable.length) {
                        await this.extensionsWorkbenchService.setEnablement(extensionsToEnable, 8 /* EnablementState.EnabledGlobally */);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.enableAllWorkspace',
                title: (0, nls_1.localize2)('enableAllWorkspace', 'Enable All Extensions for this Workspace'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                },
                run: async () => {
                    const extensionsToEnable = this.extensionsWorkbenchService.local.filter(e => !!e.local && this.extensionEnablementService.canChangeEnablement(e.local) && !this.extensionEnablementService.isEnabled(e.local));
                    if (extensionsToEnable.length) {
                        await this.extensionsWorkbenchService.setEnablement(extensionsToEnable, 9 /* EnablementState.EnabledWorkspace */);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.disableAll',
                title: (0, nls_1.localize2)('disableAll', 'Disable All Installed Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                        group: '2_enablement',
                        order: 2
                    }],
                run: async () => {
                    const extensionsToDisable = this.extensionsWorkbenchService.local.filter(e => !e.isBuiltin && !!e.local && this.extensionEnablementService.isEnabled(e.local) && this.extensionEnablementService.canChangeEnablement(e.local));
                    if (extensionsToDisable.length) {
                        await this.extensionsWorkbenchService.setEnablement(extensionsToDisable, 6 /* EnablementState.DisabledGlobally */);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.disableAllWorkspace',
                title: (0, nls_1.localize2)('disableAllWorkspace', 'Disable All Installed Extensions for this Workspace'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                },
                run: async () => {
                    const extensionsToDisable = this.extensionsWorkbenchService.local.filter(e => !e.isBuiltin && !!e.local && this.extensionEnablementService.isEnabled(e.local) && this.extensionEnablementService.canChangeEnablement(e.local));
                    if (extensionsToDisable.length) {
                        await this.extensionsWorkbenchService.setEnablement(extensionsToDisable, 7 /* EnablementState.DisabledWorkspace */);
                    }
                }
            });
            this.registerExtensionAction({
                id: extensions_2.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID,
                title: (0, nls_1.localize2)('InstallFromVSIX', 'Install from VSIX...'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER)
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID), contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER)),
                        group: '3_install',
                        order: 1
                    }],
                run: async (accessor) => {
                    const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                    const commandService = accessor.get(commands_1.ICommandService);
                    const vsixPaths = await fileDialogService.showOpenDialog({
                        title: (0, nls_1.localize)('installFromVSIX', "Install from VSIX"),
                        filters: [{ name: 'VSIX Extensions', extensions: ['vsix'] }],
                        canSelectFiles: true,
                        canSelectMany: true,
                        openLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'installButton', comment: ['&& denotes a mnemonic'] }, "&&Install"))
                    });
                    if (vsixPaths) {
                        await commandService.executeCommand(extensions_2.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID, vsixPaths);
                    }
                }
            });
            this.registerExtensionAction({
                id: extensions_2.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID,
                title: (0, nls_1.localize)('installVSIX', "Install Extension VSIX"),
                menu: [{
                        id: actions_1.MenuId.ExplorerContext,
                        group: 'extensions',
                        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Extension.isEqualTo('.vsix'), contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER)),
                    }],
                run: async (accessor, resources) => {
                    const extensionService = accessor.get(extensions_3.IExtensionService);
                    const extensionsWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const hostService = accessor.get(host_1.IHostService);
                    const notificationService = accessor.get(notification_1.INotificationService);
                    const extensions = Array.isArray(resources) ? resources : [resources];
                    await async_1.Promises.settled(extensions.map(async (vsix) => await extensionsWorkbenchService.install(vsix)))
                        .then(async (extensions) => {
                        for (const extension of extensions) {
                            const requireReload = !(extension.local && extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension.local)));
                            const message = requireReload ? (0, nls_1.localize)('InstallVSIXAction.successReload', "Completed installing {0} extension from VSIX. Please reload Visual Studio Code to enable it.", extension.displayName || extension.name)
                                : (0, nls_1.localize)('InstallVSIXAction.success', "Completed installing {0} extension from VSIX.", extension.displayName || extension.name);
                            const actions = requireReload ? [{
                                    label: (0, nls_1.localize)('InstallVSIXAction.reloadNow', "Reload Now"),
                                    run: () => hostService.reload()
                                }] : [];
                            notificationService.prompt(notification_1.Severity.Info, message, actions);
                        }
                    });
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.installExtensionFromLocation',
                title: (0, nls_1.localize2)('installExtensionFromLocation', 'Install Extension from Location...'),
                category: actionCommonCategories_1.Categories.Developer,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_WEB_SERVER, exports.CONTEXT_HAS_LOCAL_SERVER)
                    }],
                run: async (accessor) => {
                    const extensionManagementService = accessor.get(extensionManagement_2.IWorkbenchExtensionManagementService);
                    if (platform_2.isWeb) {
                        return new Promise((c, e) => {
                            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                            const disposables = new lifecycle_1.DisposableStore();
                            const quickPick = disposables.add(quickInputService.createQuickPick());
                            quickPick.title = (0, nls_1.localize)('installFromLocation', "Install Extension from Location");
                            quickPick.customButton = true;
                            quickPick.customLabel = (0, nls_1.localize)('install button', "Install");
                            quickPick.placeholder = (0, nls_1.localize)('installFromLocationPlaceHolder', "Location of the web extension");
                            quickPick.ignoreFocusOut = true;
                            disposables.add(event_1.Event.any(quickPick.onDidAccept, quickPick.onDidCustom)(async () => {
                                quickPick.hide();
                                if (quickPick.value) {
                                    try {
                                        await extensionManagementService.installFromLocation(uri_1.URI.parse(quickPick.value));
                                    }
                                    catch (error) {
                                        e(error);
                                        return;
                                    }
                                }
                                c();
                            }));
                            disposables.add(quickPick.onDidHide(() => disposables.dispose()));
                            quickPick.show();
                        });
                    }
                    else {
                        const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                        const extensionLocation = await fileDialogService.showOpenDialog({
                            canSelectFolders: true,
                            canSelectFiles: false,
                            canSelectMany: false,
                            title: (0, nls_1.localize)('installFromLocation', "Install Extension from Location"),
                        });
                        if (extensionLocation?.[0]) {
                            await extensionManagementService.installFromLocation(extensionLocation[0]);
                        }
                    }
                }
            });
            const extensionsFilterSubMenu = new actions_1.MenuId('extensionsFilterSubMenu');
            actions_1.MenuRegistry.appendMenuItem(extensions_2.extensionsSearchActionsMenu, {
                submenu: extensionsFilterSubMenu,
                title: (0, nls_1.localize)('filterExtensions', "Filter Extensions..."),
                group: 'navigation',
                order: 2,
                icon: extensionsIcons_1.filterIcon,
            });
            const showFeaturedExtensionsId = 'extensions.filter.featured';
            this.registerExtensionAction({
                id: showFeaturedExtensionsId,
                title: (0, nls_1.localize2)('showFeaturedExtensions', 'Show Featured Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: extensions_2.CONTEXT_HAS_GALLERY
                    }, {
                        id: extensionsFilterSubMenu,
                        when: extensions_2.CONTEXT_HAS_GALLERY,
                        group: '1_predefined',
                        order: 1,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('featured filter', "Featured")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@featured '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showPopularExtensions',
                title: (0, nls_1.localize2)('showPopularExtensions', 'Show Popular Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: extensions_2.CONTEXT_HAS_GALLERY
                    }, {
                        id: extensionsFilterSubMenu,
                        when: extensions_2.CONTEXT_HAS_GALLERY,
                        group: '1_predefined',
                        order: 2,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('most popular filter', "Most Popular")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@popular '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showRecommendedExtensions',
                title: (0, nls_1.localize2)('showRecommendedExtensions', 'Show Recommended Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: extensions_2.CONTEXT_HAS_GALLERY
                    }, {
                        id: extensionsFilterSubMenu,
                        when: extensions_2.CONTEXT_HAS_GALLERY,
                        group: '1_predefined',
                        order: 2,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('most popular recommended', "Recommended")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@recommended '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.recentlyPublishedExtensions',
                title: (0, nls_1.localize2)('recentlyPublishedExtensions', 'Show Recently Published Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: extensions_2.CONTEXT_HAS_GALLERY
                    }, {
                        id: extensionsFilterSubMenu,
                        when: extensions_2.CONTEXT_HAS_GALLERY,
                        group: '1_predefined',
                        order: 2,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('recently published filter', "Recently Published")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@recentlyPublished '))
            });
            const extensionsCategoryFilterSubMenu = new actions_1.MenuId('extensionsCategoryFilterSubMenu');
            actions_1.MenuRegistry.appendMenuItem(extensionsFilterSubMenu, {
                submenu: extensionsCategoryFilterSubMenu,
                title: (0, nls_1.localize)('filter by category', "Category"),
                when: extensions_2.CONTEXT_HAS_GALLERY,
                group: '2_categories',
                order: 1,
            });
            extensions_4.EXTENSION_CATEGORIES.forEach((category, index) => {
                this.registerExtensionAction({
                    id: `extensions.actions.searchByCategory.${category}`,
                    title: category,
                    menu: [{
                            id: extensionsCategoryFilterSubMenu,
                            when: extensions_2.CONTEXT_HAS_GALLERY,
                            order: index,
                        }],
                    run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, `@category:"${category.toLowerCase()}"`))
                });
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.listBuiltInExtensions',
                title: (0, nls_1.localize2)('showBuiltInExtensions', 'Show Built-in Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 2,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('builtin filter', "Built-in")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@builtin '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.extensionUpdates',
                title: (0, nls_1.localize2)('extensionUpdates', 'Show Extension Updates'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                precondition: extensions_2.CONTEXT_HAS_GALLERY,
                f1: true,
                menu: [{
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        when: extensions_2.CONTEXT_HAS_GALLERY,
                        order: 1,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('extension updates filter', "Updates")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@updates'))
            });
            this.registerExtensionAction({
                id: extensions_2.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID,
                title: (0, nls_1.localize2)('showWorkspaceUnsupportedExtensions', 'Show Extensions Unsupported By Workspace'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER),
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 5,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER),
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('workspace unsupported filter', "Workspace Unsupported")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@workspaceUnsupported'))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showEnabledExtensions',
                title: (0, nls_1.localize2)('showEnabledExtensions', 'Show Enabled Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 3,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('enabled filter', "Enabled")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@enabled '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showDisabledExtensions',
                title: (0, nls_1.localize2)('showDisabledExtensions', 'Show Disabled Extensions'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 4,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('disabled filter', "Disabled")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@disabled '))
            });
            const extensionsSortSubMenu = new actions_1.MenuId('extensionsSortSubMenu');
            actions_1.MenuRegistry.appendMenuItem(extensionsFilterSubMenu, {
                submenu: extensionsSortSubMenu,
                title: (0, nls_1.localize)('sorty by', "Sort By"),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(extensions_2.CONTEXT_HAS_GALLERY, extensionsViewlet_1.DefaultViewsContext)),
                group: '4_sort',
                order: 1,
            });
            [
                { id: 'installs', title: (0, nls_1.localize)('sort by installs', "Install Count"), precondition: extensionsViewlet_1.BuiltInExtensionsContext.negate() },
                { id: 'rating', title: (0, nls_1.localize)('sort by rating', "Rating"), precondition: extensionsViewlet_1.BuiltInExtensionsContext.negate() },
                { id: 'name', title: (0, nls_1.localize)('sort by name', "Name"), precondition: extensionsViewlet_1.BuiltInExtensionsContext.negate() },
                { id: 'publishedDate', title: (0, nls_1.localize)('sort by published date', "Published Date"), precondition: extensionsViewlet_1.BuiltInExtensionsContext.negate() },
                { id: 'updateDate', title: (0, nls_1.localize)('sort by update date', "Updated Date"), precondition: contextkey_1.ContextKeyExpr.and(extensionsViewlet_1.SearchMarketplaceExtensionsContext.negate(), extensionsViewlet_1.RecommendedExtensionsContext.negate(), extensionsViewlet_1.BuiltInExtensionsContext.negate()) },
            ].map(({ id, title, precondition }, index) => {
                this.registerExtensionAction({
                    id: `extensions.sort.${id}`,
                    title,
                    precondition: precondition,
                    menu: [{
                            id: extensionsSortSubMenu,
                            when: contextkey_1.ContextKeyExpr.or(extensions_2.CONTEXT_HAS_GALLERY, extensionsViewlet_1.DefaultViewsContext),
                            order: index,
                        }],
                    toggled: extensionsViewlet_1.ExtensionsSortByContext.isEqualTo(id),
                    run: async () => {
                        const viewlet = await this.paneCompositeService.openPaneComposite(extensions_2.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
                        const extensionsViewPaneContainer = viewlet?.getViewPaneContainer();
                        const currentQuery = extensionQuery_1.Query.parse(extensionsViewPaneContainer.searchValue || '');
                        extensionsViewPaneContainer.search(new extensionQuery_1.Query(currentQuery.value, id).toString());
                        extensionsViewPaneContainer.focus();
                    }
                });
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.clearExtensionsSearchResults',
                title: (0, nls_1.localize2)('clearExtensionsSearchResults', 'Clear Extensions Search Results'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                icon: extensionsIcons_1.clearSearchResultsIcon,
                f1: true,
                precondition: extensionsViewlet_1.SearchHasTextContext,
                menu: {
                    id: extensions_2.extensionsSearchActionsMenu,
                    group: 'navigation',
                    order: 1,
                },
                run: async (accessor) => {
                    const viewPaneContainer = accessor.get(viewsService_1.IViewsService).getActiveViewPaneContainerWithId(extensions_2.VIEWLET_ID);
                    if (viewPaneContainer) {
                        const extensionsViewPaneContainer = viewPaneContainer;
                        extensionsViewPaneContainer.search('');
                        extensionsViewPaneContainer.focus();
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.refreshExtension',
                title: (0, nls_1.localize2)('refreshExtension', 'Refresh'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                icon: extensionsIcons_1.refreshIcon,
                f1: true,
                menu: {
                    id: actions_1.MenuId.ViewContainerTitle,
                    when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                    group: 'navigation',
                    order: 2
                },
                run: async (accessor) => {
                    const viewPaneContainer = accessor.get(viewsService_1.IViewsService).getActiveViewPaneContainerWithId(extensions_2.VIEWLET_ID);
                    if (viewPaneContainer) {
                        await viewPaneContainer.refresh();
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.installWorkspaceRecommendedExtensions',
                title: (0, nls_1.localize)('installWorkspaceRecommendedExtensions', "Install Workspace Recommended Extensions"),
                icon: extensionsIcons_1.installWorkspaceRecommendedIcon,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.equals('view', extensions_2.WORKSPACE_RECOMMENDATIONS_VIEW_ID),
                    group: 'navigation',
                    order: 1
                },
                run: async (accessor) => {
                    const view = accessor.get(viewsService_1.IViewsService).getActiveViewWithId(extensions_2.WORKSPACE_RECOMMENDATIONS_VIEW_ID);
                    return view.installWorkspaceRecommendations();
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.ID,
                title: extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL,
                icon: extensionsIcons_1.configureRecommendedIcon,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'),
                    }, {
                        id: actions_1.MenuId.ViewTitle,
                        when: contextkey_1.ContextKeyExpr.equals('view', extensions_2.WORKSPACE_RECOMMENDATIONS_VIEW_ID),
                        group: 'navigation',
                        order: 2
                    }],
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction, extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.ID, extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL))
            });
            this.registerExtensionAction({
                id: extensionsActions_1.InstallSpecificVersionOfExtensionAction.ID,
                title: { value: extensionsActions_1.InstallSpecificVersionOfExtensionAction.LABEL, original: 'Install Specific Version of Extension...' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(extensions_2.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.InstallSpecificVersionOfExtensionAction, extensionsActions_1.InstallSpecificVersionOfExtensionAction.ID, extensionsActions_1.InstallSpecificVersionOfExtensionAction.LABEL))
            });
            this.registerExtensionAction({
                id: extensionsActions_1.ReinstallAction.ID,
                title: { value: extensionsActions_1.ReinstallAction.LABEL, original: 'Reinstall Extension...' },
                category: actionCommonCategories_1.Categories.Developer,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(extensions_2.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER))
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.ReinstallAction, extensionsActions_1.ReinstallAction.ID, extensionsActions_1.ReinstallAction.LABEL))
            });
        }
        // Extension Context Menu
        registerContextMenuActions() {
            this.registerExtensionAction({
                id: extensionsActions_1.SetColorThemeAction.ID,
                title: extensionsActions_1.SetColorThemeAction.TITLE,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.THEME_ACTIONS_GROUP,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasColorThemes'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.SetColorThemeAction);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.SetFileIconThemeAction.ID,
                title: extensionsActions_1.SetFileIconThemeAction.TITLE,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.THEME_ACTIONS_GROUP,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasFileIconThemes'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.SetFileIconThemeAction);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.SetProductIconThemeAction.ID,
                title: extensionsActions_1.SetProductIconThemeAction.TITLE,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.THEME_ACTIONS_GROUP,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasProductIconThemes'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.SetProductIconThemeAction);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showPreReleaseVersion',
                title: (0, nls_1.localize2)('show pre-release version', 'Show Pre-Release Version'),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.INSTALL_ACTIONS_GROUP,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('inExtensionEditor'), contextkey_1.ContextKeyExpr.has('galleryExtensionHasPreReleaseVersion'), contextkey_1.ContextKeyExpr.not('showPreReleaseVersion'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = (await extensionWorkbenchService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None))[0];
                    extensionWorkbenchService.open(extension, { showPreReleaseVersion: true });
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showReleasedVersion',
                title: (0, nls_1.localize2)('show released version', 'Show Release Version'),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.INSTALL_ACTIONS_GROUP,
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('inExtensionEditor'), contextkey_1.ContextKeyExpr.has('galleryExtensionHasPreReleaseVersion'), contextkey_1.ContextKeyExpr.has('extensionHasReleaseVersion'), contextkey_1.ContextKeyExpr.has('showPreReleaseVersion'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = (await extensionWorkbenchService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None))[0];
                    extensionWorkbenchService.open(extension, { showPreReleaseVersion: false });
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.ToggleAutoUpdateForExtensionAction.ID,
                title: extensionsActions_1.ToggleAutoUpdateForExtensionAction.LABEL,
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.UPDATE_ACTIONS_GROUP,
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlySelectedExtensions'), contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, false)))
                },
                run: async (accessor, id) => {
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.ToggleAutoUpdateForExtensionAction, false, []);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.ToggleAutoUpdatesForPublisherAction.ID,
                title: { value: extensionsActions_1.ToggleAutoUpdatesForPublisherAction.LABEL, original: 'Auto Update (Publisher)' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.UPDATE_ACTIONS_GROUP,
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlySelectedExtensions'), contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, false)))
                },
                run: async (accessor, id) => {
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.ToggleAutoUpdatesForPublisherAction);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.switchToPreRlease',
                title: (0, nls_1.localize)('enablePreRleaseLabel', "Switch to Pre-Release Version"),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.INSTALL_ACTIONS_GROUP,
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.and(extensions_2.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.has('galleryExtensionHasPreReleaseVersion'), contextkey_1.ContextKeyExpr.not('installedExtensionIsOptedToPreRelease'), contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'))
                },
                run: async (accessor, id) => {
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.TogglePreReleaseExtensionAction);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.switchToRelease',
                title: (0, nls_1.localize)('disablePreRleaseLabel', "Switch to Release Version"),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.INSTALL_ACTIONS_GROUP,
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.and(extensions_2.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.has('galleryExtensionHasPreReleaseVersion'), contextkey_1.ContextKeyExpr.has('installedExtensionIsOptedToPreRelease'), contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'))
                },
                run: async (accessor, id) => {
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.TogglePreReleaseExtensionAction);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.ClearLanguageAction.ID,
                title: extensionsActions_1.ClearLanguageAction.TITLE,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.INSTALL_ACTIONS_GROUP,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.has('canSetLanguage'), contextkey_1.ContextKeyExpr.has('isActiveLanguagePackExtension'))
                },
                run: async (accessor, extensionId) => {
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extensionsWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = (await extensionsWorkbenchService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None))[0];
                    const action = instantiationService.createInstance(extensionsActions_1.ClearLanguageAction);
                    action.extension = extension;
                    return action.run();
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.copyExtension',
                title: (0, nls_1.localize2)('workbench.extensions.action.copyExtension', 'Copy'),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '1_copy'
                },
                run: async (accessor, extensionId) => {
                    const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                    const extension = this.extensionsWorkbenchService.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }))[0]
                        || (await this.extensionsWorkbenchService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None))[0];
                    if (extension) {
                        const name = (0, nls_1.localize)('extensionInfoName', 'Name: {0}', extension.displayName);
                        const id = (0, nls_1.localize)('extensionInfoId', 'Id: {0}', extensionId);
                        const description = (0, nls_1.localize)('extensionInfoDescription', 'Description: {0}', extension.description);
                        const verision = (0, nls_1.localize)('extensionInfoVersion', 'Version: {0}', extension.version);
                        const publisher = (0, nls_1.localize)('extensionInfoPublisher', 'Publisher: {0}', extension.publisherDisplayName);
                        const link = extension.url ? (0, nls_1.localize)('extensionInfoVSMarketplaceLink', 'VS Marketplace Link: {0}', `${extension.url}`) : null;
                        const clipboardStr = `${name}\n${id}\n${description}\n${verision}\n${publisher}${link ? '\n' + link : ''}`;
                        await clipboardService.writeText(clipboardStr);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.copyExtensionId',
                title: (0, nls_1.localize2)('workbench.extensions.action.copyExtensionId', 'Copy Extension ID'),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '1_copy'
                },
                run: async (accessor, id) => accessor.get(clipboardService_1.IClipboardService).writeText(id)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.configure',
                title: (0, nls_1.localize2)('workbench.extensions.action.configure', 'Extension Settings'),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '2_configure',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasConfiguration')),
                    order: 1
                },
                run: async (accessor, id) => accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: `@ext:${id}` })
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.configureKeybindings',
                title: (0, nls_1.localize2)('workbench.extensions.action.configureKeybindings', 'Extension Keyboard Shortcuts'),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '2_configure',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasKeybindings')),
                    order: 2
                },
                run: async (accessor, id) => accessor.get(preferences_1.IPreferencesService).openGlobalKeybindingSettings(false, { query: `@ext:${id}` })
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.toggleApplyToAllProfiles',
                title: (0, nls_1.localize2)('workbench.extensions.action.toggleApplyToAllProfiles', "Apply Extension to all Profiles"),
                toggled: contextkey_1.ContextKeyExpr.has('isApplicationScopedExtension'),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '2_configure',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('isDefaultApplicationScopedExtension').negate(), contextkey_1.ContextKeyExpr.has('isBuiltinExtension').negate(), contextkey_1.ContextKeyExpr.equals('isWorkspaceScopedExtension', false)),
                    order: 3
                },
                run: async (accessor, id) => {
                    const extension = this.extensionsWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)({ id }, e.identifier));
                    if (extension) {
                        return this.extensionsWorkbenchService.toggleApplyExtensionToAllProfiles(extension);
                    }
                }
            });
            this.registerExtensionAction({
                id: extensions_2.TOGGLE_IGNORE_EXTENSION_ACTION_ID,
                title: (0, nls_1.localize2)('workbench.extensions.action.toggleIgnoreExtension', "Sync This Extension"),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '2_configure',
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_ENABLEMENT, contextkey_1.ContextKeyExpr.equals('isWorkspaceScopedExtension', false)),
                    order: 4
                },
                run: async (accessor, id) => {
                    const extension = this.extensionsWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)({ id }, e.identifier));
                    if (extension) {
                        return this.extensionsWorkbenchService.toggleExtensionIgnoredToSync(extension);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.ignoreRecommendation',
                title: (0, nls_1.localize2)('workbench.extensions.action.ignoreRecommendation', "Ignore Recommendation"),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '3_recommendations',
                    when: contextkey_1.ContextKeyExpr.has('isExtensionRecommended'),
                    order: 1
                },
                run: async (accessor, id) => accessor.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService).toggleGlobalIgnoredRecommendation(id, true)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.undoIgnoredRecommendation',
                title: (0, nls_1.localize2)('workbench.extensions.action.undoIgnoredRecommendation', "Undo Ignored Recommendation"),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '3_recommendations',
                    when: contextkey_1.ContextKeyExpr.has('isUserIgnoredRecommendation'),
                    order: 1
                },
                run: async (accessor, id) => accessor.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService).toggleGlobalIgnoredRecommendation(id, false)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addExtensionToWorkspaceRecommendations',
                title: (0, nls_1.localize2)('workbench.extensions.action.addExtensionToWorkspaceRecommendations', "Add to Workspace Recommendations"),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '3_recommendations',
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.has('isBuiltinExtension').negate(), contextkey_1.ContextKeyExpr.has('isExtensionWorkspaceRecommended').negate(), contextkey_1.ContextKeyExpr.has('isUserIgnoredRecommendation').negate(), contextkey_1.ContextKeyExpr.notEquals('extensionSource', 'resource')),
                    order: 2
                },
                run: (accessor, id) => accessor.get(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService).toggleRecommendation(id)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.removeExtensionFromWorkspaceRecommendations',
                title: (0, nls_1.localize2)('workbench.extensions.action.removeExtensionFromWorkspaceRecommendations', "Remove from Workspace Recommendations"),
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '3_recommendations',
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.has('isBuiltinExtension').negate(), contextkey_1.ContextKeyExpr.has('isExtensionWorkspaceRecommended')),
                    order: 2
                },
                run: (accessor, id) => accessor.get(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService).toggleRecommendation(id)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addToWorkspaceRecommendations',
                title: (0, nls_1.localize2)('workbench.extensions.action.addToWorkspaceRecommendations', "Add Extension to Workspace Recommendations"),
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.extension)),
                },
                async run(accessor) {
                    const editorService = accessor.get(editorService_1.IEditorService);
                    const workspaceExtensionsConfigService = accessor.get(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService);
                    if (!(editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput)) {
                        return;
                    }
                    const extensionId = editorService.activeEditor.extension.identifier.id.toLowerCase();
                    const recommendations = await workspaceExtensionsConfigService.getRecommendations();
                    if (recommendations.includes(extensionId)) {
                        return;
                    }
                    await workspaceExtensionsConfigService.toggleRecommendation(extensionId);
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addToWorkspaceFolderRecommendations',
                title: (0, nls_1.localize2)('workbench.extensions.action.addToWorkspaceFolderRecommendations', "Add Extension to Workspace Folder Recommendations"),
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('folder'), contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.extension)),
                },
                run: () => this.commandService.executeCommand('workbench.extensions.action.addToWorkspaceRecommendations')
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addToWorkspaceIgnoredRecommendations',
                title: (0, nls_1.localize2)('workbench.extensions.action.addToWorkspaceIgnoredRecommendations', "Add Extension to Workspace Ignored Recommendations"),
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.extension)),
                },
                async run(accessor) {
                    const editorService = accessor.get(editorService_1.IEditorService);
                    const workspaceExtensionsConfigService = accessor.get(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService);
                    if (!(editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput)) {
                        return;
                    }
                    const extensionId = editorService.activeEditor.extension.identifier.id.toLowerCase();
                    const unwantedRecommendations = await workspaceExtensionsConfigService.getUnwantedRecommendations();
                    if (unwantedRecommendations.includes(extensionId)) {
                        return;
                    }
                    await workspaceExtensionsConfigService.toggleUnwantedRecommendation(extensionId);
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addToWorkspaceFolderIgnoredRecommendations',
                title: (0, nls_1.localize2)('workbench.extensions.action.addToWorkspaceFolderIgnoredRecommendations', "Add Extension to Workspace Folder Ignored Recommendations"),
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('folder'), contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.extension)),
                },
                run: () => this.commandService.executeCommand('workbench.extensions.action.addToWorkspaceIgnoredRecommendations')
            });
            this.registerExtensionAction({
                id: extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction.ID,
                title: { value: extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction.LABEL, original: 'Configure Recommended Extensions (Workspace)' },
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'),
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction, extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction.ID, extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction.LABEL))
            });
        }
        registerExtensionAction(extensionActionOptions) {
            const menus = extensionActionOptions.menu ? Array.isArray(extensionActionOptions.menu) ? extensionActionOptions.menu : [extensionActionOptions.menu] : [];
            let menusWithOutTitles = [];
            const menusWithTitles = [];
            if (extensionActionOptions.menuTitles) {
                for (let index = 0; index < menus.length; index++) {
                    const menu = menus[index];
                    const menuTitle = extensionActionOptions.menuTitles[menu.id.id];
                    if (menuTitle) {
                        menusWithTitles.push({ id: menu.id, item: { ...menu, command: { id: extensionActionOptions.id, title: menuTitle } } });
                    }
                    else {
                        menusWithOutTitles.push(menu);
                    }
                }
            }
            else {
                menusWithOutTitles = menus;
            }
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        ...extensionActionOptions,
                        menu: menusWithOutTitles
                    });
                }
                run(accessor, ...args) {
                    return extensionActionOptions.run(accessor, ...args);
                }
            }));
            if (menusWithTitles.length) {
                disposables.add(actions_1.MenuRegistry.appendMenuItems(menusWithTitles));
            }
            return disposables;
        }
    };
    ExtensionsContributions = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, panecomposite_1.IPaneCompositePartService),
        __param(4, extensions_2.IExtensionsWorkbenchService),
        __param(5, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, dialogs_1.IDialogService),
        __param(8, commands_1.ICommandService)
    ], ExtensionsContributions);
    let ExtensionStorageCleaner = class ExtensionStorageCleaner {
        constructor(extensionManagementService, storageService) {
            extensionStorage_1.ExtensionStorageService.removeOutdatedExtensionVersions(extensionManagementService, storageService);
        }
    };
    ExtensionStorageCleaner = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, storage_1.IStorageService)
    ], ExtensionStorageCleaner);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(ExtensionsContributions, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.StatusUpdater, 4 /* LifecyclePhase.Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.MaliciousExtensionChecker, 4 /* LifecyclePhase.Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsUtils_1.KeymapExtensions, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.ExtensionsViewletViewsContribution, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsActivationProgress_1.ExtensionActivationProgress, 4 /* LifecyclePhase.Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsDependencyChecker_1.ExtensionDependencyChecker, 4 /* LifecyclePhase.Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionEnablementWorkspaceTrustTransitionParticipant_1.ExtensionEnablementWorkspaceTrustTransitionParticipant, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsCompletionItemsProvider_1.ExtensionsCompletionItemsProvider, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(unsupportedExtensionsMigrationContribution_1.UnsupportedExtensionsMigrationContrib, 4 /* LifecyclePhase.Eventually */);
    workbenchRegistry.registerWorkbenchContribution(deprecatedExtensionsChecker_1.DeprecatedExtensionsChecker, 4 /* LifecyclePhase.Eventually */);
    if (platform_2.isWeb) {
        workbenchRegistry.registerWorkbenchContribution(ExtensionStorageCleaner, 4 /* LifecyclePhase.Eventually */);
    }
    // Running Extensions
    (0, actions_1.registerAction2)(abstractRuntimeExtensionsEditor_1.ShowRuntimeExtensionsAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9ucy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0ZoRyxhQUFhO0lBQ2IsSUFBQSw4QkFBaUIsRUFBQyx3Q0FBMkIsRUFBRSx1REFBMEIsa0NBQXdELENBQUM7SUFDbEksSUFBQSw4QkFBaUIsRUFBQyxzRUFBMkMsRUFBRSx1RkFBMEMsb0NBQTRCLENBQUM7SUFDdEksSUFBQSw4QkFBaUIsRUFBQywyREFBZ0MsRUFBRSxpRUFBK0Isa0NBQTBFLENBQUM7SUFFOUosZUFBZTtJQUNmLG1CQUFRLENBQUMsRUFBRSxDQUF1Qix3QkFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLDJCQUEyQixDQUFDO1FBQ3JGLElBQUksRUFBRSwyREFBbUM7UUFDekMsTUFBTSxFQUFFLDJEQUFtQyxDQUFDLE1BQU07UUFDbEQsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHdDQUF3QyxFQUFFLG1DQUFtQyxDQUFDO1FBQ3BHLFdBQVcsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLG1CQUFtQixDQUFDLEVBQUUsQ0FBQztLQUNyRixDQUFDLENBQUM7SUFFSCxTQUFTO0lBQ1QsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUMvRSw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLGlDQUFlLEVBQ2YsaUNBQWUsQ0FBQyxFQUFFLEVBQ2xCLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FDbEMsRUFDRDtRQUND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