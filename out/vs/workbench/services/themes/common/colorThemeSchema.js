define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/tokenClassificationRegistry"], function (require, exports, nls, platform_1, jsonContributionRegistry_1, colorRegistry_1, tokenClassificationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.colorThemeSchemaId = exports.textmateColorGroupSchemaId = exports.textmateColorsSchemaId = void 0;
    exports.registerColorThemeSchemas = registerColorThemeSchemas;
    const textMateScopes = [
        'comment',
        'comment.block',
        'comment.block.documentation',
        'comment.line',
        'constant',
        'constant.character',
        'constant.character.escape',
        'constant.numeric',
        'constant.numeric.integer',
        'constant.numeric.float',
        'constant.numeric.hex',
        'constant.numeric.octal',
        'constant.other',
        'constant.regexp',
        'constant.rgb-value',
        'emphasis',
        'entity',
        'entity.name',
        'entity.name.class',
        'entity.name.function',
        'entity.name.method',
        'entity.name.section',
        'entity.name.selector',
        'entity.name.tag',
        'entity.name.type',
        'entity.other',
        'entity.other.attribute-name',
        'entity.other.inherited-class',
        'invalid',
        'invalid.deprecated',
        'invalid.illegal',
        'keyword',
        'keyword.control',
        'keyword.operator',
        'keyword.operator.new',
        'keyword.operator.assignment',
        'keyword.operator.arithmetic',
        'keyword.operator.logical',
        'keyword.other',
        'markup',
        'markup.bold',
        'markup.changed',
        'markup.deleted',
        'markup.heading',
        'markup.inline.raw',
        'markup.inserted',
        'markup.italic',
        'markup.list',
        'markup.list.numbered',
        'markup.list.unnumbered',
        'markup.other',
        'markup.quote',
        'markup.raw',
        'markup.underline',
        'markup.underline.link',
        'meta',
        'meta.block',
        'meta.cast',
        'meta.class',
        'meta.function',
        'meta.function-call',
        'meta.preprocessor',
        'meta.return-type',
        'meta.selector',
        'meta.tag',
        'meta.type.annotation',
        'meta.type',
        'punctuation.definition.string.begin',
        'punctuation.definition.string.end',
        'punctuation.separator',
        'punctuation.separator.continuation',
        'punctuation.terminator',
        'storage',
        'storage.modifier',
        'storage.type',
        'string',
        'string.interpolated',
        'string.other',
        'string.quoted',
        'string.quoted.double',
        'string.quoted.other',
        'string.quoted.single',
        'string.quoted.triple',
        'string.regexp',
        'string.unquoted',
        'strong',
        'support',
        'support.class',
        'support.constant',
        'support.function',
        'support.other',
        'support.type',
        'support.type.property-name',
        'support.variable',
        'variable',
        'variable.language',
        'variable.name',
        'variable.other',
        'variable.other.readwrite',
        'variable.parameter'
    ];
    exports.textmateColorsSchemaId = 'vscode://schemas/textmate-colors';
    exports.textmateColorGroupSchemaId = `${exports.textmateColorsSchemaId}#/definitions/colorGroup`;
    const textmateColorSchema = {
        type: 'array',
        definitions: {
            colorGroup: {
                default: '#FF0000',
                anyOf: [
                    {
                        type: 'string',
                        format: 'color-hex'
                    },
                    {
                        $ref: '#/definitions/settings'
                    }
                ]
            },
            settings: {
                type: 'object',
                description: nls.localize('schema.token.settings', 'Colors and styles for the token.'),
                properties: {
                    foreground: {
                        type: 'string',
                        description: nls.localize('schema.token.foreground', 'Foreground color for the token.'),
                        format: 'color-hex',
                        default: '#ff0000'
                    },
                    background: {
                        type: 'string',
                        deprecationMessage: nls.localize('schema.token.background.warning', 'Token background colors are currently not supported.')
                    },
                    fontStyle: {
                        type: 'string',
                        description: nls.localize('schema.token.fontStyle', 'Font style of the rule: \'italic\', \'bold\', \'underline\', \'strikethrough\' or a combination. The empty string unsets inherited settings.'),
                        pattern: '^(\\s*\\b(italic|bold|underline|strikethrough))*\\s*$',
                        patternErrorMessage: nls.localize('schema.fontStyle.error', 'Font style must be \'italic\', \'bold\', \'underline\', \'strikethrough\' or a combination or the empty string.'),
                        defaultSnippets: [
                            { label: nls.localize('schema.token.fontStyle.none', 'None (clear inherited style)'), bodyText: '""' },
                            { body: 'italic' },
                            { body: 'bold' },
                            { body: 'underline' },
                            { body: 'strikethrough' },
                            { body: 'italic bold' },
                            { body: 'italic underline' },
                            { body: 'italic strikethrough' },
                            { body: 'bold underline' },
                            { body: 'bold strikethrough' },
                            { body: 'underline strikethrough' },
                            { body: 'italic bold underline' },
                            { body: 'italic bold strikethrough' },
                            { body: 'italic underline strikethrough' },
                            { body: 'bold underline strikethrough' },
                            { body: 'italic bold underline strikethrough' }
                        ]
                    }
                },
                additionalProperties: false,
                defaultSnippets: [{ body: { foreground: '${1:#FF0000}', fontStyle: '${2:bold}' } }]
            }
        },
        items: {
            type: 'object',
            defaultSnippets: [{ body: { scope: '${1:keyword.operator}', settings: { foreground: '${2:#FF0000}' } } }],
            properties: {
                name: {
                    type: 'string',
                    description: nls.localize('schema.properties.name', 'Description of the rule.')
                },
                scope: {
                    description: nls.localize('schema.properties.scope', 'Scope selector against which this rule matches.'),
                    anyOf: [
                        {
                            enum: textMateScopes
                        },
                        {
                            type: 'string'
                        },
                        {
                            type: 'array',
                            items: {
                                enum: textMateScopes
                            }
                        },
                        {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    ]
                },
                settings: {
                    $ref: '#/definitions/settings'
                }
            },
            required: [
                'settings'
            ],
            additionalProperties: false
        }
    };
    exports.colorThemeSchemaId = 'vscode://schemas/color-theme';
    const colorThemeSchema = {
        type: 'object',
        allowComments: true,
        allowTrailingCommas: true,
        properties: {
            colors: {
                description: nls.localize('schema.workbenchColors', 'Colors in the workbench'),
                $ref: colorRegistry_1.workbenchColorsSchemaId,
                additionalProperties: false
            },
            tokenColors: {
                anyOf: [{
                        type: 'string',
                        description: nls.localize('schema.tokenColors.path', 'Path to a tmTheme file (relative to the current file).')
                    },
                    {
                        description: nls.localize('schema.colors', 'Colors for syntax highlighting'),
                        $ref: exports.textmateColorsSchemaId
                    }
                ]
            },
            semanticHighlighting: {
                type: 'boolean',
                description: nls.localize('schema.supportsSemanticHighlighting', 'Whether semantic highlighting should be enabled for this theme.')
            },
            semanticTokenColors: {
                type: 'object',
                description: nls.localize('schema.semanticTokenColors', 'Colors for semantic tokens'),
                $ref: tokenClassificationRegistry_1.tokenStylingSchemaId
            }
        }
    };
    function registerColorThemeSchemas() {
        const schemaRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        schemaRegistry.registerSchema(exports.colorThemeSchemaId, colorThemeSchema);
        schemaRegistry.registerSchema(exports.textmateColorsSchemaId, textmateColorSchema);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JUaGVtZVNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvY29tbW9uL2NvbG9yVGhlbWVTY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQWdRQSw4REFJQztJQXZQRCxNQUFNLGNBQWMsR0FBRztRQUN0QixTQUFTO1FBQ1QsZUFBZTtRQUNmLDZCQUE2QjtRQUM3QixjQUFjO1FBQ2QsVUFBVTtRQUNWLG9CQUFvQjtRQUNwQiwyQkFBMkI7UUFDM0Isa0JBQWtCO1FBQ2xCLDBCQUEwQjtRQUMxQix3QkFBd0I7UUFDeEIsc0JBQXNCO1FBQ3RCLHdCQUF3QjtRQUN4QixnQkFBZ0I7UUFDaEIsaUJBQWlCO1FBQ2pCLG9CQUFvQjtRQUNwQixVQUFVO1FBQ1YsUUFBUTtRQUNSLGFBQWE7UUFDYixtQkFBbUI7UUFDbkIsc0JBQXNCO1FBQ3RCLG9CQUFvQjtRQUNwQixxQkFBcUI7UUFDckIsc0JBQXNCO1FBQ3RCLGlCQUFpQjtRQUNqQixrQkFBa0I7UUFDbEIsY0FBYztRQUNkLDZCQUE2QjtRQUM3Qiw4QkFBOEI7UUFDOUIsU0FBUztRQUNULG9CQUFvQjtRQUNwQixpQkFBaUI7UUFDakIsU0FBUztRQUNULGlCQUFpQjtRQUNqQixrQkFBa0I7UUFDbEIsc0JBQXNCO1FBQ3RCLDZCQUE2QjtRQUM3Qiw2QkFBNkI7UUFDN0IsMEJBQTBCO1FBQzFCLGVBQWU7UUFDZixRQUFRO1FBQ1IsYUFBYTtRQUNiLGdCQUFnQjtRQUNoQixnQkFBZ0I7UUFDaEIsZ0JBQWdCO1FBQ2hCLG1CQUFtQjtRQUNuQixpQkFBaUI7UUFDakIsZUFBZTtRQUNmLGFBQWE7UUFDYixzQkFBc0I7UUFDdEIsd0JBQXdCO1FBQ3hCLGNBQWM7UUFDZCxjQUFjO1FBQ2QsWUFBWTtRQUNaLGtCQUFrQjtRQUNs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