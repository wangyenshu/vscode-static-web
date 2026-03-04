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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/arrays", "vs/base/common/event", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files"], function (require, exports, nls_1, platform_1, lifecycle_1, configurationRegistry_1, configuration_1, editorResolverService_1, extensions_1, arrays_1, event_1, environmentService_1, files_1) {
    "use strict";
    var DynamicEditorConfigurations_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicEditorConfigurations = void 0;
    let DynamicEditorConfigurations = class DynamicEditorConfigurations extends lifecycle_1.Disposable {
        static { DynamicEditorConfigurations_1 = this; }
        static { this.ID = 'workbench.contrib.dynamicEditorConfigurations'; }
        static { this.AUTO_LOCK_DEFAULT_ENABLED = new Set([
            'terminalEditor',
            'mainThreadWebview-simpleBrowser.view',
            'mainThreadWebview-browserPreview'
        ]); }
        static { this.AUTO_LOCK_EXTRA_EDITORS = [
            // List some editor input identifiers that are not
            // registered yet via the editor resolver infrastructure
            {
                id: 'workbench.input.interactive',
                label: (0, nls_1.localize)('interactiveWindow', 'Interactive Window'),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            },
            {
                id: 'mainThreadWebview-markdown.preview',
                label: (0, nls_1.localize)('markdownPreview', "Markdown Preview"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            },
            {
                id: 'mainThreadWebview-simpleBrowser.view',
                label: (0, nls_1.localize)('simpleBrowser', "Simple Browser"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            },
            {
                id: 'mainThreadWebview-browserPreview',
                label: (0, nls_1.localize)('livePreview', "Live Preview"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }
        ]; }
        static { this.AUTO_LOCK_REMOVE_EDITORS = new Set([
            // List some editor types that the above `AUTO_LOCK_EXTRA_EDITORS`
            // already covers to avoid duplicates.
            'vscode-interactive-input',
            'interactive',
            'vscode.markdown.preview.editor'
        ]); }
        constructor(editorResolverService, extensionService, environmentService) {
            super();
            this.editorResolverService = editorResolverService;
            this.environmentService = environmentService;
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            // Editor configurations are getting updated very aggressively
            // (atleast 20 times) while the extensions are getting registered.
            // As such push out the dynamic configuration until after extensions
            // are registered.
            (async () => {
                await extensionService.whenInstalledExtensionsRegistered();
                this.updateDynamicEditorConfigurations();
                this.registerListeners();
            })();
        }
        registerListeners() {
            // Registered editors (debounced to reduce perf overhead)
            this._register(event_1.Event.debounce(this.editorResolverService.onDidChangeEditorRegistrations, (_, e) => e)(() => this.updateDynamicEditorConfigurations()));
        }
        updateDynamicEditorConfigurations() {
            const lockableEditors = [...this.editorResolverService.getEditors(), ...DynamicEditorConfigurations_1.AUTO_LOCK_EXTRA_EDITORS].filter(e => !DynamicEditorConfigurations_1.AUTO_LOCK_REMOVE_EDITORS.has(e.id));
            const binaryEditorCandidates = this.editorResolverService.getEditors().filter(e => e.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive).map(e => e.id);
            // Build config from registered editors
            const autoLockGroupConfiguration = Object.create(null);
            for (const editor of lockableEditors) {
                autoLockGroupConfiguration[editor.id] = {
                    type: 'boolean',
                    default: DynamicEditorConfigurations_1.AUTO_LOCK_DEFAULT_ENABLED.has(editor.id),
                    description: editor.label
                };
            }
            // Build default config too
            const defaultAutoLockGroupConfiguration = Object.create(null);
            for (const editor of lockableEditors) {
                defaultAutoLockGroupConfiguration[editor.id] = DynamicEditorConfigurations_1.AUTO_LOCK_DEFAULT_ENABLED.has(editor.id);
            }
            // Register setting for auto locking groups
            const oldAutoLockConfigurationNode = this.autoLockConfigurationNode;
            this.autoLockConfigurationNode = {
                ...configuration_1.workbenchConfigurationNodeBase,
                properties: {
                    'workbench.editor.autoLockGroups': {
                        type: 'object',
                        description: (0, nls_1.localize)('workbench.editor.autoLockGroups', "If an editor matching one of the listed types is opened as the first in an editor group and more than one group is open, the group is automatically locked. Locked groups will only be used for opening editors when explicitly chosen by a user gesture (for example drag and drop), but not by default. Consequently, the active editor in a locked group is less likely to be replaced accidentally with a different editor."),
                        properties: autoLockGroupConfiguration,
                        default: defaultAutoLockGroupConfiguration,
                        additionalProperties: false
                    }
                }
            };
            // Registers setting for default binary editors
            const oldDefaultBinaryEditorConfigurationNode = this.defaultBinaryEditorConfigurationNode;
            this.defaultBinaryEditorConfigurationNode = {
                ...configuration_1.workbenchConfigurationNodeBase,
                properties: {
                    'workbench.editor.defaultBinaryEditor': {
                        type: 'string',
                        default: '',
                        // This allows for intellisense autocompletion
                        enum: [...binaryEditorCandidates, ''],
                        description: (0, nls_1.localize)('workbench.editor.defaultBinaryEditor', "The default editor for files detected as binary. If undefined, the user will be presented with a picker."),
                    }
                }
            };
            // Registers setting for editorAssociations
            const oldEditorAssociationsConfigurationNode = this.editorAssociationsConfigurationNode;
            this.editorAssociationsConfigurationNode = {
                ...configuration_1.workbenchConfigurationNodeBase,
                properties: {
                    'workbench.editorAssociations': {
                        type: 'object',
                        markdownDescription: (0, nls_1.localize)('editor.editorAssociations', "Configure [glob patterns](https://aka.ms/vscode-glob-patterns) to editors (for example `\"*.hex\": \"hexEditor.hexedit\"`). These have precedence over the default behavior."),
                        patternProperties: {
                            '.*': {
                                type: 'string',
                                enum: binaryEditorCandidates,
                            }
                        }
                    }
                }
            };
            // Registers setting for large file confirmation based on environment
            const oldEditorLargeFileConfirmationConfigurationNode = this.editorLargeFileConfirmationConfigurationNode;
            this.editorLargeFileConfirmationConfigurationNode = {
                ...configuration_1.workbenchConfigurationNodeBase,
                properties: {
                    'workbench.editorLargeFileConfirmation': {
                        type: 'number',
                        default: (0, files_1.getLargeFileConfirmationLimit)(this.environmentService.remoteAuthority) / files_1.ByteSize.MB,
                        minimum: 1,
                        scope: 4 /* ConfigurationScope.RESOURCE */,
                        markdownDescription: (0, nls_1.localize)('editorLargeFileSizeConfirmation', "Controls the minimum size of a file in MB before asking for confirmation when opening in the editor. Note that this setting may not apply to all editor types and environments."),
                    }
                }
            };
            this.configurationRegistry.updateConfigurations({
                add: [
                    this.autoLockConfigurationNode,
                    this.defaultBinaryEditorConfigurationNode,
                    this.editorAssociationsConfigurationNode,
                    this.editorLargeFileConfirmationConfigurationNode
                ],
                remove: (0, arrays_1.coalesce)([
                    oldAutoLockConfigurationNode,
                    oldDefaultBinaryEditorConfigurationNode,
                    oldEditorAssociationsConfigurationNode,
                    oldEditorLargeFileConfirmationConfigurationNode
                ])
            });
        }
    };
    exports.DynamicEditorConfigurations = DynamicEditorConfigurations;
    exports.DynamicEditorConfigurations = DynamicEditorConfigurations = DynamicEditorConfigurations_1 = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, extensions_1.IExtensionService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], DynamicEditorConfigurations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQ29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JDb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7O2lCQUUxQyxPQUFFLEdBQUcsK0NBQStDLEFBQWxELENBQW1EO2lCQUU3Qyw4QkFBeUIsR0FBRyxJQUFJLEdBQUcsQ0FBUztZQUNuRSxnQkFBZ0I7WUFDaEIsc0NBQXNDO1lBQ3RDLGtDQUFrQztTQUNsQyxDQUFDLEFBSitDLENBSTlDO2lCQUVxQiw0QkFBdUIsR0FBMkI7WUFFekUsa0RBQWtEO1lBQ2xELHdEQUF3RDtZQUV4RDtnQkFDQyxFQUFFLEVBQUUsNkJBQTZCO2dCQUNqQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsb0JBQW9CLENBQUM7Z0JBQzFELFFBQVEsRUFBRSxnREFBd0IsQ0FBQyxPQUFPO2FBQzFDO1lBQ0Q7Z0JBQ0MsRUFBRSxFQUFFLG9DQUFvQztnQkFDeEMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixDQUFDO2dCQUN0RCxRQUFRLEVBQUUsZ0RBQXdCLENBQUMsT0FBTzthQUMxQztZQUNEO2dCQUNDLEVBQUUsRUFBRSxzQ0FBc0M7Z0JBQzFDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUM7Z0JBQ2xELFFBQVEsRUFBRSxnREFBd0IsQ0FBQyxPQUFPO2FBQzFDO1lBQ0Q7Z0JBQ0MsRUFBRSxFQUFFLGtDQUFrQztnQkFDdEMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFD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