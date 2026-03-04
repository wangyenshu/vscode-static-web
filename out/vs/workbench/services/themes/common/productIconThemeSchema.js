define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls, platform_1, jsonContributionRegistry_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fontFormatRegex = exports.fontSizeRegex = exports.fontWeightRegex = exports.fontStyleRegex = exports.fontIdRegex = void 0;
    exports.registerProductIconThemeSchemas = registerProductIconThemeSchemas;
    exports.fontIdRegex = '^([\\w_-]+)$';
    exports.fontStyleRegex = '^(normal|italic|(oblique[ \\w\\s-]+))$';
    exports.fontWeightRegex = '^(normal|bold|lighter|bolder|(\\d{0-1000}))$';
    exports.fontSizeRegex = '^([\\w .%_-]+)$';
    exports.fontFormatRegex = '^woff|woff2|truetype|opentype|embedded-opentype|svg$';
    const schemaId = 'vscode://schemas/product-icon-theme';
    const schema = {
        type: 'object',
        allowComments: true,
        allowTrailingCommas: true,
        properties: {
            fonts: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: nls.localize('schema.id', 'The ID of the font.'),
                            pattern: exports.fontIdRegex,
                            patternErrorMessage: nls.localize('schema.id.formatError', 'The ID must only contain letters, numbers, underscore and minus.')
                        },
                        src: {
                            type: 'array',
                            description: nls.localize('schema.src', 'The location of the font.'),
                            items: {
                                type: 'object',
                                properties: {
                                    path: {
                                        type: 'string',
                                        description: nls.localize('schema.font-path', 'The font path, relative to the current product icon theme file.'),
                                    },
                                    format: {
                                        type: 'string',
                                        description: nls.localize('schema.font-format', 'The format of the font.'),
                                        enum: ['woff', 'woff2', 'truetype', 'opentype', 'embedded-opentype', 'svg']
                                    }
                                },
                                required: [
                                    'path',
                                    'format'
                                ]
                            }
                        },
                        weight: {
                            type: 'string',
                            description: nls.localize('schema.font-weight', 'The weight of the font. See https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight for valid values.'),
                            anyOf: [
                                { enum: ['normal', 'bold', 'lighter', 'bolder'] },
                                { type: 'string', pattern: exports.fontWeightRegex }
                            ]
                        },
                        style: {
                            type: 'string',
                            description: nls.localize('schema.font-style', 'The style of the font. See https://developer.mozilla.org/en-US/docs/Web/CSS/font-style for valid values.'),
                            anyOf: [
                                { enum: ['normal', 'italic', 'oblique'] },
                                { type: 'string', pattern: exports.fontStyleRegex }
                            ]
                        }
                    },
                    required: [
                        'id',
                        'src'
                    ]
                }
            },
            iconDefinitions: {
                description: nls.localize('schema.iconDefinitions', 'Association of icon name to a font character.'),
                $ref: iconRegistry_1.iconsSchemaId
            }
        }
    };
    function registerProductIconThemeSchemas() {
        const schemaRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        schemaRegistry.registerSchema(schemaId, schema);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdEljb25UaGVtZVNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvY29tbW9uL3Byb2R1Y3RJY29uVGhlbWVTY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQXNGQSwwRUFHQztJQTlFWSxRQUFBLFdBQVcsR0FBRyxjQUFjLENBQUM7SUFDN0IsUUFBQSxjQUFjLEdBQUcsd0NBQXdDLENBQUM7SUFDMUQsUUFBQSxlQUFlLEdBQUcsOENBQThDLENBQUM7SUFDakUsUUFBQSxhQUFhLEdBQUcsaUJBQWlCLENBQUM7SUFDbEMsUUFBQSxlQUFlLEdBQUcsc0RBQXNELENBQUM7SUFFdEYsTUFBTSxRQUFRLEdBQUcscUNBQXFDLENBQUM7SUFDdkQsTUFBTSxNQUFNLEdBQWdCO1FBQzNCLElBQUksRUFBRSxRQUFRO1FBQ2QsYUFBYSxFQUFFLElBQUk7UUFDbkIsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixVQUFVLEVBQUU7WUFDWCxLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLE9BQU87Z0JBQ2IsS0FBSyxFQUFFO29CQUNOLElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDWCxFQUFFLEVBQUU7NEJBQ0gsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLHFCQUFxQixDQUFDOzRCQUM3RCxPQUFPLEVBQUUsbUJBQVc7NEJBQ3BCLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsa0VBQWtFLENBQUM7eUJBQzlIO3dCQUNELEdBQUcsRUFBRTs0QkFDSixJQUFJLEVBQUUsT0FBTzs0QkFDYixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsMkJBQTJCLENBQUM7NEJBQ3BFLEtBQUssRUFBRTtnQ0FDTixJQUFJLEVBQUUsUUFBUTtnQ0FDZCxVQUFVLEVBQUU7b0NBQ1gsSUFBSSxFQUFFO3dDQUNMLElBQUksRUFBRSxRQUFRO3dDQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLGlFQUFpRSxDQUFDO3FDQUNoSDtvQ0FDRCxNQUFNLEVBQUU7d0NBQ1AsSUFBSSxFQUFFLFFBQVE7d0NBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUseUJBQXlCLENBQUM7d0NBQzFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLENBQUM7cUNBQzNFO2lDQUNEO2dDQUNELFFBQVEsRUFBRTtvQ0FDVCxNQUFNO29DQUNOLFFBQVE7aUNBQ1I7NkJBQ0Q7eUJBQ0Q7d0JBQ0QsTUFBTSxFQUFFOzRCQUNQLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLDRHQUE0RyxDQUFDOzRCQUM3SixLQUFLLEVBQUU7Z0NBQ04sRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRTtnQ0FDakQsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSx1QkFBZSxFQUFFOzZCQUM1Qzt5QkFDRDt3QkFDRCxLQUFLLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsMEdBQTBHLENBQUM7NEJBQzFKLEtBQUssRUFBRTtnQ0FDTixFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7Z0NBQ3pDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsc0JBQWMsRUFBRTs2QkFDM0M7eUJBQ0Q7cUJBQ0Q7b0JBQ0QsUUFBUSxFQUFFO3dCQUNULElBQUk7d0JBQ0osS0FBSztxQkFDTDtpQkFDRDthQUNEO1lBQ0QsZUFBZSxFQUFFO2dCQUNoQixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSwrQ0FBK0MsQ0FBQztnQkFDcEcsSUFBSSxFQUFFLDRCQUFhO2FBQ25CO1NBQ0Q7S0FDRCxDQUFDO0lBRUYsU0FBZ0IsK0JBQStCO1FBQzlDLE1BQU0sY0FBYyxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUE0QixxQ0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDL0YsY0FBYyxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDakQsQ0FBQyJ9