/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/nls", "vs/platform/registry/common/platform"], function (require, exports, configurationRegistry_1, configuration_1, nls, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.externalUriOpenersConfigurationNode = exports.externalUriOpenersSettingId = exports.defaultExternalUriOpenerId = void 0;
    exports.updateContributedOpeners = updateContributedOpeners;
    exports.defaultExternalUriOpenerId = 'default';
    exports.externalUriOpenersSettingId = 'workbench.externalUriOpeners';
    const externalUriOpenerIdSchemaAddition = {
        type: 'string',
        enum: []
    };
    const exampleUriPatterns = `
- \`https://microsoft.com\`: Matches this specific domain using https
- \`https://microsoft.com:8080\`: Matches this specific domain on this port using https
- \`https://microsoft.com:*\`: Matches this specific domain on any port using https
- \`https://microsoft.com/foo\`: Matches \`https://microsoft.com/foo\` and \`https://microsoft.com/foo/bar\`, but not \`https://microsoft.com/foobar\` or \`https://microsoft.com/bar\`
- \`https://*.microsoft.com\`: Match all domains ending in \`microsoft.com\` using https
- \`microsoft.com\`: Match this specific domain using either http or https
- \`*.microsoft.com\`: Match all domains ending in \`microsoft.com\` using either http or https
- \`http://192.168.0.1\`: Matches this specific IP using http
- \`http://192.168.0.*\`: Matches all IP's with this prefix using http
- \`*\`: Match all domains using either http or https`;
    exports.externalUriOpenersConfigurationNode = {
        ...configuration_1.workbenchConfigurationNodeBase,
        properties: {
            [exports.externalUriOpenersSettingId]: {
                type: 'object',
                markdownDescription: nls.localize('externalUriOpeners', "Configure the opener to use for external URIs (http, https)."),
                defaultSnippets: [{
                        body: {
                            'example.com': '$1'
                        }
                    }],
                additionalProperties: {
                    anyOf: [
                        {
                            type: 'string',
                            markdownDescription: nls.localize('externalUriOpeners.uri', "Map URI pattern to an opener id.\nExample patterns: \n{0}", exampleUriPatterns),
                        },
                        {
                            type: 'string',
                            markdownDescription: nls.localize('externalUriOpeners.uri', "Map URI pattern to an opener id.\nExample patterns: \n{0}", exampleUriPatterns),
                            enum: [exports.defaultExternalUriOpenerId],
                            enumDescriptions: [nls.localize('externalUriOpeners.defaultId', "Open using VS Code's standard opener.")],
                        },
                        externalUriOpenerIdSchemaAddition
                    ]
                }
            }
        }
    };
    function updateContributedOpeners(enumValues, enumDescriptions) {
        externalUriOpenerIdSchemaAddition.enum = enumValues;
        externalUriOpenerIdSchemaAddition.enumDescriptions = enumDescriptions;
        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
            .notifyConfigurationSchemaUpdated(exports.externalUriOpenersConfigurationNode);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVybmFsVXJpT3BlbmVyL2NvbW1vbi9jb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStEaEcsNERBTUM7SUE3RFksUUFBQSwwQkFBMEIsR0FBRyxTQUFTLENBQUM7SUFFdkMsUUFBQSwyQkFBMkIsR0FBRyw4QkFBOEIsQ0FBQztJQU0xRSxNQUFNLGlDQUFpQyxHQUFnQjtRQUN0RCxJQUFJLEVBQUUsUUFBUTtRQUNkLElBQUksRUFBRSxFQUFFO0tBQ1IsQ0FBQztJQUVGLE1BQU0sa0JBQWtCLEdBQUc7Ozs7Ozs7Ozs7c0RBVTJCLENBQUM7SUFFMUMsUUFBQSxtQ0FBbUMsR0FBdUI7UUFDdEUsR0FBRyw4Q0FBOEI7UUFDakMsVUFBVSxFQUFFO1lBQ1gsQ0FBQyxtQ0FBMkIsQ0FBQyxFQUFFO2dCQUM5QixJQUFJLEVBQUUsUUFBUTtnQkFDZCxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLDhEQUE4RCxDQUFDO2dCQUN2SCxlQUFlLEVBQUUsQ0FBQzt3QkFDakIsSUFBSSxFQUFFOzRCQUNMLGFBQWEsRUFBRSxJQUFJO3lCQUNuQjtxQkFDRCxDQUFDO2dCQUNGLG9CQUFvQixFQUFFO29CQUNyQixLQUFLLEVBQUU7d0JBQ047NEJBQ0MsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSwyREFBMkQsRUFBRSxrQkFBa0IsQ0FBQzt5QkFDNUk7d0JBQ0Q7NEJBQ0MsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSwyREFBMkQsRUFBRSxrQkFBa0IsQ0FBQzs0QkFDNUksSUFBSSxFQUFFLENBQUMsa0NBQTBCLENBQUM7NEJBQ2xDLGdCQUFnQixFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO3lCQUN6Rzt3QkFDRCxpQ0FBaUM7cUJBQ2pDO2lCQUNEO2FBQ0Q7U0FDRDtLQUNELENBQUM7SUFFRixTQUFnQix3QkFBd0IsQ0FBQyxVQUFvQixFQUFFLGdCQUEwQjtRQUN4RixpQ0FBaUMsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO1FBQ3BELGlDQUFpQyxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDO1FBRXRFLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBVSxDQUFDLGFBQWEsQ0FBQzthQUMzRCxnQ0FBZ0MsQ0FBQywyQ0FBbUMsQ0FBQyxDQUFDO0lBQ3pFLENBQUMifQ==