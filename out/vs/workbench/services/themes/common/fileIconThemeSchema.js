define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/services/themes/common/productIconThemeSchema"], function (require, exports, nls, platform_1, jsonContributionRegistry_1, productIconThemeSchema_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerFileIconThemeSchemas = registerFileIconThemeSchemas;
    const schemaId = 'vscode://schemas/icon-theme';
    const schema = {
        type: 'object',
        allowComments: true,
        allowTrailingCommas: true,
        definitions: {
            folderExpanded: {
                type: 'string',
                description: nls.localize('schema.folderExpanded', 'The folder icon for expanded folders. The expanded folder icon is optional. If not set, the icon defined for folder will be shown.')
            },
            folder: {
                type: 'string',
                description: nls.localize('schema.folder', 'The folder icon for collapsed folders, and if folderExpanded is not set, also for expanded folders.')
            },
            file: {
                type: 'string',
                description: nls.localize('schema.file', 'The default file icon, shown for all files that don\'t match any extension, filename or language id.')
            },
            rootFolder: {
                type: 'string',
                description: nls.localize('schema.rootFolder', 'The folder icon for collapsed root folders, and if rootFolderExpanded is not set, also for expanded root folders.')
            },
            rootFolderExpanded: {
                type: 'string',
                description: nls.localize('schema.rootFolderExpanded', 'The folder icon for expanded root folders. The expanded root folder icon is optional. If not set, the icon defined for root folder will be shown.')
            },
            rootFolderNames: {
                type: 'object',
                description: nls.localize('schema.rootFolderNames', 'Associates root folder names to icons. The object key is the root folder name. No patterns or wildcards are allowed. Root folder name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.folderName', 'The ID of the icon definition for the association.')
                }
            },
            rootFolderNamesExpanded: {
                type: 'object',
                description: nls.localize('schema.rootFolderNamesExpanded', 'Associates root folder names to icons for expanded root folders. The object key is the root folder name. No patterns or wildcards are allowed. Root folder name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.rootFolderNameExpanded', 'The ID of the icon definition for the association.')
                }
            },
            folderNames: {
                type: 'object',
                description: nls.localize('schema.folderNames', 'Associates folder names to icons. The object key is the folder name, not including any path segments. No patterns or wildcards are allowed. Folder name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.folderName', 'The ID of the icon definition for the association.')
                }
            },
            folderNamesExpanded: {
                type: 'object',
                description: nls.localize('schema.folderNamesExpanded', 'Associates folder names to icons for expanded folders. The object key is the folder name, not including any path segments. No patterns or wildcards are allowed. Folder name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.folderNameExpanded', 'The ID of the icon definition for the association.')
                }
            },
            fileExtensions: {
                type: 'object',
                description: nls.localize('schema.fileExtensions', 'Associates file extensions to icons. The object key is the file extension name. The extension name is the last segment of a file name after the last dot (not including the dot). Extensions are compared case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.fileExtension', 'The ID of the icon definition for the association.')
                }
            },
            fileNames: {
                type: 'object',
                description: nls.localize('schema.fileNames', 'Associates file names to icons. The object key is the full file name, but not including any path segments. File name can include dots and a possible file extension. No patterns or wildcards are allowed. File name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.fileName', 'The ID of the icon definition for the association.')
                }
            },
            languageIds: {
                type: 'object',
                description: nls.localize('schema.languageIds', 'Associates languages to icons. The object key is the language id as defined in the language contribution point.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.languageId', 'The ID of the icon definition for the association.')
                }
            },
            associations: {
                type: 'object',
                properties: {
                    folderExpanded: {
                        $ref: '#/definitions/folderExpanded'
                    },
                    folder: {
                        $ref: '#/definitions/folder'
                    },
                    file: {
                        $ref: '#/definitions/file'
                    },
                    folderNames: {
                        $ref: '#/definitions/folderNames'
                    },
                    folderNamesExpanded: {
                        $ref: '#/definitions/folderNamesExpanded'
                    },
                    rootFolder: {
                        $ref: '#/definitions/rootFolder'
                    },
                    rootFolderExpanded: {
                        $ref: '#/definitions/rootFolderExpanded'
                    },
                    rootFolderNames: {
                        $ref: '#/definitions/rootFolderNames'
                    },
                    rootFolderNamesExpanded: {
                        $ref: '#/definitions/rootFolderNamesExpanded'
                    },
                    fileExtensions: {
                        $ref: '#/definitions/fileExtensions'
                    },
                    fileNames: {
                        $ref: '#/definitions/fileNames'
                    },
                    languageIds: {
                        $ref: '#/definitions/languageIds'
                    }
                }
            }
        },
        properties: {
            fonts: {
                type: 'array',
                description: nls.localize('schema.fonts', 'Fonts that are used in the icon definitions.'),
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: nls.localize('schema.id', 'The ID of the font.'),
                            pattern: productIconThemeSchema_1.fontIdRegex,
                            patternErrorMessage: nls.localize('schema.id.formatError', 'The ID must only contain letter, numbers, underscore and minus.')
                        },
                        src: {
                            type: 'array',
                            description: nls.localize('schema.src', 'The location of the font.'),
                            items: {
                                type: 'object',
                                properties: {
                                    path: {
                                        type: 'string',
                                        description: nls.localize('schema.font-path', 'The font path, relative to the current file icon theme file.'),
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
                            pattern: productIconThemeSchema_1.fontWeightRegex
                        },
                        style: {
                            type: 'string',
                            description: nls.localize('schema.font-style', 'The style of the font. See https://developer.mozilla.org/en-US/docs/Web/CSS/font-style for valid values.'),
                            pattern: productIconThemeSchema_1.fontStyleRegex
                        },
                        size: {
                            type: 'string',
                            description: nls.localize('schema.font-size', 'The default size of the font. See https://developer.mozilla.org/en-US/docs/Web/CSS/font-size for valid values.'),
                            pattern: productIconThemeSchema_1.fontSizeRegex
                        }
                    },
                    required: [
                        'id',
                        'src'
                    ]
                }
            },
            iconDefinitions: {
                type: 'object',
                description: nls.localize('schema.iconDefinitions', 'Description of all icons that can be used when associating files to icons.'),
                additionalProperties: {
                    type: 'object',
                    description: nls.localize('schema.iconDefinition', 'An icon definition. The object key is the ID of the definition.'),
                    properties: {
                        iconPath: {
                            type: 'string',
                            description: nls.localize('schema.iconPath', 'When using a SVG or PNG: The path to the image. The path is relative to the icon set file.')
                        },
                        fontCharacter: {
                            type: 'string',
                            description: nls.localize('schema.fontCharacter', 'When using a glyph font: The character in the font to use.')
                        },
                        fontColor: {
                            type: 'string',
                            format: 'color-hex',
                            description: nls.localize('schema.fontColor', 'When using a glyph font: The color to use.')
                        },
                        fontSize: {
                            type: 'string',
                            description: nls.localize('schema.fontSize', 'When using a font: The font size in percentage to the text font. If not set, defaults to the size in the font definition.'),
                            pattern: productIconThemeSchema_1.fontSizeRegex
                        },
                        fontId: {
                            type: 'string',
                            description: nls.localize('schema.fontId', 'When using a font: The id of the font. If not set, defaults to the first font definition.')
                        }
                    }
                }
            },
            folderExpanded: {
                $ref: '#/definitions/folderExpanded'
            },
            folder: {
                $ref: '#/definitions/folder'
            },
            file: {
                $ref: '#/definitions/file'
            },
            folderNames: {
                $ref: '#/definitions/folderNames'
            },
            folderNamesExpanded: {
                $ref: '#/definitions/folderNamesExpanded'
            },
            rootFolder: {
                $ref: '#/definitions/rootFolder'
            },
            rootFolderExpanded: {
                $ref: '#/definitions/rootFolderExpanded'
            },
            rootFolderNames: {
                $ref: '#/definitions/rootFolderNames'
            },
            rootFolderNamesExpanded: {
                $ref: '#/definitions/rootFolderNamesExpanded'
            },
            fileExtensions: {
                $ref: '#/definitions/fileExtensions'
            },
            fileNames: {
                $ref: '#/definitions/fileNames'
            },
            languageIds: {
                $ref: '#/definitions/languageIds'
            },
            light: {
                $ref: '#/definitions/associations',
                description: nls.localize('schema.light', 'Optional associations for file icons in light color themes.')
            },
            highContrast: {
                $ref: '#/definitions/associations',
                description: nls.localize('schema.highContrast', 'Optional associations for file icons in high contrast color themes.')
            },
            hidesExplorerArrows: {
                type: 'boolean',
                description: nls.localize('schema.hidesExplorerArrows', 'Configures whether the file explorer\'s arrows should be hidden when this theme is active.')
            },
            showLanguageModeIcons: {
                type: 'boolean',
                description: nls.localize('schema.showLanguageModeIcons', 'Configures whether the default language icons should be used if the theme does not define an icon for a language.')
            }
        }
    };
    function registerFileIconThemeSchemas() {
        const schemaRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        schemaRegistry.registerSchema(schemaId, schema);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUljb25UaGVtZVNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvY29tbW9uL2ZpbGVJY29uVGhlbWVTY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBNFJBLG9FQUdDO0lBcFJELE1BQU0sUUFBUSxHQUFHLDZCQUE2QixDQUFDO0lBQy9DLE1BQU0sTUFBTSxHQUFnQjtRQUMzQixJQUFJLEVBQUUsUUFBUTtRQUNkLGFBQWEsRUFBRSxJQUFJO1FBQ25CLG1CQUFtQixFQUFFLElBQUk7UUFDekIsV0FBVyxFQUFFO1lBQ1osY0FBYyxFQUFFO2dCQUNmLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFLG9JQUFvSSxDQUFDO2FBQ3hMO1lBQ0QsTUFBTSxFQUFFO2dCQUNQLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxxR0FBcUcsQ0FBQzthQUVqSjtZQUNELElBQUksRUFBRTtnQkFDTCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsc0dBQXNHLENBQUM7YUFFaEo7WUFDRCxVQUFVLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsbUhBQW1ILENBQUM7YUFDbks7WUFDRCxrQkFBa0IsRUFBRTtnQkFDbkIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLEVBQUUsbUpBQW1KLENBQUM7YUFDM007WUFDRCxlQUFlLEVBQUU7Z0JBQ2hCLElB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