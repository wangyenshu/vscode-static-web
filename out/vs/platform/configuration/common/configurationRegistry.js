/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, arrays_1, event_1, types, nls, configuration_1, jsonContributionRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OVERRIDE_PROPERTY_REGEX = exports.OVERRIDE_PROPERTY_PATTERN = exports.configurationDefaultsSchemaId = exports.resourceLanguageSettingsSchemaId = exports.resourceSettings = exports.windowSettings = exports.machineOverridableSettings = exports.machineSettings = exports.applicationSettings = exports.allSettings = exports.ConfigurationScope = exports.Extensions = exports.EditPresentationTypes = void 0;
    exports.overrideIdentifiersFromKey = overrideIdentifiersFromKey;
    exports.keyFromOverrideIdentifiers = keyFromOverrideIdentifiers;
    exports.getDefaultValue = getDefaultValue;
    exports.validateProperty = validateProperty;
    exports.getScopes = getScopes;
    var EditPresentationTypes;
    (function (EditPresentationTypes) {
        EditPresentationTypes["Multiline"] = "multilineText";
        EditPresentationTypes["Singleline"] = "singlelineText";
    })(EditPresentationTypes || (exports.EditPresentationTypes = EditPresentationTypes = {}));
    exports.Extensions = {
        Configuration: 'base.contributions.configuration'
    };
    var ConfigurationScope;
    (function (ConfigurationScope) {
        /**
         * Application specific configuration, which can be configured only in local user settings.
         */
        ConfigurationScope[ConfigurationScope["APPLICATION"] = 1] = "APPLICATION";
        /**
         * Machine specific configuration, which can be configured only in local and remote user settings.
         */
        ConfigurationScope[ConfigurationScope["MACHINE"] = 2] = "MACHINE";
        /**
         * Window specific configuration, which can be configured in the user or workspace settings.
         */
        ConfigurationScope[ConfigurationScope["WINDOW"] = 3] = "WINDOW";
        /**
         * Resource specific configuration, which can be configured in the user, workspace or folder settings.
         */
        ConfigurationScope[ConfigurationScope["RESOURCE"] = 4] = "RESOURCE";
        /**
         * Resource specific configuration that can be configured in language specific settings
         */
        ConfigurationScope[ConfigurationScope["LANGUAGE_OVERRIDABLE"] = 5] = "LANGUAGE_OVERRIDABLE";
        /**
         * Machine specific configuration that can also be configured in workspace or folder settings.
         */
        ConfigurationScope[ConfigurationScope["MACHINE_OVERRIDABLE"] = 6] = "MACHINE_OVERRIDABLE";
    })(ConfigurationScope || (exports.ConfigurationScope = ConfigurationScope = {}));
    exports.allSettings = { properties: {}, patternProperties: {} };
    exports.applicationSettings = { properties: {}, patternProperties: {} };
    exports.machineSettings = { properties: {}, patternProperties: {} };
    exports.machineOverridableSettings = { properties: {}, patternProperties: {} };
    exports.windowSettings = { properties: {}, patternProperties: {} };
    exports.resourceSettings = { properties: {}, patternProperties: {} };
    exports.resourceLanguageSettingsSchemaId = 'vscode://schemas/settings/resourceLanguage';
    exports.configurationDefaultsSchemaId = 'vscode://schemas/settings/configurationDefaults';
    const contributionRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    class ConfigurationRegistry {
        constructor() {
            this.overrideIdentifiers = new Set();
            this._onDidSchemaChange = new event_1.Emitter();
            this.onDidSchemaChange = this._onDidSchemaChange.event;
            this._onDidUpdateConfiguration = new event_1.Emitter();
            this.onDidUpdateConfiguration = this._onDidUpdateConfiguration.event;
            this.configurationDefaultsOverrides = new Map();
            this.defaultLanguageConfigurationOverridesNode = {
                id: 'defaultOverrides',
                title: nls.localize('defaultLanguageConfigurationOverrides.title', "Default Language Configuration Overrides"),
                properties: {}
            };
            this.configurationContributors = [this.defaultLanguageConfigurationOverridesNode];
            this.resourceLanguageSettingsSchema = {
                properties: {},
                patternProperties: {},
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            this.configurationProperties = {};
            this.policyConfigurations = new Map();
            this.excludedConfigurationProperties = {};
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this.registerOverridePropertyPatternKey();
        }
        registerConfiguration(configuration, validate = true) {
            this.registerConfigurations([configuration], validate);
        }
        registerConfigurations(configurations, validate = true) {
            const properties = new Set();
            this.doRegisterConfigurations(configurations, validate, properties);
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties });
        }
        deregisterConfigurations(configurations) {
            const properties = new Set();
            this.doDeregisterConfigurations(configurations, properties);
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties });
        }
        updateConfigurations({ add, remove }) {
            const properties = new Set();
            this.doDeregisterConfigurations(remove, properties);
            this.doRegisterConfigurations(add, false, properties);
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties });
        }
        registerDefaultConfigurations(configurationDefaults) {
            const properties = new Set();
            this.doRegisterDefaultConfigurations(configurationDefaults, properties);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides: true });
        }
        doRegisterDefaultConfigurations(configurationDefaults, bucket) {
            const overrideIdentifiers = [];
            for (const { overrides, source } of configurationDefaults) {
                for (const key in overrides) {
                    bucket.add(key);
                    if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        const configurationDefaultOverride = this.configurationDefaultsOverrides.get(key);
                        const valuesSources = configurationDefaultOverride?.valuesSources ?? new Map();
                        if (source) {
                            for (const configuration of Object.keys(overrides[key])) {
                                valuesSources.set(configuration, source);
                            }
                        }
                        const defaultValue = { ...(configurationDefaultOverride?.value || {}), ...overrides[key] };
                        this.configurationDefaultsOverrides.set(key, { source, value: defaultValue, valuesSources });
                        const plainKey = (0, configuration_1.getLanguageTagSettingPlainKey)(key);
                        const property = {
                            type: 'object',
                            default: defaultValue,
                            description: nls.localize('defaultLanguageConfiguration.description', "Configure settings to be overridden for the {0} language.", plainKey),
                            $ref: exports.resourceLanguageSettingsSchemaId,
                            defaultDefaultValue: defaultValue,
                            source: types.isString(source) ? undefined : source,
                            defaultValueSource: source
                        };
                        overrideIdentifiers.push(...overrideIdentifiersFromKey(key));
                        this.configurationProperties[key] = property;
                        this.defaultLanguageConfigurationOverridesNode.properties[key] = property;
                    }
                    else {
                        this.configurationDefaultsOverrides.set(key, { value: overrides[key], source });
                        const property = this.configurationProperties[key];
                        if (property) {
                            this.updatePropertyDefaultValue(key, property);
                            this.updateSchema(key, property);
                        }
                    }
                }
            }
            this.doRegisterOverrideIdentifiers(overrideIdentifiers);
        }
        deregisterDefaultConfigurations(defaultConfigurations) {
            const properties = new Set();
            this.doDeregisterDefaultConfigurations(defaultConfigurations, properties);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides: true });
        }
        doDeregisterDefaultConfigurations(defaultConfigurations, bucket) {
            for (const { overrides, source } of defaultConfigurations) {
                for (const key in overrides) {
                    const configurationDefaultsOverride = this.configurationDefaultsOverrides.get(key);
                    const id = types.isString(source) ? source : source?.id;
                    const configurationDefaultsOverrideSourceId = types.isString(configurationDefaultsOverride?.source) ? configurationDefaultsOverride?.source : configurationDefaultsOverride?.source?.id;
                    if (id !== configurationDefaultsOverrideSourceId) {
                        continue;
                    }
                    bucket.add(key);
                    this.configurationDefaultsOverrides.delete(key);
                    if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        delete this.configurationProperties[key];
                        delete this.defaultLanguageConfigurationOverridesNode.properties[key];
                    }
                    else {
                        const property = this.configurationProperties[key];
                        if (property) {
                            this.updatePropertyDefaultValue(key, property);
                            this.updateSchema(key, property);
                        }
                    }
                }
            }
            this.updateOverridePropertyPatternKey();
        }
        deltaConfiguration(delta) {
            // defaults: remove
            let defaultsOverrides = false;
            const properties = new Set();
            if (delta.removedDefaults) {
                this.doDeregisterDefaultConfigurations(delta.removedDefaults, properties);
                defaultsOverrides = true;
            }
            // defaults: add
            if (delta.addedDefaults) {
                this.doRegisterDefaultConfigurations(delta.addedDefaults, properties);
                defaultsOverrides = true;
            }
            // configurations: remove
            if (delta.removedConfigurations) {
                this.doDeregisterConfigurations(delta.removedConfigurations, properties);
            }
            // configurations: add
            if (delta.addedConfigurations) {
                this.doRegisterConfigurations(delta.addedConfigurations, false, properties);
            }
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides });
        }
        notifyConfigurationSchemaUpdated(...configurations) {
            this._onDidSchemaChange.fire();
        }
        registerOverrideIdentifiers(overrideIdentifiers) {
            this.doRegisterOverrideIdentifiers(overrideIdentifiers);
            this._onDidSchemaChange.fire();
        }
        doRegisterOverrideIdentifiers(overrideIdentifiers) {
            for (const overrideIdentifier of overrideIdentifiers) {
                this.overrideIdentifiers.add(overrideIdentifier);
            }
            this.updateOverridePropertyPatternKey();
        }
        doRegisterConfigurations(configurations, validate, bucket) {
            configurations.forEach(configuration => {
                this.validateAndRegisterProperties(configuration, validate, configuration.extensionInfo, configuration.restrictedProperties, undefined, bucket);
                this.configurationContributors.push(configuration);
                this.registerJSONConfiguration(configuration);
            });
        }
        doDeregisterConfigurations(configurations, bucket) {
            const deregisterConfiguration = (configuration) => {
                if (configuration.properties) {
                    for (const key in configuration.properties) {
                        bucket.add(key);
                        const property = this.configurationProperties[key];
                        if (property?.policy?.name) {
                            this.policyConfigurations.delete(property.policy.name);
                        }
                        delete this.configurationProperties[key];
                        this.removeFromSchema(key, configuration.properties[key]);
                    }
                }
                configuration.allOf?.forEach(node => deregisterConfiguration(node));
            };
            for (const configuration of configurations) {
                deregisterConfiguration(configuration);
                const index = this.configurationContributors.indexOf(configuration);
                if (index !== -1) {
                    this.configurationContributors.splice(index, 1);
                }
            }
        }
        validateAndRegisterProperties(configuration, validate = true, extensionInfo, restrictedProperties, scope = 3 /* ConfigurationScope.WINDOW */, bucket) {
            scope = types.isUndefinedOrNull(configuration.scope) ? scope : configuration.scope;
            const properties = configuration.properties;
            if (properties) {
                for (const key in properties) {
                    const property = properties[key];
                    if (validate && validateProperty(key, property)) {
                        delete properties[key];
                        continue;
                    }
                    property.source = extensionInfo;
                    // update default value
                    property.defaultDefaultValue = properties[key].default;
                    this.updatePropertyDefaultValue(key, property);
                    // update scope
                    if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        property.scope = undefined; // No scope for overridable properties `[${identifier}]`
                    }
                    else {
                        property.scope = types.isUndefinedOrNull(property.scope) ? scope : property.scope;
                        property.restricted = types.isUndefinedOrNull(property.restricted) ? !!restrictedProperties?.includes(key) : property.restricted;
                    }
                    // Add to properties maps
                    // Property is included by default if 'included' is unspecified
                    if (properties[key].hasOwnProperty('included') && !properties[key].included) {
                        this.excludedConfigurationProperties[key] = properties[key];
                        delete properties[key];
                        continue;
                    }
                    else {
                        this.configurationProperties[key] = properties[key];
                        if (properties[key].policy?.name) {
                            this.policyConfigurations.set(properties[key].policy.name, key);
                        }
                    }
                    if (!properties[key].deprecationMessage && properties[key].markdownDeprecationMessage) {
                        // If not set, default deprecationMessage to the markdown source
                        properties[key].deprecationMessage = properties[key].markdownDeprecationMessage;
                    }
                    bucket.add(key);
                }
            }
            const subNodes = configuration.allOf;
            if (subNodes) {
                for (const node of subNodes) {
                    this.validateAndRegisterProperties(node, validate, extensionInfo, restrictedProperties, scope, bucket);
                }
            }
        }
        // TODO: @sandy081 - Remove this method and include required info in getConfigurationProperties
        getConfigurations() {
            return this.configurationContributors;
        }
        getConfigurationProperties() {
            return this.configurationProperties;
        }
        getPolicyConfigurations() {
            return this.policyConfigurations;
        }
        getExcludedConfigurationProperties() {
            return this.excludedConfigurationProperties;
        }
        getConfigurationDefaultsOverrides() {
            return this.configurationDefaultsOverrides;
        }
        registerJSONConfiguration(configuration) {
            const register = (configuration) => {
                const properties = configuration.properties;
                if (properties) {
                    for (const key in properties) {
                        this.updateSchema(key, properties[key]);
                    }
                }
                const subNodes = configuration.allOf;
                subNodes?.forEach(register);
            };
            register(configuration);
        }
        updateSchema(key, property) {
            exports.allSettings.properties[key] = property;
            switch (property.scope) {
                case 1 /* ConfigurationScope.APPLICATION */:
                    exports.applicationSettings.properties[key] = property;
                    break;
                case 2 /* ConfigurationScope.MACHINE */:
                    exports.machineSettings.properties[key] = property;
                    break;
                case 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */:
                    exports.machineOverridableSettings.properties[key] = property;
                    break;
                case 3 /* ConfigurationScope.WINDOW */:
                    exports.windowSettings.properties[key] = property;
                    break;
                case 4 /* ConfigurationScope.RESOURCE */:
                    exports.resourceSettings.properties[key] = property;
                    break;
                case 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */:
                    exports.resourceSettings.properties[key] = property;
                    this.resourceLanguageSettingsSchema.properties[key] = property;
                    break;
            }
        }
        removeFromSchema(key, property) {
            delete exports.allSettings.properties[key];
            switch (property.scope) {
                case 1 /* ConfigurationScope.APPLICATION */:
                    delete exports.applicationSettings.properties[key];
                    break;
                case 2 /* ConfigurationScope.MACHINE */:
                    delete exports.machineSettings.properties[key];
                    break;
                case 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */:
                    delete exports.machineOverridableSettings.properties[key];
                    break;
                case 3 /* ConfigurationScope.WINDOW */:
                    delete exports.windowSettings.properties[key];
                    break;
                case 4 /* ConfigurationScope.RESOURCE */:
                case 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */:
                    delete exports.resourceSettings.properties[key];
                    delete this.resourceLanguageSettingsSchema.properties[key];
                    break;
            }
        }
        updateOverridePropertyPatternKey() {
            for (const overrideIdentifier of this.overrideIdentifiers.values()) {
                const overrideIdentifierProperty = `[${overrideIdentifier}]`;
                const resourceLanguagePropertiesSchema = {
                    type: 'object',
                    description: nls.localize('overrideSettings.defaultDescription', "Configure editor settings to be overridden for a language."),
                    errorMessage: nls.localize('overrideSettings.errorMessage', "This setting does not support per-language configuration."),
                    $ref: exports.resourceLanguageSettingsSchemaId,
                };
                this.updatePropertyDefaultValue(overrideIdentifierProperty, resourceLanguagePropertiesSchema);
                exports.allSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.applicationSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.machineSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.machineOverridableSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.windowSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.resourceSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
            }
        }
        registerOverridePropertyPatternKey() {
            const resourceLanguagePropertiesSchema = {
                type: 'object',
                description: nls.localize('overrideSettings.defaultDescription', "Configure editor settings to be overridden for a language."),
                errorMessage: nls.localize('overrideSettings.errorMessage', "This setting does not support per-language configuration."),
                $ref: exports.resourceLanguageSettingsSchemaId,
            };
            exports.allSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.applicationSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.machineSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.machineOverridableSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.windowSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.resourceSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            this._onDidSchemaChange.fire();
        }
        updatePropertyDefaultValue(key, property) {
            const configurationdefaultOverride = this.configurationDefaultsOverrides.get(key);
            let defaultValue = configurationdefaultOverride?.value;
            let defaultSource = configurationdefaultOverride?.source;
            if (types.isUndefined(defaultValue)) {
                defaultValue = property.defaultDefaultValue;
                defaultSource = undefined;
            }
            if (types.isUndefined(defaultValue)) {
                defaultValue = getDefaultValue(property.type);
            }
            property.default = defaultValue;
            property.defaultValueSource = defaultSource;
        }
    }
    const OVERRIDE_IDENTIFIER_PATTERN = `\\[([^\\]]+)\\]`;
    const OVERRIDE_IDENTIFIER_REGEX = new RegExp(OVERRIDE_IDENTIFIER_PATTERN, 'g');
    exports.OVERRIDE_PROPERTY_PATTERN = `^(${OVERRIDE_IDENTIFIER_PATTERN})+$`;
    exports.OVERRIDE_PROPERTY_REGEX = new RegExp(exports.OVERRIDE_PROPERTY_PATTERN);
    function overrideIdentifiersFromKey(key) {
        const identifiers = [];
        if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
            let matches = OVERRIDE_IDENTIFIER_REGEX.exec(key);
            while (matches?.length) {
                const identifier = matches[1].trim();
                if (identifier) {
                    identifiers.push(identifier);
                }
                matches = OVERRIDE_IDENTIFIER_REGEX.exec(key);
            }
        }
        return (0, arrays_1.distinct)(identifiers);
    }
    function keyFromOverrideIdentifiers(overrideIdentifiers) {
        return overrideIdentifiers.reduce((result, overrideIdentifier) => `${result}[${overrideIdentifier}]`, '');
    }
    function getDefaultValue(type) {
        const t = Array.isArray(type) ? type[0] : type;
        switch (t) {
            case 'boolean':
                return false;
            case 'integer':
            case 'number':
                return 0;
            case 'string':
                return '';
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return null;
        }
    }
    const configurationRegistry = new ConfigurationRegistry();
    platform_1.Registry.add(exports.Extensions.Configuration, configurationRegistry);
    function validateProperty(property, schema) {
        if (!property.trim()) {
            return nls.localize('config.property.empty', "Cannot register an empty property");
        }
        if (exports.OVERRIDE_PROPERTY_REGEX.test(property)) {
            return nls.localize('config.property.languageDefault', "Cannot register '{0}'. This matches property pattern '\\\\[.*\\\\]$' for describing language specific editor settings. Use 'configurationDefaults' contribution.", property);
        }
        if (configurationRegistry.getConfigurationProperties()[property] !== undefined) {
            return nls.localize('config.property.duplicate', "Cannot register '{0}'. This property is already registered.", property);
        }
        if (schema.policy?.name && configurationRegistry.getPolicyConfigurations().get(schema.policy?.name) !== undefined) {
            return nls.localize('config.policy.duplicate', "Cannot register '{0}'. The associated policy {1} is already registered with {2}.", property, schema.policy?.name, configurationRegistry.getPolicyConfigurations().get(schema.policy?.name));
        }
        return null;
    }
    function getScopes() {
        const scopes = [];
        const configurationProperties = configurationRegistry.getConfigurationProperties();
        for (const key of Object.keys(configurationProperties)) {
            scopes.push([key, configurationProperties[key].scope]);
        }
        scopes.push(['launch', 4 /* ConfigurationScope.RESOURCE */]);
        scopes.push(['task', 4 /* ConfigurationScope.RESOURCE */]);
        return scopes;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29uZmlndXJhdGlvbi9jb21tb24vY29uZmlndXJhdGlvblJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtyQmhHLGdFQWFDO0lBRUQsZ0VBRUM7SUFFRCwwQ0FpQkM7SUFLRCw0Q0FjQztJQUVELDhCQVNDO0lBdnVCRCxJQUFZLHFCQUdYO0lBSEQsV0FBWSxxQkFBcUI7UUFDaEMsb0RBQTJCLENBQUE7UUFDM0Isc0RBQTZCLENBQUE7SUFDOUIsQ0FBQyxFQUhXLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBR2hDO0lBRVksUUFBQSxVQUFVLEdBQUc7UUFDekIsYUFBYSxFQUFFLGtDQUFrQztLQUNqRCxDQUFDO0lBa0dGLElBQWtCLGtCQXlCakI7SUF6QkQsV0FBa0Isa0JBQWtCO1FBQ25DOztXQUVHO1FBQ0gseUVBQWUsQ0FBQTtRQUNmOztXQUVHO1FBQ0gsaUVBQU8sQ0FBQTtRQUNQOztXQUVHO1FBQ0gsK0RBQU0sQ0FBQTtRQUNOOztXQUVHO1FBQ0gsbUVBQVEsQ0FBQTtRQUNSOztXQUVHO1FBQ0gsMkZBQW9CLENBQUE7UUFDcEI7O1dBRUc7UUFDSCx5RkFBbUIsQ0FBQTtJQUNwQixDQUFDLEVBekJpQixrQkFBa0Isa0NBQWxCLGtCQUFrQixRQXlCbkM7SUEwR1ksUUFBQSxXQUFXLEdBQXdJLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUM3TCxRQUFBLG1CQUFtQixHQUF3SSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFDck0sUUFBQSxlQUFlLEdBQXdJLEVBQUUsVUFBVSxFQUFF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