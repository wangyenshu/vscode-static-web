/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/configuration/common/configurationRegistry", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/services/configuration/common/configuration", "vs/base/common/types", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/base/common/lifecycle", "vs/platform/instantiation/common/descriptors", "vs/base/common/htmlContent"], function (require, exports, nls, objects, platform_1, extensionsRegistry_1, configurationRegistry_1, jsonContributionRegistry_1, configuration_1, types_1, extensions_1, extensionFeatures_1, lifecycle_1, descriptors_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const configurationEntrySchema = {
        type: 'object',
        defaultSnippets: [{ body: { title: '', properties: {} } }],
        properties: {
            title: {
                description: nls.localize('vscode.extension.contributes.configuration.title', 'A title for the current category of settings. This label will be rendered in the Settings editor as a subheading. If the title is the same as the extension display name, then the category will be grouped under the main extension heading.'),
                type: 'string'
            },
            order: {
                description: nls.localize('vscode.extension.contributes.configuration.order', 'When specified, gives the order of this category of settings relative to other categories.'),
                type: 'integer'
            },
            properties: {
                description: nls.localize('vscode.extension.contributes.configuration.properties', 'Description of the configuration properties.'),
                type: 'object',
                propertyNames: {
                    pattern: '\\S+',
                    patternErrorMessage: nls.localize('vscode.extension.contributes.configuration.property.empty', 'Property should not be empty.'),
                },
                additionalProperties: {
                    anyOf: [
                        {
                            title: nls.localize('vscode.extension.contributes.configuration.properties.schema', 'Schema of the configuration property.'),
                            $ref: 'http://json-schema.org/draft-07/schema#'
                        },
                        {
                            type: 'object',
                            properties: {
                                scope: {
                                    type: 'string',
                                    enum: ['application', 'machine', 'window', 'resource', 'language-overridable', 'machine-overridable'],
                                    default: 'window',
                                    enumDescriptions: [
                                        nls.localize('scope.application.description', "Configuration that can be configured only in the user settings."),
                                        nls.localize('scope.machine.description', "Configuration that can be configured only in the user settings or only in the remote settings."),
                                        nls.localize('scope.window.description', "Configuration that can be configured in the user, remote or workspace settings."),
                                        nls.localize('scope.resource.description', "Configuration that can be configured in the user, remote, workspace or folder settings."),
                                        nls.localize('scope.language-overridable.description', "Resource configuration that can be configured in language specific settings."),
                                        nls.localize('scope.machine-overridable.description', "Machine configuration that can be configured also in workspace or folder settings.")
                                    ],
                                    markdownDescription: nls.localize('scope.description', "Scope in which the configuration is applicable. Available scopes are `application`, `machine`, `window`, `resource`, and `machine-overridable`.")
                                },
                                enumDescriptions: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                    },
                                    description: nls.localize('scope.enumDescriptions', 'Descriptions for enum values')
                                },
                                markdownEnumDescriptions: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                    },
                                    description: nls.localize('scope.markdownEnumDescriptions', 'Descriptions for enum values in the markdown format.')
                                },
                                enumItemLabels: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    },
                                    markdownDescription: nls.localize('scope.enumItemLabels', 'Labels for enum values to be displayed in the Settings editor. When specified, the {0} values still show after the labels, but less prominently.', '`enum`')
                                },
                                markdownDescription: {
                                    type: 'string',
                                    description: nls.localize('scope.markdownDescription', 'The description in the markdown format.')
                                },
                                deprecationMessage: {
                                    type: 'string',
                                    description: nls.localize('scope.deprecationMessage', 'If set, the property is marked as deprecated and the given message is shown as an explanation.')
                                },
                                markdownDeprecationMessage: {
                                    type: 'string',
                                    description: nls.localize('scope.markdownDeprecationMessage', 'If set, the property is marked as deprecated and the given message is shown as an explanation in the markdown format.')
                                },
                                editPresentation: {
                                    type: 'string',
                                    enum: ['singlelineText', 'multilineText'],
                                    enumDescriptions: [
                                        nls.localize('scope.singlelineText.description', 'The value will be shown in an inputbox.'),
                                        nls.localize('scope.multilineText.description', 'The value will be shown in a textarea.')
                                    ],
                                    default: 'singlelineText',
                                    description: nls.localize('scope.editPresentation', 'When specified, controls the presentation format of the string setting.')
                                },
                                order: {
                                    type: 'integer',
                                    description: nls.localize('scope.order', 'When specified, gives the order of this setting relative to other settings within the same category. Settings with an order property will be placed before settings without this property set.')
                                },
                                ignoreSync: {
                                    type: 'boolean',
                                    description: nls.localize('scope.ignoreSync', 'When enabled, Settings Sync will not sync the user value of this configuration by default.')
                                },
                            }
                        }
                    ]
                }
            }
        }
    };
    // build up a delta across two ext points and only apply it once
    let _configDelta;
    // BEGIN VSCode extension point `configurationDefaults`
    const defaultConfigurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'configurationDefaults',
        jsonSchema: {
            $ref: configurationRegistry_1.configurationDefaultsSchemaId,
        }
    });
    defaultConfigurationExtPoint.setHandler((extensions, { added, removed }) => {
        if (_configDelta) {
            // HIGHLY unlikely, but just in case
            configurationRegistry.deltaConfiguration(_configDelta);
        }
        const configNow = _configDelta = {};
        // schedule a HIGHLY unlikely task in case only the default configurations EXT point changes
        queueMicrotask(() => {
            if (_configDelta === configNow) {
                configurationRegistry.deltaConfiguration(_configDelta);
                _configDelta = undefined;
            }
        });
        if (removed.length) {
            const removedDefaultConfigurations = removed.map(extension => ({ overrides: objects.deepClone(extension.value), source: { id: extension.description.identifier.value, displayName: extension.description.displayName } }));
            _configDelta.removedDefaults = removedDefaultConfigurations;
        }
        if (added.length) {
            const registeredProperties = configurationRegistry.getConfigurationProperties();
            const allowedScopes = [6 /* ConfigurationScope.MACHINE_OVERRIDABLE */, 3 /* ConfigurationScope.WINDOW */, 4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */];
            const addedDefaultConfigurations = added.map(extension => {
                const overrides = objects.deepClone(extension.value);
                for (const key of Object.keys(overrides)) {
                    if (!configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        const registeredPropertyScheme = registeredProperties[key];
                        if (registeredPropertyScheme?.scope && !allowedScopes.includes(registeredPropertyScheme.scope)) {
                            extension.collector.warn(nls.localize('config.property.defaultConfiguration.warning', "Cannot register configuration defaults for '{0}'. Only defaults for machine-overridable, window, resource and language overridable scoped settings are supported.", key));
                            delete overrides[key];
                        }
                    }
                }
                return { overrides, source: { id: extension.description.identifier.value, displayName: extension.description.displayName } };
            });
            _configDelta.addedDefaults = addedDefaultConfigurations;
        }
    });
    // END VSCode extension point `configurationDefaults`
    // BEGIN VSCode extension point `configuration`
    const configurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'configuration',
        deps: [defaultConfigurationExtPoint],
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.configuration', 'Contributes configuration settings.'),
            oneOf: [
                configurationEntrySchema,
                {
                    type: 'array',
                    items: configurationEntrySchema
                }
            ]
        }
    });
    const extensionConfigurations = new extensions_1.ExtensionIdentifierMap();
    configurationExtPoint.setHandler((extensions, { added, removed }) => {
        // HIGHLY unlikely (only configuration but not defaultConfiguration EXT point changes)
        _configDelta ??= {};
        if (removed.length) {
            const removedConfigurations = [];
            for (const extension of removed) {
                removedConfigurations.push(...(extensionConfigurations.get(extension.description.identifier) || []));
                extensionConfigurations.delete(extension.description.identifier);
            }
            _configDelta.removedConfigurations = removedConfigurations;
        }
        const seenProperties = new Set();
        function handleConfiguration(node, extension) {
            const configurations = [];
            const configuration = objects.deepClone(node);
            if (configuration.title && (typeof configuration.title !== 'string')) {
                extension.collector.error(nls.localize('invalid.title', "'configuration.title' must be a string"));
            }
            validateProperties(configuration, extension);
            configuration.id = node.id || extension.description.identifier.value;
            configuration.extensionInfo = { id: extension.description.identifier.value, displayName: extension.description.displayName };
            configuration.restrictedProperties = extension.description.capabilities?.untrustedWorkspaces?.supported === 'limited' ? extension.description.capabilities?.untrustedWorkspaces.restrictedConfigurations : undefined;
            configuration.title = configuration.title || extension.description.displayName || extension.description.identifier.value;
            configurations.push(configuration);
            return configurations;
        }
        function validateProperties(configuration, extension) {
            const properties = configuration.properties;
            if (properties) {
                if (typeof properties !== 'object') {
                    extension.collector.error(nls.localize('invalid.properties', "'configuration.properties' must be an object"));
                    configuration.properties = {};
                }
                for (const key in properties) {
                    const propertyConfiguration = properties[key];
                    const message = (0, configurationRegistry_1.validateProperty)(key, propertyConfiguration);
                    if (message) {
                        delete properties[key];
                        extension.collector.warn(message);
                        continue;
                    }
                    if (seenProperties.has(key)) {
                        delete properties[key];
                        extension.collector.warn(nls.localize('config.property.duplicate', "Cannot register '{0}'. This property is already registered.", key));
                        continue;
                    }
                    if (!(0, types_1.isObject)(propertyConfiguration)) {
                        delete properties[key];
                        extension.collector.error(nls.localize('invalid.property', "configuration.properties property '{0}' must be an object", key));
                        continue;
                    }
                    seenProperties.add(key);
                    if (propertyConfiguration.scope) {
                        if (propertyConfiguration.scope.toString() === 'application') {
                            propertyConfiguration.scope = 1 /* ConfigurationScope.APPLICATION */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'machine') {
                            propertyConfiguration.scope = 2 /* ConfigurationScope.MACHINE */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'resource') {
                            propertyConfiguration.scope = 4 /* ConfigurationScope.RESOURCE */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'machine-overridable') {
                            propertyConfiguration.scope = 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'language-overridable') {
                            propertyConfiguration.scope = 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */;
                        }
                        else {
                            propertyConfiguration.scope = 3 /* ConfigurationScope.WINDOW */;
                        }
                    }
                    else {
                        propertyConfiguration.scope = 3 /* ConfigurationScope.WINDOW */;
                    }
                }
            }
            const subNodes = configuration.allOf;
            if (subNodes) {
                extension.collector.error(nls.localize('invalid.allOf', "'configuration.allOf' is deprecated and should no longer be used. Instead, pass multiple configuration sections as an array to the 'configuration' contribution point."));
                for (const node of subNodes) {
                    validateProperties(node, extension);
                }
            }
        }
        if (added.length) {
            const addedConfigurations = [];
            for (const extension of added) {
                const configurations = [];
                const value = extension.value;
                if (Array.isArray(value)) {
                    value.forEach(v => configurations.push(...handleConfiguration(v, extension)));
                }
                else {
                    configurations.push(...handleConfiguration(value, extension));
                }
                extensionConfigurations.set(extension.description.identifier, configurations);
                addedConfigurations.push(...configurations);
            }
            _configDelta.addedConfigurations = addedConfigurations;
        }
        configurationRegistry.deltaConfiguration(_configDelta);
        _configDelta = undefined;
    });
    // END VSCode extension point `configuration`
    jsonRegistry.registerSchema('vscode://schemas/workspaceConfig', {
        allowComments: true,
        allowTrailingCommas: true,
        default: {
            folders: [
                {
                    path: ''
                }
            ],
            settings: {}
        },
        required: ['folders'],
        properties: {
            'folders': {
                minItems: 0,
                uniqueItems: true,
                description: nls.localize('workspaceConfig.folders.description', "List of folders to be loaded in the workspace."),
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { path: '$1' } }],
                    oneOf: [{
                            properties: {
                                path: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.path.description', "A file path. e.g. `/root/folderA` or `./folderA` for a relative path that will be resolved against the location of the workspace file.")
                                },
                                name: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.name.description', "An optional name for the folder. ")
                                }
                            },
                            required: ['path']
                        }, {
                            properties: {
                                uri: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.uri.description', "URI of the folder")
                                },
                                name: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.name.description', "An optional name for the folder. ")
                                }
                            },
                            required: ['uri']
                        }]
                }
            },
            'settings': {
                type: 'object',
                default: {},
                description: nls.localize('workspaceConfig.settings.description', "Workspace settings"),
                $ref: configuration_1.workspaceSettingsSchemaId
            },
            'launch': {
                type: 'object',
                default: { configurations: [], compounds: [] },
                description: nls.localize('workspaceConfig.launch.description', "Workspace launch configurations"),
                $ref: configuration_1.launchSchemaId
            },
            'tasks': {
                type: 'object',
                default: { version: '2.0.0', tasks: [] },
                description: nls.localize('workspaceConfig.tasks.description', "Workspace task configurations"),
                $ref: configuration_1.tasksSchemaId
            },
            'extensions': {
                type: 'object',
                default: {},
                description: nls.localize('workspaceConfig.extensions.description', "Workspace extensions"),
                $ref: 'vscode://schemas/extensions'
            },
            'remoteAuthority': {
                type: 'string',
                doNotSuggest: true,
                description: nls.localize('workspaceConfig.remoteAuthority', "The remote server where the workspace is located."),
            },
            'transient': {
                type: 'boolean',
                doNotSuggest: true,
                description: nls.localize('workspaceConfig.transient', "A transient workspace will disappear when restarting or reloading."),
            }
        },
        errorMessage: nls.localize('unknownWorkspaceProperty', "Unknown workspace configuration property")
    });
    class SettingsTableRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.configuration;
        }
        render(manifest) {
            const configuration = manifest.contributes?.configuration;
            let properties = {};
            if (Array.isArray(configuration)) {
                configuration.forEach(config => {
                    properties = { ...properties, ...config.properties };
                });
            }
            else if (configuration) {
                properties = configuration.properties;
            }
            const contrib = properties ? Object.keys(properties) : [];
            const headers = [nls.localize('setting name', "ID"), nls.localize('description', "Description"), nls.localize('default', "Default")];
            const rows = contrib.sort((a, b) => a.localeCompare(b))
                .map(key => {
                return [
                    new htmlContent_1.MarkdownString().appendMarkdown(`\`${key}\``),
                    properties[key].markdownDescription ? new htmlContent_1.MarkdownString(properties[key].markdownDescription, false) : properties[key].description ?? '',
                    new htmlContent_1.MarkdownString().appendCodeblock('json', JSON.stringify((0, types_1.isUndefined)(properties[key].default) ? (0, configurationRegistry_1.getDefaultValue)(properties[key].type) : properties[key].default, null, 2)),
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
    }
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'configuration',
        label: nls.localize('settings', "Settings"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(SettingsTableRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbkV4dGVuc2lvblBvaW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vY29uZmlndXJhdGlvbkV4dGVuc2lvblBvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxNQUFNLFlBQVksR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBNEIscUNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzdGLE1BQU0scUJBQXFCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFNUYsTUFBTSx3QkFBd0IsR0FBZ0I7UUFDN0MsSUFBSSxFQUFFLFFBQVE7UUFDZCxlQUFlLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDMUQsVUFBVSxFQUFFO1lBQ1gsS0FBSyxFQUFFO2dCQUNOLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtEQUFrRCxFQUFFLCtPQUErTyxDQUFDO2dCQUM5VCxJQUFJLEVBQUUsUUFBUTthQUNkO1lBQ0QsS0FBSyxFQUFFO2dCQUNOLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtEQUFrRCxFQUFFLDRGQUE0RixDQUFDO2dCQUMzSyxJQUFJLEVBQUUsU0FBUzthQUNmO1lBQ0QsVUFBVSxFQUFFO2dCQUNYLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHVEQUF1RCxFQUFFLDhDQUE4QyxDQUFDO2dCQUNsSSxJQUFJLEVBQUUsUUFBUTtnQkFDZCxhQUFhLEVBQUU7b0JBQ2QsT0FBTyxFQUFFLE1BQU07b0JBQ2YsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFB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