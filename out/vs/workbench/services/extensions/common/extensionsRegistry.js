/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/common/severity", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsApiProposals", "vs/platform/product/common/productService", "vs/platform/extensionManagement/common/implicitActivationEvents"], function (require, exports, nls, errors_1, severity_1, extensionManagement_1, jsonContributionRegistry_1, platform_1, extensions_1, extensionsApiProposals_1, productService_1, implicitActivationEvents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsRegistry = exports.ExtensionsRegistryImpl = exports.schema = exports.ExtensionPoint = exports.ExtensionPointUserDelta = exports.ExtensionMessageCollector = void 0;
    const schemaRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    class ExtensionMessageCollector {
        constructor(messageHandler, extension, extensionPointId) {
            this._messageHandler = messageHandler;
            this._extension = extension;
            this._extensionPointId = extensionPointId;
        }
        _msg(type, message) {
            this._messageHandler({
                type: type,
                message: message,
                extensionId: this._extension.identifier,
                extensionPointId: this._extensionPointId
            });
        }
        error(message) {
            this._msg(severity_1.default.Error, message);
        }
        warn(message) {
            this._msg(severity_1.default.Warning, message);
        }
        info(message) {
            this._msg(severity_1.default.Info, message);
        }
    }
    exports.ExtensionMessageCollector = ExtensionMessageCollector;
    class ExtensionPointUserDelta {
        static _toSet(arr) {
            const result = new extensions_1.ExtensionIdentifierSet();
            for (let i = 0, len = arr.length; i < len; i++) {
                result.add(arr[i].description.identifier);
            }
            return result;
        }
        static compute(previous, current) {
            if (!previous || !previous.length) {
                return new ExtensionPointUserDelta(current, []);
            }
            if (!current || !current.length) {
                return new ExtensionPointUserDelta([], previous);
            }
            const previousSet = this._toSet(previous);
            const currentSet = this._toSet(current);
            const added = current.filter(user => !previousSet.has(user.description.identifier));
            const removed = previous.filter(user => !currentSet.has(user.description.identifier));
            return new ExtensionPointUserDelta(added, removed);
        }
        constructor(added, removed) {
            this.added = added;
            this.removed = removed;
        }
    }
    exports.ExtensionPointUserDelta = ExtensionPointUserDelta;
    class ExtensionPoint {
        constructor(name, defaultExtensionKind) {
            this.name = name;
            this.defaultExtensionKind = defaultExtensionKind;
            this._handler = null;
            this._users = null;
            this._delta = null;
        }
        setHandler(handler) {
            if (this._handler !== null) {
                throw new Error('Handler already set!');
            }
            this._handler = handler;
            this._handle();
        }
        acceptUsers(users) {
            this._delta = ExtensionPointUserDelta.compute(this._users, users);
            this._users = users;
            this._handle();
        }
        _handle() {
            if (this._handler === null || this._users === null || this._delta === null) {
                return;
            }
            try {
                this._handler(this._users, this._delta);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
        }
    }
    exports.ExtensionPoint = ExtensionPoint;
    const extensionKindSchema = {
        type: 'string',
        enum: [
            'ui',
            'workspace'
        ],
        enumDescriptions: [
            nls.localize('ui', "UI extension kind. In a remote window, such extensions are enabled only when available on the local machine."),
            nls.localize('workspace', "Workspace extension kind. In a remote window, such extensions are enabled only when available on the remote."),
        ],
    };
    const schemaId = 'vscode://schemas/vscode-extensions';
    exports.schema = {
        properties: {
            engines: {
                type: 'object',
                description: nls.localize('vscode.extension.engines', "Engine compatibility."),
                properties: {
                    'vscode': {
                        type: 'string',
                        description: nls.localize('vscode.extension.engines.vscode', 'For VS Code extensions, specifies the VS Code version that the extension is compatible with. Cannot be *. For example: ^0.10.5 indicates compatibility with a minimum VS Code version of 0.10.5.'),
                        default: '^1.22.0',
                    }
                }
            },
            publisher: {
                description: nls.localize('vscode.extension.publisher', 'The publisher of the VS Code extension.'),
                type: 'string'
            },
            displayName: {
                description: nls.localize('vscode.extension.displayName', 'The display name for the extension used in the VS Code gallery.'),
                type: 'string'
            },
            categories: {
                description: nls.localize('vscode.extension.categories', 'The categories used by the VS Code gallery to categorize the extension.'),
                type: 'array',
                uniqueItems: true,
                items: {
                    oneOf: [{
                            type: 'string',
                            enum: extensions_1.EXTENSION_CATEGORIES,
                        },
                        {
                            type: 'string',
                            const: 'Languages',
                            deprecationMessage: nls.localize('vscode.extension.category.languages.deprecated', 'Use \'Programming  Languages\' instead'),
                        }]
                }
            },
            galleryBanner: {
                type: 'object',
                description: nls.localize('vscode.extension.galleryBanner', 'Banner used in the VS Code marketplace.'),
                properties: {
                    color: {
                        description: nls.localize('vscode.extension.galleryBanner.color', 'The banner color on the VS Code marketplace page header.'),
                        type: 'string'
                    },
                    theme: {
                        description: nls.localize('vscode.extension.galleryBanner.theme', 'The color theme for the font used in the banner.'),
                        type: 'string',
                        enum: ['dark', 'light']
                    }
                }
            },
            contributes: {
                description: nls.localize('vscode.extension.contributes', 'All contributions of the VS Code extension represented by this package.'),
                type: 'object',
                properties: {
                // extensions will fill in
                },
                default: {}
            },
            preview: {
                type: 'boolean',
                description: nls.localize('vscode.extension.preview', 'Sets the extension to be flagged as a Preview in the Marketplace.'),
            },
            enableProposedApi: {
                type: 'boolean',
                deprecationMessage: nls.localize('vscode.extension.enableProposedApi.deprecated', 'Use `enabledApiProposals` instead.'),
            },
            enabledApiProposals: {
                markdownDescription: nls.localize('vscode.extension.enabledApiProposals', 'Enable API proposals to try them out. Only valid **during development**. Extensions **cannot be published** with this property. For more details visit: https://code.visualstudio.com/api/advanced-topics/using-proposed-api'),
                type: 'array',
                uniqueItems: true,
                items: {
                    type: 'string',
                    enum: Object.keys(extensionsApiProposals_1.allApiProposals),
                    markdownEnumDescriptions: Object.values(extensionsApiProposals_1.allApiProposals)
                }
            },
            api: {
                markdownDescription: nls.localize('vscode.extension.api', 'Describe the API provided by this extension. For more details visit: https://code.visualstudio.com/api/advanced-topics/remote-extensions#handling-dependencies-with-remote-extensions'),
                type: 'string',
                enum: ['none'],
                enumDescriptions: [
                    nls.localize('vscode.extension.api.none', "Give up entirely the ability to export any APIs. This allows other extensions that depend on this extension to run in a separate extension host process or in a remote machine.")
                ]
            },
            activationEvents: {
                description: nls.localize('vscode.extension.activationEvents', 'Activation events for the VS Code extension.'),
                type: 'array',
                items: {
                    type: 'string',
                    defaultSnippets: [
                        {
                            label: 'onWebviewPanel',
                            description: nls.localize('vscode.extension.activationEvents.onWebviewPanel', 'An activation event emmited when a webview is loaded of a certain viewType'),
                            body: 'onWebviewPanel:viewType'
                        },
                        {
                            label: 'onLanguage',
                            description: nls.localize('vscode.extension.activationEvents.onLanguage', 'An activation event emitted whenever a file that resolves to the specified language gets opened.'),
                            body: 'onLanguage:${1:languageId}'
                        },
                        {
                            label: 'onCommand',
                            description: nls.localize('vscode.extension.activationEvents.onCommand', 'An activation event emitted whenever the specified command gets invoked.'),
                            body: 'onCommand:${2:commandId}'
                        },
                        {
                            label: 'onDebug',
                            description: nls.localize('vscode.extension.activationEvents.onDebug', 'An activation event emitted whenever a user is about to start debugging or about to setup debug configurations.'),
                            body: 'onDebug'
                        },
                        {
                            label: 'onDebugInitialConfigurations',
                            description: nls.localize('vscode.extension.activationEvents.onDebugInitialConfigurations', 'An activation event emitted whenever a "launch.json" needs to be created (and all provideDebugConfigurations methods need to be called).'),
                            body: 'onDebugInitialConfigurations'
                        },
                        {
                            label: 'onDebugDynamicConfigurations',
                            description: nls.localize('vscode.extension.activationEvents.onDebugDynamicConfigurations', 'An activation event emitted whenever a list of all debug configurations needs to be created (and all provideDebugConfigurations methods for the "dynamic" scope need to be called).'),
                            body: 'onDebugDynamicConfigurations'
                        },
                        {
                            label: 'onDebugResolve',
                            description: nls.localize('vscode.extension.activationEvents.onDebugResolve', 'An activation event emitted whenever a debug session with the specific type is about to be launched (and a corresponding resolveDebugConfiguration method needs to be called).'),
                            body: 'onDebugResolve:${6:type}'
                        },
                        {
                            label: 'onDebugAdapterProtocolTracker',
                            description: nls.localize('vscode.extension.activationEvents.onDebugAdapterProtocolTracker', 'An activation event emitted whenever a debug session with the specific type is about to be launched and a debug protocol tracker might be needed.'),
                            body: 'onDebugAdapterProtocolTracker:${6:type}'
                        },
                        {
                            label: 'workspaceContains',
                            description: nls.localize('vscode.extension.activationEvents.workspaceContains', 'An activation event emitted whenever a folder is opened that contains at least a file matching the specified glob pattern.'),
                            body: 'workspaceContains:${4:filePattern}'
                        },
                        {
                            label: 'onStartupFinished',
                            description: nls.localize('vscode.extension.activationEvents.onStartupFinished', 'An activation event emitted after the start-up finished (after all `*` activated extensions have finished activating).'),
                            body: 'onStartupFinished'
                        },
                        {
                            label: 'onTaskType',
                            description: nls.localize('vscode.extension.activationEvents.onTaskType', 'An activation event emitted whenever tasks of a certain type need to be listed or resolved.'),
                            body: 'onTaskType:${1:taskType}'
                        },
                        {
                            label: 'onFileSystem',
                            description: nls.localize('vscode.extension.activationEvents.onFileSystem', 'An activation event emitted whenever a file or folder is accessed with the given scheme.'),
                            body: 'onFileSystem:${1:scheme}'
                        },
                        {
                            label: 'onEditSession',
                            description: nls.localize('vscode.extension.activationEvents.onEditSession', 'An activation event emitted whenever an edit session is accessed with the given scheme.'),
                            body: 'onEditSession:${1:scheme}'
                        },
                        {
                            label: 'onSearch',
                            description: nls.localize('vscode.extension.activationEvents.onSearch', 'An activation event emitted whenever a search is started in the folder with the given scheme.'),
                            body: 'onSearch:${7:scheme}'
                        },
                        {
                            label: 'onView',
                            body: 'onView:${5:viewId}',
                            description: nls.localize('vscode.extension.activationEvents.onView', 'An activation event emitted whenever the specified view is expanded.'),
                        },
                        {
                            label: 'onUri',
                            body: 'onUri',
                            description: nls.localize('vscode.extension.activationEvents.onUri', 'An activation event emitted whenever a system-wide Uri directed towards this extension is open.'),
                        },
                        {
                            label: 'onOpenExternalUri',
                            body: 'onOpenExternalUri',
                            description: nls.localize('vscode.extension.activationEvents.onOpenExternalUri', 'An activation event emitted whenever a external uri (such as an http or https link) is being opened.'),
                        },
                        {
                            label: 'onCustomEditor',
                            body: 'onCustomEditor:${9:viewType}',
                            description: nls.localize('vscode.extension.activationEvents.onCustomEditor', 'An activation event emitted whenever the specified custom editor becomes visible.'),
                        },
                        {
                            label: 'onNotebook',
                            body: 'onNotebook:${1:type}',
                            description: nls.localize('vscode.extension.activationEvents.onNotebook', 'An activation event emitted whenever the specified notebook document is opened.'),
                        },
                        {
                            label: 'onAuthenticationRequest',
                            body: 'onAuthenticationRequest:${11:authenticationProviderId}',
                            description: nls.localize('vscode.extension.activationEvents.onAuthenticationRequest', 'An activation event emitted whenever sessions are requested from the specified authentication provider.')
                        },
                        {
                            label: 'onRenderer',
                            description: nls.localize('vscode.extension.activationEvents.onRenderer', 'An activation event emitted whenever a notebook output renderer is used.'),
                            body: 'onRenderer:${11:rendererId}'
                        },
                        {
                            label: 'onTerminalProfile',
                            body: 'onTerminalProfile:${1:terminalId}',
                            description: nls.localize('vscode.extension.activationEvents.onTerminalProfile', 'An activation event emitted when a specific terminal profile is launched.'),
                        },
                        {
                            label: 'onTerminalQuickFixRequest',
                            body: 'onTerminalQuickFixRequest:${1:quickFixId}',
                            description: nls.localize('vscode.extension.activationEvents.onTerminalQuickFixRequest', 'An activation event emitted when a command matches the selector associated with this ID'),
                        },
                        {
                            label: 'onWalkthrough',
                            body: 'onWalkthrough:${1:walkthroughID}',
                            description: nls.localize('vscode.extension.activationEvents.onWalkthrough', 'An activation event emitted when a specified walkthrough is opened.'),
                        },
                        {
                            label: 'onIssueReporterOpened',
                            body: 'onIssueReporterOpened',
                            description: nls.localize('vscode.extension.activationEvents.onIssueReporterOpened', 'An activation event emitted when the issue reporter is opened.'),
                        },
                        {
                            label: '*',
                            description: nls.localize('vscode.extension.activationEvents.star', 'An activation event emitted on VS Code startup. To ensure a great end user experience, please use this activation event in your extension only when no other activation events combination works in your use-case.'),
                            body: '*'
                        }
                    ],
                }
            },
            badges: {
                type: 'array',
                description: nls.localize('vscode.extension.badges', 'Array of badges to display in the sidebar of the Marketplace\'s extension page.'),
                items: {
                    type: 'object',
                    required: ['url', 'href', 'description'],
                    properties: {
                        url: {
                            type: 'string',
                            description: nls.localize('vscode.extension.badges.url', 'Badge image URL.')
                        },
                        href: {
                            type: 'string',
                            description: nls.localize('vscode.extension.badges.href', 'Badge link.')
                        },
                        description: {
                            type: 'string',
                            description: nls.localize('vscode.extension.badges.description', 'Badge description.')
                        }
                    }
                }
            },
            markdown: {
                type: 'string',
                description: nls.localize('vscode.extension.markdown', "Controls the Markdown rendering engine used in the Marketplace. Either github (default) or standard."),
                enum: ['github', 'standard'],
                default: 'github'
            },
            qna: {
                default: 'marketplace',
                description: nls.localize('vscode.extension.qna', "Controls the Q&A link in the Marketplace. Set to marketplace to enable the default Marketplace Q & A site. Set to a string to provide the URL of a custom Q & A site. Set to false to disable Q & A altogether."),
                anyOf: [
                    {
                        type: ['string', 'boolean'],
                        enum: ['marketplace', false]
                    },
                    {
                        type: 'string'
                    }
                ]
            },
            extensionDependencies: {
                description: nls.localize('vscode.extension.extensionDependencies', 'Dependencies to other extensions. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp.'),
                type: 'array',
                uniqueItems: true,
                items: {
                    type: 'string',
                    pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN
                }
            },
            extensionPack: {
                description: nls.localize('vscode.extension.contributes.extensionPack', "A set of extensions that can be installed together. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp."),
                type: 'array',
                uniqueItems: true,
                items: {
                    type: 'string',
                    pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN
                }
            },
            extensionKind: {
                description: nls.localize('extensionKind', "Define the kind of an extension. `ui` extensions are installed and run on the local machine while `workspace` extensions run on the remote."),
                type: 'array',
                items: extensionKindSchema,
                default: ['workspace'],
                defaultSnippets: [
                    {
                        body: ['ui'],
                        description: nls.localize('extensionKind.ui', "Define an extension which can run only on the local machine when connected to remote window.")
                    },
                    {
                        body: ['workspace'],
                        description: nls.localize('extensionKind.workspace', "Define an extension which can run only on the remote machine when connected remote window.")
                    },
                    {
                        body: ['ui', 'workspace'],
                        description: nls.localize('extensionKind.ui-workspace', "Define an extension which can run on either side, with a preference towards running on the local machine.")
                    },
                    {
                        body: ['workspace', 'ui'],
                        description: nls.localize('extensionKind.workspace-ui', "Define an extension which can run on either side, with a preference towards running on the remote machine.")
                    },
                    {
                        body: [],
                        description: nls.localize('extensionKind.empty', "Define an extension which cannot run in a remote context, neither on the local, nor on the remote machine.")
                    }
                ]
            },
            capabilities: {
                description: nls.localize('vscode.extension.capabilities', "Declare the set of supported capabilities by the extension."),
                type: 'object',
                properties: {
                    virtualWorkspaces: {
                        description: nls.localize('vscode.extension.capabilities.virtualWorkspaces', "Declares whether the extension should be enabled in virtual workspaces. A virtual workspace is a workspace which is not backed by any on-disk resources. When false, this extension will be automatically disabled in virtual workspaces. Default is true."),
                        type: ['boolean', 'object'],
                        defaultSnippets: [
                            { label: 'limited', body: { supported: '${1:limited}', description: '${2}' } },
                            { label: 'false', body: { supported: false, description: '${2}' } },
                        ],
                        default: true.valueOf,
                        properties: {
                            supported: {
                                markdownDescription: nls.localize('vscode.extension.capabilities.virtualWorkspaces.supported', "Declares the level of support for virtual workspaces by the extension."),
                                type: ['string', 'boolean'],
                                enum: ['limited', true, false],
                                enumDescriptions: [
                                    nls.localize('vscode.extension.capabilities.virtualWorkspaces.supported.limited', "The extension will be enabled in virtual workspaces with some functionality disabled."),
                                    nls.localize('vscode.extension.capabilities.virtualWorkspaces.supported.true', "The extension will be enabled in virtual workspaces with all functionality enabled."),
                                    nls.localize('vscode.extension.capabilities.virtualWorkspaces.supported.false', "The extension will not be enabled in virtual workspaces."),
                                ]
                            },
                            description: {
                                type: 'string',
                                markdownDescription: nls.localize('vscode.extension.capabilities.virtualWorkspaces.description', "A description of how virtual workspaces affects the extensions behavior and why it is needed. This only applies when `supported` is not `true`."),
                            }
                        }
                    },
                    untrustedWorkspaces: {
                        description: nls.localize('vscode.extension.capabilities.untrustedWorkspaces', 'Declares how the extension should be handled in untrusted workspaces.'),
                        type: 'object',
                        required: ['supported'],
                        defaultSnippets: [
                            { body: { supported: '${1:limited}', description: '${2}' } },
                        ],
                        properties: {
                            supported: {
                                markdownDescription: nls.localize('vscode.extension.capabilities.untrustedWorkspaces.supported', "Declares the level of support for untrusted workspaces by the extension."),
                                type: ['string', 'boolean'],
                                enum: ['limited', true, false],
                                enumDescriptions: [
                                    nls.localize('vscode.extension.capabilities.untrustedWorkspaces.supported.limited', "The extension will be enabled in untrusted workspaces with some functionality disabled."),
                                    nls.localize('vscode.extension.capabilities.untrustedWorkspaces.supported.true', "The extension will be enabled in untrusted workspaces with all functionality enabled."),
                                    nls.localize('vscode.extension.capabilities.untrustedWorkspaces.supported.false', "The extension will not be enabled in untrusted workspaces."),
                                ]
                            },
                            restrictedConfigurations: {
                                description: nls.localize('vscode.extension.capabilities.untrustedWorkspaces.restrictedConfigurations', "A list of configuration keys contributed by the extension that should not use workspace values in untrusted workspaces."),
                                type: 'array',
                                items: {
                                    type: 'string'
                                }
                            },
                            description: {
                                type: 'string',
                                markdownDescription: nls.localize('vscode.extension.capabilities.untrustedWorkspaces.description', "A description of how workspace trust affects the extensions behavior and why it is needed. This only applies when `supported` is not `true`."),
                            }
                        }
                    }
                }
            },
            sponsor: {
                description: nls.localize('vscode.extension.contributes.sponsor', "Specify the location from where users can sponsor your extension."),
                type: 'object',
                defaultSnippets: [
                    { body: { url: '${1:https:}' } },
                ],
                properties: {
                    'url': {
                        description: nls.localize('vscode.extension.contributes.sponsor.url', "URL from where users can sponsor your extension. It must be a valid URL with a HTTP or HTTPS protocol. Example value: https://github.com/sponsors/nvaccess"),
                        type: 'string',
                    }
                }
            },
            scripts: {
                type: 'object',
                properties: {
                    'vscode:prepublish': {
                        description: nls.localize('vscode.extension.scripts.prepublish', 'Script executed before the package is published as a VS Code extension.'),
                        type: 'string'
                    },
                    'vscode:uninstall': {
                        description: nls.localize('vscode.extension.scripts.uninstall', 'Uninstall hook for VS Code extension. Script that gets executed when the extension is completely uninstalled from VS Code which is when VS Code is restarted (shutdown and start) after the extension is uninstalled. Only Node scripts are supported.'),
                        type: 'string'
                    }
                }
            },
            icon: {
                type: 'string',
                description: nls.localize('vscode.extension.icon', 'The path to a 128x128 pixel icon.')
            },
            l10n: {
                type: 'string',
                description: nls.localize({
                    key: 'vscode.extension.l10n',
                    comment: [
                        '{Locked="bundle.l10n._locale_.json"}',
                        '{Locked="vscode.l10n API"}'
                    ]
                }, 'The relative path to a folder containing localization (bundle.l10n.*.json) files. Must be specified if you are using the vscode.l10n API.')
            },
            pricing: {
                type: 'string',
                markdownDescription: nls.localize('vscode.extension.pricing', 'The pricing information for the extension. Can be Free (default) or Trial. For more details visit: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#extension-pricing-label'),
                enum: ['Free', 'Trial'],
                default: 'Free'
            }
        }
    };
    class ExtensionsRegistryImpl {
        constructor() {
            this._extensionPoints = new Map();
        }
        registerExtensionPoint(desc) {
            if (this._extensionPoints.has(desc.extensionPoint)) {
                throw new Error('Duplicate extension point: ' + desc.extensionPoint);
            }
            const result = new ExtensionPoint(desc.extensionPoint, desc.defaultExtensionKind);
            this._extensionPoints.set(desc.extensionPoint, result);
            if (desc.activationEventsGenerator) {
                implicitActivationEvents_1.ImplicitActivationEvents.register(desc.extensionPoint, desc.activationEventsGenerator);
            }
            exports.schema.properties['contributes'].properties[desc.extensionPoint] = desc.jsonSchema;
            schemaRegistry.registerSchema(schemaId, exports.schema);
            return result;
        }
        getExtensionPoints() {
            return Array.from(this._extensionPoints.values());
        }
    }
    exports.ExtensionsRegistryImpl = ExtensionsRegistryImpl;
    const PRExtensions = {
        ExtensionsRegistry: 'ExtensionsRegistry'
    };
    platform_1.Registry.add(PRExtensions.ExtensionsRegistry, new ExtensionsRegistryImpl());
    exports.ExtensionsRegistry = platform_1.Registry.as(PRExtensions.ExtensionsRegistry);
    schemaRegistry.registerSchema(schemaId, exports.schema);
    schemaRegistry.registerSchema(productService_1.productSchemaId, {
        properties: {
            extensionEnabledApiProposals: {
                description: nls.localize('product.extensionEnabledApiProposals', "API proposals that the respective extensions can freely use."),
                type: 'object',
                properties: {},
                additionalProperties: {
                    anyOf: [{
                            type: 'array',
                            uniqueItems: true,
                            items: {
                                type: 'string',
                                enum: Object.keys(extensionsApiProposals_1.allApiProposals),
                                markdownEnumDescriptions: Object.values(extensionsApiProposals_1.allApiProposals)
                            }
                        }]
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1JlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvbnNSZWdpc3RyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLE1BQU0sY0FBYyxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUE0QixxQ0FBVSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFFM0YsTUFBYSx5QkFBeUI7UUFNckMsWUFDQyxjQUF1QyxFQUN2QyxTQUFnQyxFQUNoQyxnQkFBd0I7WUFFeEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUM7WUFDdEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGdCQUFnQixDQUFDO1FBQzNDLENBQUM7UUFFTyxJQUFJLENBQUMsSUFBYyxFQUFFLE9BQWU7WUFDM0MsSUFBSSxDQUFDLGVBQWUsQ0FBQztnQkFDcEIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVU7Z0JBQ3ZDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxpQkFBaUI7YUFDeEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEtBQUssQ0FBQyxPQUFlO1lBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVNLElBQUksQ0FBQyxPQUFlO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVNLElBQUksQ0FBQyxPQUFl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