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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/contrib/debug/common/debug", "vs/platform/configuration/common/configuration", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/configurationResolver/common/configurationResolverUtils", "vs/editor/common/services/textResourceConfiguration", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/contrib/debug/common/debugUtils", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/environment/common/environmentService", "vs/platform/contextkey/common/contextkey", "vs/base/common/objects"], function (require, exports, nls, types_1, debug_1, configuration_1, configurationResolver_1, ConfigurationResolverUtils, textResourceConfiguration_1, uri_1, network_1, debugUtils_1, telemetryUtils_1, environmentService_1, contextkey_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Debugger = void 0;
    let Debugger = class Debugger {
        constructor(adapterManager, dbgContribution, extensionDescription, configurationService, resourcePropertiesService, configurationResolverService, environmentService, debugService, contextKeyService) {
            this.adapterManager = adapterManager;
            this.configurationService = configurationService;
            this.resourcePropertiesService = resourcePropertiesService;
            this.configurationResolverService = configurationResolverService;
            this.environmentService = environmentService;
            this.debugService = debugService;
            this.contextKeyService = contextKeyService;
            this.mergedExtensionDescriptions = [];
            this.debuggerContribution = { type: dbgContribution.type };
            this.merge(dbgContribution, extensionDescription);
            this.debuggerWhen = typeof this.debuggerContribution.when === 'string' ? contextkey_1.ContextKeyExpr.deserialize(this.debuggerContribution.when) : undefined;
            this.debuggerHiddenWhen = typeof this.debuggerContribution.hiddenWhen === 'string' ? contextkey_1.ContextKeyExpr.deserialize(this.debuggerContribution.hiddenWhen) : undefined;
        }
        merge(otherDebuggerContribution, extensionDescription) {
            /**
             * Copies all properties of source into destination. The optional parameter "overwrite" allows to control
             * if existing non-structured properties on the destination should be overwritten or not. Defaults to true (overwrite).
             */
            function mixin(destination, source, overwrite, level = 0) {
                if (!(0, types_1.isObject)(destination)) {
                    return source;
                }
                if ((0, types_1.isObject)(source)) {
                    Object.keys(source).forEach(key => {
                        if (key !== '__proto__') {
                            if ((0, types_1.isObject)(destination[key]) && (0, types_1.isObject)(source[key])) {
                                mixin(destination[key], source[key], overwrite, level + 1);
                            }
                            else {
                                if (key in destination) {
                                    if (overwrite) {
                                        if (level === 0 && key === 'type') {
                                            // don't merge the 'type' property
                                        }
                                        else {
                                            destination[key] = source[key];
                                        }
                                    }
                                }
                                else {
                                    destination[key] = source[key];
                                }
                            }
                        }
                    });
                }
                return destination;
            }
            // only if not already merged
            if (this.mergedExtensionDescriptions.indexOf(extensionDescription) < 0) {
                // remember all extensions that have been merged for this debugger
                this.mergedExtensionDescriptions.push(extensionDescription);
                // merge new debugger contribution into existing contributions (and don't overwrite values in built-in extensions)
                mixin(this.debuggerContribution, otherDebuggerContribution, extensionDescription.isBuiltin);
                // remember the extension that is considered the "main" debugger contribution
                if ((0, debugUtils_1.isDebuggerMainContribution)(otherDebuggerContribution)) {
                    this.mainExtensionDescription = extensionDescription;
                }
            }
        }
        async startDebugging(configuration, parentSessionId) {
            const parentSession = this.debugService.getModel().getSession(parentSessionId);
            return await this.debugService.startDebugging(undefined, configuration, { parentSession }, undefined);
        }
        async createDebugAdapter(session) {
            await this.adapterManager.activateDebuggers('onDebugAdapterProtocolTracker', this.type);
            const da = this.adapterManager.createDebugAdapter(session);
            if (da) {
                return Promise.resolve(da);
            }
            throw new Error(nls.localize('cannot.find.da', "Cannot find debug adapter for type '{0}'.", this.type));
        }
        async substituteVariables(folder, config) {
            const substitutedConfig = await this.adapterManager.substituteVariables(this.type, folder, config);
            return await this.configurationResolverService.resolveWithInteractionReplace(folder, substitutedConfig, 'launch', this.variables, substitutedConfig.__configurationTarget);
        }
        runInTerminal(args, sessionId) {
            return this.adapterManager.runInTerminal(this.type, args, sessionId);
        }
        get label() {
            return this.debuggerContribution.label || this.debuggerContribution.type;
        }
        get type() {
            return this.debuggerContribution.type;
        }
        get variables() {
            return this.debuggerContribution.variables;
        }
        get configurationSnippets() {
            return this.debuggerContribution.configurationSnippets;
        }
        get languages() {
            return this.debuggerContribution.languages;
        }
        get when() {
            return this.debuggerWhen;
        }
        get hiddenWhen() {
            return this.debuggerHiddenWhen;
        }
        get enabled() {
            return !this.debuggerWhen || this.contextKeyService.contextMatchesRules(this.debuggerWhen);
        }
        get isHiddenFromDropdown() {
            if (!this.debuggerHiddenWhen) {
                return false;
            }
            return this.contextKeyService.contextMatchesRules(this.debuggerHiddenWhen);
        }
        get strings() {
            return this.debuggerContribution.strings ?? this.debuggerContribution.uiMessages;
        }
        interestedInLanguage(languageId) {
            return !!(this.languages && this.languages.indexOf(languageId) >= 0);
        }
        hasInitialConfiguration() {
            return !!this.debuggerContribution.initialConfigurations;
        }
        hasDynamicConfigurationProviders() {
            return this.debugService.getConfigurationManager().hasDebugConfigurationProvider(this.type, debug_1.DebugConfigurationProviderTriggerKind.Dynamic);
        }
        hasConfigurationProvider() {
            return this.debugService.getConfigurationManager().hasDebugConfigurationProvider(this.type);
        }
        getInitialConfigurationContent(initialConfigs) {
            // at this point we got some configs from the package.json and/or from registered DebugConfigurationProviders
            let initialConfigurations = this.debuggerContribution.initialConfigurations || [];
            if (initialConfigs) {
                initialConfigurations = initialConfigurations.concat(initialConfigs);
            }
            const eol = this.resourcePropertiesService.getEOL(uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: '1' })) === '\r\n' ? '\r\n' : '\n';
            const configs = JSON.stringify(initialConfigurations, null, '\t').split('\n').map(line => '\t' + line).join(eol).trim();
            const comment1 = nls.localize('launch.config.comment1', "Use IntelliSense to learn about possible attributes.");
            const comment2 = nls.localize('launch.config.comment2', "Hover to view descriptions of existing attributes.");
            const comment3 = nls.localize('launch.config.comment3', "For more information, visit: {0}", 'https://go.microsoft.com/fwlink/?linkid=830387');
            let content = [
                '{',
                `\t// ${comment1}`,
                `\t// ${comment2}`,
                `\t// ${comment3}`,
                `\t"version": "0.2.0",`,
                `\t"configurations": ${configs}`,
                '}'
            ].join(eol);
            // fix formatting
            const editorConfig = this.configurationService.getValue();
            if (editorConfig.editor && editorConfig.editor.insertSpaces) {
                content = content.replace(new RegExp('\t', 'g'), ' '.repeat(editorConfig.editor.tabSize));
            }
            return Promise.resolve(content);
        }
        getMainExtensionDescriptor() {
            return this.mainExtensionDescription || this.mergedExtensionDescriptions[0];
        }
        getCustomTelemetryEndpoint() {
            const aiKey = this.debuggerContribution.aiKey;
            if (!aiKey) {
                return undefined;
            }
            const sendErrorTelemtry = (0, telemetryUtils_1.cleanRemoteAuthority)(this.environmentService.remoteAuthority) !== 'other';
            return {
                id: `${this.getMainExtensionDescriptor().publisher}.${this.type}`,
                aiKey,
                sendErrorTelemetry: sendErrorTelemtry
            };
        }
        getSchemaAttributes(definitions) {
            if (!this.debuggerContribution.configurationAttributes) {
                return null;
            }
            // fill in the default configuration attributes shared by all adapters.
            return Object.keys(this.debuggerContribution.configurationAttributes).map(request => {
                const definitionId = `${this.type}:${request}`;
                const platformSpecificDefinitionId = `${this.type}:${request}:platform`;
                const attributes = this.debuggerContribution.configurationAttributes[request];
                const defaultRequired = ['name', 'type', 'request'];
                attributes.required = attributes.required && attributes.required.length ? defaultRequired.concat(attributes.required) : defaultRequired;
                attributes.additionalProperties = false;
                attributes.type = 'object';
                if (!attributes.properties) {
                    attributes.properties = {};
                }
                const properties = attributes.properties;
                properties['type'] = {
                    enum: [this.type],
                    enumDescriptions: [this.label],
                    description: nls.localize('debugType', "Type of configuration."),
                    pattern: '^(?!node2)',
                    deprecationMessage: this.debuggerContribution.deprecated || (this.enabled ? undefined : (0, debug_1.debuggerDisabledMessage)(this.type)),
                    doNotSuggest: !!this.debuggerContribution.deprecated,
                    errorMessage: nls.localize('debugTypeNotRecognised', "The debug type is not recognized. Make sure that you have a corresponding debug extension installed and that it is enabled."),
                    patternErrorMessage: nls.localize('node2NotSupported', "\"node2\" is no longer supported, use \"node\" instead and set the \"protocol\" attribute to \"inspector\".")
                };
                properties['request'] = {
                    enum: [request],
                    description: nls.localize('debugRequest', "Request type of configuration. Can be \"launch\" or \"attach\"."),
                };
                for (const prop in definitions['common'].properties) {
                    properties[prop] = {
                        $ref: `#/definitions/common/properties/${prop}`
                    };
                }
                Object.keys(properties).forEach(name => {
                    // Use schema allOf property to get independent error reporting #21113
                    ConfigurationResolverUtils.applyDeprecatedVariableMessage(properties[name]);
                });
                definitions[definitionId] = { ...attributes };
                definitions[platformSpecificDefinitionId] = {
                    type: 'object',
                    additionalProperties: false,
                    properties: (0, objects_1.filter)(properties, key => key !== 'type' && key !== 'request' && key !== 'name')
                };
                // Don't add the OS props to the real attributes object so they don't show up in 'definitions'
                const attributesCopy = { ...attributes };
                attributesCopy.properties = {
                    ...properties,
                    ...{
                        windows: {
                            $ref: `#/definitions/${platformSpecificDefinitionId}`,
                            description: nls.localize('debugWindowsConfiguration', "Windows specific launch configuration attributes."),
                        },
                        osx: {
                            $ref: `#/definitions/${platformSpecificDefinitionId}`,
                            description: nls.localize('debugOSXConfiguration', "OS X specific launch configuration attributes."),
                        },
                        linux: {
                            $ref: `#/definitions/${platformSpecificDefinitionId}`,
                            description: nls.localize('debugLinuxConfiguration', "Linux specific launch configuration attributes."),
                        }
                    }
                };
                return attributesCopy;
            });
        }
    };
    exports.Debugger = Debugger;
    exports.Debugger = Debugger = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, textResourceConfiguration_1.ITextResourcePropertiesService),
        __param(5, configurationResolver_1.IConfigurationResolverService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, debug_1.IDebugService),
        __param(8, contextkey_1.IContextKeyService)
    ], Debugger);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vZGVidWdnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJ6RixJQUFNLFFBQVEsR0FBZCxNQUFNLFFBQVE7UUFTcEIsWUFDUyxjQUErQixFQUN2QyxlQUFzQyxFQUN0QyxvQkFBMkMsRUFDcEIsb0JBQTRELEVBQ25ELHlCQUEwRSxFQUMzRSw0QkFBNEUsRUFDN0Usa0JBQWlFLEVBQ2hGLFlBQTRDLEVBQ3ZDLGlCQUFzRDtZQVJsRSxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFHQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2xDLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBZ0M7WUFDMUQsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUErQjtZQUM1RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBQy9ELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3RCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFmbkUsZ0NBQTJCLEdBQTRCLEVBQUUsQ0FBQztZQWlCakUsSUFBSSxDQUFDLG9CQUFvQixHQUFHLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMzRCxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBRWxELElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsMkJBQWMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFD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