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
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/base/common/map", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/base/common/network", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorResolverService", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions"], function (require, exports, event_1, platform_1, map_1, instantiation_1, editor_1, untitledTextEditorService_1, network_1, diffEditorInput_1, sideBySideEditorInput_1, textResourceEditorInput_1, untitledTextEditorInput_1, resources_1, uri_1, uriIdentity_1, files_1, editorResolverService_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEditorService = exports.ITextEditorService = void 0;
    exports.ITextEditorService = (0, instantiation_1.createDecorator)('textEditorService');
    let TextEditorService = class TextEditorService extends lifecycle_1.Disposable {
        constructor(untitledTextEditorService, instantiationService, uriIdentityService, fileService, editorResolverService) {
            super();
            this.untitledTextEditorService = untitledTextEditorService;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.editorResolverService = editorResolverService;
            this.editorInputCache = new map_1.ResourceMap();
            this.fileEditorFactory = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).getFileEditorFactory();
            // Register the default editor to the editor resolver
            // service so that it shows up in the editors picker
            this.registerDefaultEditor();
        }
        registerDefaultEditor() {
            this._register(this.editorResolverService.registerEditor('*', {
                id: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                label: editor_1.DEFAULT_EDITOR_ASSOCIATION.displayName,
                detail: editor_1.DEFAULT_EDITOR_ASSOCIATION.providerDisplayName,
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createEditorInput: editor => ({ editor: this.createTextEditor(editor) }),
                createUntitledEditorInput: untitledEditor => ({ editor: this.createTextEditor(untitledEditor) }),
                createDiffEditorInput: diffEditor => ({ editor: this.createTextEditor(diffEditor) })
            }));
        }
        async resolveTextEditor(input) {
            return this.createTextEditor(input);
        }
        createTextEditor(input) {
            // Merge Editor Not Supported (we fallback to showing the result only)
            if ((0, editor_1.isResourceMergeEditorInput)(input)) {
                return this.createTextEditor(input.result);
            }
            // Diff Editor Support
            if ((0, editor_1.isResourceDiffEditorInput)(input)) {
                const original = this.createTextEditor(input.original);
                const modified = this.createTextEditor(input.modified);
                return this.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, input.label, input.description, original, modified, undefined);
            }
            // Side by Side Editor Support
            if ((0, editor_1.isResourceSideBySideEditorInput)(input)) {
                const primary = this.createTextEditor(input.primary);
                const secondary = this.createTextEditor(input.secondary);
                return this.instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, input.label, input.description, secondary, primary);
            }
            // Untitled text file support
            const untitledInput = input;
            if (untitledInput.forceUntitled || !untitledInput.resource || (untitledInput.resource.scheme === network_1.Schemas.untitled)) {
                const untitledOptions = {
                    languageId: untitledInput.languageId,
                    initialValue: untitledInput.contents,
                    encoding: untitledInput.encoding
                };
                // Untitled resource: use as hint for an existing untitled editor
                let untitledModel;
                if (untitledInput.resource?.scheme === network_1.Schemas.untitled) {
                    untitledModel = this.untitledTextEditorService.create({ untitledResource: untitledInput.resource, ...untitledOptions });
                }
                // Other resource: use as hint for associated filepath
                else {
                    untitledModel = this.untitledTextEditorService.create({ associatedResource: untitledInput.resource, ...untitledOptions });
                }
                return this.createOrGetCached(untitledModel.resource, () => this.instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, untitledModel));
            }
            // Text File/Resource Editor Support
            const textResourceEditorInput = input;
            if (textResourceEditorInput.resource instanceof uri_1.URI) {
                // Derive the label from the path if not provided explicitly
                const label = textResourceEditorInput.label || (0, resources_1.basename)(textResourceEditorInput.resource);
                // We keep track of the preferred resource this input is to be created
                // with but it may be different from the canonical resource (see below)
                const preferredResource = textResourceEditorInput.resource;
                // From this moment on, only operate on the canonical resource
                // to ensure we reduce the chance of opening the same resource
                // with different resource forms (e.g. path casing on Windows)
                const canonicalResource = this.uriIdentityService.asCanonicalUri(preferredResource);
                return this.createOrGetCached(canonicalResource, () => {
                    // File
                    if (textResourceEditorInput.forceFile || this.fileService.hasProvider(canonicalResource)) {
                        return this.fileEditorFactory.createFileEditor(canonicalResource, preferredResource, textResourceEditorInput.label, textResourceEditorInput.description, textResourceEditorInput.encoding, textResourceEditorInput.languageId, textResourceEditorInput.contents, this.instantiationService);
                    }
                    // Resource
                    return this.instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, canonicalResource, textResourceEditorInput.label, textResourceEditorInput.description, textResourceEditorInput.languageId, textResourceEditorInput.contents);
                }, cachedInput => {
                    // Untitled
                    if (cachedInput instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
                        return;
                    }
                    // Files
                    else if (!(cachedInput instanceof textResourceEditorInput_1.TextResourceEditorInput)) {
                        cachedInput.setPreferredResource(preferredResource);
                        if (textResourceEditorInput.label) {
                            cachedInput.setPreferredName(textResourceEditorInput.label);
                        }
                        if (textResourceEditorInput.description) {
                            cachedInput.setPreferredDescription(textResourceEditorInput.description);
                        }
                        if (textResourceEditorInput.encoding) {
                            cachedInput.setPreferredEncoding(textResourceEditorInput.encoding);
                        }
                        if (textResourceEditorInput.languageId) {
                            cachedInput.setPreferredLanguageId(textResourceEditorInput.languageId);
                        }
                        if (typeof textResourceEditorInput.contents === 'string') {
                            cachedInput.setPreferredContents(textResourceEditorInput.contents);
                        }
                    }
                    // Resources
                    else {
                        if (label) {
                            cachedInput.setName(label);
                        }
                        if (textResourceEditorInput.description) {
                            cachedInput.setDescription(textResourceEditorInput.description);
                        }
                        if (textResourceEditorInput.languageId) {
                            cachedInput.setPreferredLanguageId(textResourceEditorInput.languageId);
                        }
                        if (typeof textResourceEditorInput.contents === 'string') {
                            cachedInput.setPreferredContents(textResourceEditorInput.contents);
                        }
                    }
                });
            }
            throw new Error(`ITextEditorService: Unable to create texteditor from ${JSON.stringify(input)}`);
        }
        createOrGetCached(resource, factoryFn, cachedFn) {
            // Return early if already cached
            let input = this.editorInputCache.get(resource);
            if (input) {
                cachedFn?.(input);
                return input;
            }
            // Otherwise create and add to cache
            input = factoryFn();
            this.editorInputCache.set(resource, input);
            event_1.Event.once(input.onWillDispose)(() => this.editorInputCache.delete(resource));
            return input;
        }
    };
    exports.TextEditorService = TextEditorService;
    exports.TextEditorService = TextEditorService = __decorate([
        __param(0, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, files_1.IFileService),
        __param(4, editorResolverService_1.IEditorResolverService)
    ], TextEditorService);
    (0, extensions_1.registerSingleton)(exports.ITextEditorService, TextEditorService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXRvclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dGZpbGUvY29tbW9uL3RleHRFZGl0b3JTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCbkYsUUFBQSxrQkFBa0IsR0FBRyxJQUFBLCtCQUFlLEVBQXFCLG1CQUFtQixDQUFDLENBQUM7SUErQnBGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsc0JBQVU7UUFRaEQsWUFDNkIseUJBQXNFLEVBQzNFLG9CQUE0RCxFQUM5RCxrQkFBd0QsRUFDL0QsV0FBMEMsRUFDaEMscUJBQThEO1lBRXRGLEtBQUssRUFBRSxDQUFDO1lBTnFDLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBNEI7WUFDMUQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzlDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2YsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQVR0RSxxQkFBZ0IsR0FBRyxJQUFJLGlCQUFXLEVBQXdFLENBQUM7WUFFM0csc0JBQWlCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLHlCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFXL0gscURBQXFEO1lBQ3JELG9EQUFvRDtZQUNwRCxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBRU8scUJBQXFCO1lBQzVCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FDdkQsR0FBRyxFQUNIO2dCQUNDLEVBQUUsRUFBRSxtQ0FBMEIsQ0FBQyxFQUFF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