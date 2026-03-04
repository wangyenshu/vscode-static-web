/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/lifecycle", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform"], function (require, exports, nls, extensionsRegistry_1, notebookCommon_1, lifecycle_1, descriptors_1, extensionFeatures_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.notebookPreloadExtensionPoint = exports.notebookRendererExtensionPoint = exports.notebooksExtensionPoint = void 0;
    const NotebookEditorContribution = Object.freeze({
        type: 'type',
        displayName: 'displayName',
        selector: 'selector',
        priority: 'priority',
    });
    const NotebookRendererContribution = Object.freeze({
        id: 'id',
        displayName: 'displayName',
        mimeTypes: 'mimeTypes',
        entrypoint: 'entrypoint',
        hardDependencies: 'dependencies',
        optionalDependencies: 'optionalDependencies',
        requiresMessaging: 'requiresMessaging',
    });
    const NotebookPreloadContribution = Object.freeze({
        type: 'type',
        entrypoint: 'entrypoint',
        localResourceRoots: 'localResourceRoots',
    });
    const notebookProviderContribution = {
        description: nls.localize('contributes.notebook.provider', 'Contributes notebook document provider.'),
        type: 'array',
        defaultSnippets: [{ body: [{ type: '', displayName: '', 'selector': [{ 'filenamePattern': '' }] }] }],
        items: {
            type: 'object',
            required: [
                NotebookEditorContribution.type,
                NotebookEditorContribution.displayName,
                NotebookEditorContribution.selector,
            ],
            properties: {
                [NotebookEditorContribution.type]: {
                    type: 'string',
                    description: nls.localize('contributes.notebook.provider.viewType', 'Type of the notebook.'),
                },
                [NotebookEditorContribution.displayName]: {
                    type: 'string',
                    description: nls.localize('contributes.notebook.provider.displayName', 'Human readable name of the notebook.'),
                },
                [NotebookEditorContribution.selector]: {
                    type: 'array',
                    description: nls.localize('contributes.notebook.provider.selector', 'Set of globs that the notebook is for.'),
                    items: {
                        type: 'object',
                        properties: {
                            filenamePattern: {
                                type: 'string',
                                description: nls.localize('contributes.notebook.provider.selector.filenamePattern', 'Glob that the notebook is enabled for.'),
                            },
                            excludeFileNamePattern: {
                                type: 'string',
                                description: nls.localize('contributes.notebook.selector.provider.excludeFileNamePattern', 'Glob that the notebook is disabled for.')
                            }
                        }
                    }
                },
                [NotebookEditorContribution.priority]: {
                    type: 'string',
                    markdownDeprecationMessage: nls.localize('contributes.priority', 'Controls if the custom editor is enabled automatically when the user opens a file. This may be overridden by users using the `workbench.editorAssociations` setting.'),
                    enum: [
                        notebookCommon_1.NotebookEditorPriority.default,
                        notebookCommon_1.NotebookEditorPriority.option,
                    ],
                    markdownEnumDescriptions: [
                        nls.localize('contributes.priority.default', 'The editor is automatically used when the user opens a resource, provided that no other default custom editors are registered for that resource.'),
                        nls.localize('contributes.priority.option', 'The editor is not automatically used when the user opens a resource, but a user can switch to the editor using the `Reopen With` command.'),
                    ],
                    default: 'default'
                }
            }
        }
    };
    const defaultRendererSnippet = Object.freeze({ id: '', displayName: '', mimeTypes: [''], entrypoint: '' });
    const notebookRendererContribution = {
        description: nls.localize('contributes.notebook.renderer', 'Contributes notebook output renderer provider.'),
        type: 'array',
        defaultSnippets: [{ body: [defaultRendererSnippet] }],
        items: {
            defaultSnippets: [{ body: defaultRendererSnippet }],
            allOf: [
                {
                    type: 'object',
                    required: [
                        NotebookRendererContribution.id,
                        NotebookRendererContribution.displayName,
                    ],
                    properties: {
                        [NotebookRendererContribution.id]: {
                            type: 'string',
                            description: nls.localize('contributes.notebook.renderer.viewType', 'Unique identifier of the notebook output renderer.'),
                        },
                        [NotebookRendererContribution.displayName]: {
                            type: 'string',
                            description: nls.localize('contributes.notebook.renderer.displayName', 'Human readable name of the notebook output renderer.'),
                        },
                        [NotebookRendererContribution.hardDependencies]: {
                            type: 'array',
                            uniqueItems: true,
                            items: { type: 'string' },
                            markdownDescription: nls.localize('contributes.notebook.renderer.hardDependencies', 'List of kernel dependencies the renderer requires. If any of the dependencies are present in the `NotebookKernel.preloads`, the renderer can be used.'),
                        },
                        [NotebookRendererContribution.optionalDependencies]: {
                            type: 'array',
                            uniqueItems: true,
                            items: { type: 'string' },
                            markdownDescription: nls.localize('contributes.notebook.renderer.optionalDependencies', 'List of soft kernel dependencies the renderer can make use of. If any of the dependencies are present in the `NotebookKernel.preloads`, the renderer will be preferred over renderers that don\'t interact with the kernel.'),
                        },
                        [NotebookRendererContribution.requiresMessaging]: {
                            default: 'never',
                            enum: [
                                'always',
                                'optional',
                                'never',
                            ],
                            enumDescriptions: [
                                nls.localize('contributes.notebook.renderer.requiresMessaging.always', 'Messaging is required. The renderer will only be used when it\'s part of an extension that can be run in an extension host.'),
                                nls.localize('contributes.notebook.renderer.requiresMessaging.optional', 'The renderer is better with messaging available, but it\'s not requried.'),
                                nls.localize('contributes.notebook.renderer.requiresMessaging.never', 'The renderer does not require messaging.'),
                            ],
                            description: nls.localize('contributes.notebook.renderer.requiresMessaging', 'Defines how and if the renderer needs to communicate with an extension host, via `createRendererMessaging`. Renderers with stronger messaging requirements may not work in all environments.'),
                        },
                    }
                },
                {
                    oneOf: [
                        {
                            required: [
                                NotebookRendererContribution.entrypoint,
                                NotebookRendererContribution.mimeTypes,
                            ],
                            properties: {
                                [NotebookRendererContribution.mimeTypes]: {
                                    type: 'array',
                                    description: nls.localize('contributes.notebook.selector', 'Set of globs that the notebook is for.'),
                                    items: {
                                        type: 'string'
                                    }
                                },
                                [NotebookRendererContribution.entrypoint]: {
                                    description: nls.localize('contributes.notebook.renderer.entrypoint', 'File to load in the webview to render the extension.'),
                                    type: 'string',
                                },
                            }
                        },
                        {
                            required: [
                                NotebookRendererContribution.entrypoint,
                            ],
                            properties: {
                                [NotebookRendererContribution.entrypoint]: {
                                    description: nls.localize('contributes.notebook.renderer.entrypoint', 'File to load in the webview to render the extension.'),
                                    type: 'object',
                                    required: ['extends', 'path'],
                                    properties: {
                                        extends: {
                                            type: 'string',
                                            description: nls.localize('contributes.notebook.renderer.entrypoint.extends', 'Existing renderer that this one extends.'),
                                        },
                                        path: {
                                            type: 'string',
                                            description: nls.localize('contributes.notebook.renderer.entrypoint', 'File to load in the webview to render the extension.'),
                                        },
                                    }
                                },
                            }
                        }
                    ]
                }
            ]
        }
    };
    const notebookPreloadContribution = {
        description: nls.localize('contributes.preload.provider', 'Contributes notebook preloads.'),
        type: 'array',
        defaultSnippets: [{ body: [{ type: '', entrypoint: '' }] }],
        items: {
            type: 'object',
            required: [
                NotebookPreloadContribution.type,
                NotebookPreloadContribution.entrypoint
            ],
            properties: {
                [NotebookPreloadContribution.type]: {
                    type: 'string',
                    description: nls.localize('contributes.preload.provider.viewType', 'Type of the notebook.'),
                },
                [NotebookPreloadContribution.entrypoint]: {
                    type: 'string',
                    description: nls.localize('contributes.preload.entrypoint', 'Path to file loaded in the webview.'),
                },
                [NotebookPreloadContribution.localResourceRoots]: {
                    type: 'array',
                    items: { type: 'string' },
                    description: nls.localize('contributes.preload.localResourceRoots', 'Paths to additional resources that should be allowed in the webview.'),
                },
            }
        }
    };
    exports.notebooksExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'notebooks',
        jsonSchema: notebookProviderContribution,
        activationEventsGenerator: (contribs, result) => {
            for (const contrib of contribs) {
                if (contrib.type) {
                    result.push(`onNotebookSerializer:${contrib.type}`);
                }
            }
        }
    });
    exports.notebookRendererExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'notebookRenderer',
        jsonSchema: notebookRendererContribution,
        activationEventsGenerator: (contribs, result) => {
            for (const contrib of contribs) {
                if (contrib.id) {
                    result.push(`onRenderer:${contrib.id}`);
                }
            }
        }
    });
    exports.notebookPreloadExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'notebookPreload',
        jsonSchema: notebookPreloadContribution,
    });
    class NotebooksDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.notebooks;
        }
        render(manifest) {
            const contrib = manifest.contributes?.notebooks || [];
            if (!contrib.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                nls.localize('Notebook id', "ID"),
                nls.localize('Notebook name', "Name"),
            ];
            const rows = contrib
                .sort((a, b) => a.type.localeCompare(b.type))
                .map(notebook => {
                return [
                    notebook.type,
                    notebook.displayName
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
    class NotebookRenderersDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.notebookRenderer;
        }
        render(manifest) {
            const contrib = manifest.contributes?.notebookRenderer || [];
            if (!contrib.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                nls.localize('Notebook renderer name', "Name"),
                nls.localize('Notebook mimetypes', "Mimetypes"),
            ];
            const rows = contrib
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
                .map(notebookRenderer => {
                return [
                    notebookRenderer.displayName,
                    notebookRenderer.mimeTypes.join(',')
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
        id: 'notebooks',
        label: nls.localize('notebooks', "Notebooks"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(NotebooksDataRenderer),
    });
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'notebookRenderer',
        label: nls.localize('notebookRenderer', "Notebook Renderers"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(NotebookRenderersDataRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvbm90ZWJvb2tFeHRlbnNpb25Qb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsTUFBTSwwQkFBMEIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2hELElBQUksRUFBRSxNQUFNO1FBQ1osV0FBVyxFQUFFLGFBQWE7UUFDMUIsUUFBUSxFQUFFLFVBQVU7UUFDcEIsUUFBUSxFQUFFLFVBQVU7S0FDcEIsQ0FBQyxDQUFDO0lBU0gsTUFBTSw0QkFBNEIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2xELEVBQUUsRUFBRSxJQUFJO1FBQ1IsV0FBVyxFQUFFLGFBQWE7UUFDMUIsU0FBUyxFQUFFLFdBQVc7UUFDdEIsVUFBVSxFQUFFLFlBQVk7UUFDeEIsZ0JBQWdCLEVBQUUsY0FBYztRQUNoQyxvQkFBb0IsRUFBRSxzQkFBc0I7UUFDNUMsaUJBQWlCLEVBQUUsbUJBQW1CO0tBQ3RDLENBQUMsQ0FBQztJQVlILE1BQU0sMkJBQTJCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNqRCxJQUFJLEVBQUUsTUFBTTtRQUNaLFVBQVUsRUFBRSxZQUFZO1FBQ3hCLGtCQUFrQixFQUFFLG9CQUFvQjtLQUN4QyxDQUFDLENBQUM7SUFRSCxNQUFNLDRCQUE0QixHQUFnQjtRQUNqRCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywrQkFBK0IsRUFBRSx5Q0FBeUMsQ0FBQztRQUNyRyxJQUFJLEVBQUUsT0FBTztRQUNiLGVBQWUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFB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