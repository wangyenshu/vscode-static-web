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
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/editor/common/services/model", "vs/workbench/common/editor/textResourceEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network", "vs/editor/common/services/resolverService", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/services/modelUndoRedoParticipant", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/untitled/common/untitledTextEditorModel"], function (require, exports, uri_1, instantiation_1, lifecycle_1, model_1, textResourceEditorModel_1, textfiles_1, network_1, resolverService_1, textFileEditorModel_1, files_1, extensions_1, undoRedo_1, modelUndoRedoParticipant_1, uriIdentity_1, untitledTextEditorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelResolverService = void 0;
    let ResourceModelCollection = class ResourceModelCollection extends lifecycle_1.ReferenceCollection {
        constructor(instantiationService, textFileService, fileService, modelService) {
            super();
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.modelService = modelService;
            this.providers = new Map();
            this.modelsToDispose = new Set();
        }
        createReferencedObject(key) {
            return this.doCreateReferencedObject(key);
        }
        async doCreateReferencedObject(key, skipActivateProvider) {
            // Untrack as being disposed
            this.modelsToDispose.delete(key);
            // inMemory Schema: go through model service cache
            const resource = uri_1.URI.parse(key);
            if (resource.scheme === network_1.Schemas.inMemory) {
                const cachedModel = this.modelService.getModel(resource);
                if (!cachedModel) {
                    throw new Error(`Unable to resolve inMemory resource ${key}`);
                }
                const model = this.instantiationService.createInstance(textResourceEditorModel_1.TextResourceEditorModel, resource);
                if (this.ensureResolvedModel(model, key)) {
                    return model;
                }
            }
            // Untitled Schema: go through untitled text service
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = await this.textFileService.untitled.resolve({ untitledResource: resource });
                if (this.ensureResolvedModel(model, key)) {
                    return model;
                }
            }
            // File or remote file: go through text file service
            if (this.fileService.hasProvider(resource)) {
                const model = await this.textFileService.files.resolve(resource, { reason: 2 /* TextFileResolveReason.REFERENCE */ });
                if (this.ensureResolvedModel(model, key)) {
                    return model;
                }
            }
            // Virtual documents
            if (this.providers.has(resource.scheme)) {
                await this.resolveTextModelContent(key);
                const model = this.instantiationService.createInstance(textResourceEditorModel_1.TextResourceEditorModel, resource);
                if (this.ensureResolvedModel(model, key)) {
                    return model;
                }
            }
            // Either unknown schema, or not yet registered, try to activate
            if (!skipActivateProvider) {
                await this.fileService.activateProvider(resource.scheme);
                return this.doCreateReferencedObject(key, true);
            }
            throw new Error(`Unable to resolve resource ${key}`);
        }
        ensureResolvedModel(model, key) {
            if ((0, resolverService_1.isResolvedTextEditorModel)(model)) {
                return true;
            }
            throw new Error(`Unable to resolve resource ${key}`);
        }
        destroyReferencedObject(key, modelPromise) {
            // inMemory is bound to a different lifecycle
            const resource = uri_1.URI.parse(key);
            if (resource.scheme === network_1.Schemas.inMemory) {
                return;
            }
            // Track as being disposed before waiting for model to load
            // to handle the case that the reference is acquired again
            this.modelsToDispose.add(key);
            (async () => {
                try {
                    const model = await modelPromise;
                    if (!this.modelsToDispose.has(key)) {
                        // return if model has been acquired again meanwhile
                        return;
                    }
                    if (model instanceof textFileEditorModel_1.TextFileEditorModel) {
                        // text file models have conditions that prevent them
                        // from dispose, so we have to wait until we can dispose
                        await this.textFileService.files.canDispose(model);
                    }
                    else if (model instanceof untitledTextEditorModel_1.UntitledTextEditorModel) {
                        // untitled file models have conditions that prevent them
                        // from dispose, so we have to wait until we can dispose
                        await this.textFileService.untitled.canDispose(model);
                    }
                    if (!this.modelsToDispose.has(key)) {
                        // return if model has been acquired again meanwhile
                        return;
                    }
                    // Finally we can dispose the model
                    model.dispose();
                }
                catch (error) {
                    // ignore
                }
                finally {
                    this.modelsToDispose.delete(key); // Untrack as being disposed
                }
            })();
        }
        registerTextModelContentProvider(scheme, provider) {
            let providers = this.providers.get(scheme);
            if (!providers) {
                providers = [];
                this.providers.set(scheme, providers);
            }
            providers.unshift(provider);
            return (0, lifecycle_1.toDisposable)(() => {
                const providersForScheme = this.providers.get(scheme);
                if (!providersForScheme) {
                    return;
                }
                const index = providersForScheme.indexOf(provider);
                if (index === -1) {
                    return;
                }
                providersForScheme.splice(index, 1);
                if (providersForScheme.length === 0) {
                    this.providers.delete(scheme);
                }
            });
        }
        hasTextModelContentProvider(scheme) {
            return this.providers.get(scheme) !== undefined;
        }
        async resolveTextModelContent(key) {
            const resource = uri_1.URI.parse(key);
            const providersForScheme = this.providers.get(resource.scheme) || [];
            for (const provider of providersForScheme) {
                const value = await provider.provideTextContent(resource);
                if (value) {
                    return value;
                }
            }
            throw new Error(`Unable to resolve text model content for resource ${key}`);
        }
    };
    ResourceModelCollection = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, files_1.IFileService),
        __param(3, model_1.IModelService)
    ], ResourceModelCollection);
    let TextModelResolverService = class TextModelResolverService extends lifecycle_1.Disposable {
        get resourceModelCollection() {
            if (!this._resourceModelCollection) {
                this._resourceModelCollection = this.instantiationService.createInstance(ResourceModelCollection);
            }
            return this._resourceModelCollection;
        }
        get asyncModelCollection() {
            if (!this._asyncModelCollection) {
                this._asyncModelCollection = new lifecycle_1.AsyncReferenceCollection(this.resourceModelCollection);
            }
            return this._asyncModelCollection;
        }
        constructor(instantiationService, fileService, undoRedoService, modelService, uriIdentityService) {
            super();
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.undoRedoService = undoRedoService;
            this.modelService = modelService;
            this.uriIdentityService = uriIdentityService;
            this._resourceModelCollection = undefined;
            this._asyncModelCollection = undefined;
            this._register(new modelUndoRedoParticipant_1.ModelUndoRedoParticipant(this.modelService, this, this.undoRedoService));
        }
        async createModelReference(resource) {
            // From this moment on, only operate on the canonical resource
            // to ensure we reduce the chance of resolving the same resource
            // with different resource forms (e.g. path casing on Windows)
            resource = this.uriIdentityService.asCanonicalUri(resource);
            return await this.asyncModelCollection.acquire(resource.toString());
        }
        registerTextModelContentProvider(scheme, provider) {
            return this.resourceModelCollection.registerTextModelContentProvider(scheme, provider);
        }
        canHandleResource(resource) {
            if (this.fileService.hasProvider(resource) || resource.scheme === network_1.Schemas.untitled || resource.scheme === network_1.Schemas.inMemory) {
                return true; // we handle file://, untitled:// and inMemory:// automatically
            }
            return this.resourceModelCollection.hasTextModelContentProvider(resource.scheme);
        }
    };
    exports.TextModelResolverService = TextModelResolverService;
    exports.TextModelResolverService = TextModelResolverService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, files_1.IFileService),
        __param(2, undoRedo_1.IUndoRedoService),
        __param(3, model_1.IModelService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], TextModelResolverService);
    (0, extensions_1.registerSingleton)(resolverService_1.ITextModelService, TextModelResolverService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRtb2RlbFJlc29sdmVyL2NvbW1vbi90ZXh0TW9kZWxSZXNvbHZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLCtCQUFzRDtRQUszRixZQUN3QixvQkFBNEQsRUFDakUsZUFBa0QsRUFDdEQsV0FBMEMsRUFDekMsWUFBNEM7WUFFM0QsS0FBSyxFQUFFLENBQUM7WUFMZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNoRCxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDckMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDeEIsaUJBQVksR0FBWixZQUFZLENBQWU7WUFQM0MsY0FBUyxHQUFHLElBQUksR0FBRyxFQUF1QyxDQUFDO1lBQzNELG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQVNyRCxDQUFDO1FBRVMsc0JBQXNCLENBQUMsR0FBVztZQUMzQyxPQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRU8sS0FBSyxDQUFDLHdCQUF3QixDQUFDLEdBQVcsRUFBRSxvQkFBOEI7WUFFakYsNEJBQTRCO1lBQzVCLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRWpDLGtEQUFrRDtZQUNsRCxNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMxQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDekQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRCxDQUFDO2dCQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaURBQXVCLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzFGLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUMxQyxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO1lBQ0YsQ0FBQztZQUVELG9EQUFvRDtZQUNwRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDMUMsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRixJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDMUMsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUM7WUFFRCxvREFBb0Q7WUFDcEQsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLHlDQUFpQyxFQUFFLENBQUMsQ0FBQztnQkFDOUcsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzFDLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7WUFDRixDQUFDO1lBRUQsb0JBQW9CO1lBQ3BCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUV4QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlEQUF1QixFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMxRixJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDMUMsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUM7WUFFRCxnRUFBZ0U7WUFDaEUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzNCLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXpELE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU8sbUJBQW1CLENBQUMsS0FBdUIsRUFBRSxHQUFXO1lBQy9ELElBQUksSUFBQSwyQ0FBeUIsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFUyx1QkFBdUIsQ0FBQyxHQUFXLEVBQUUsWUFBdUM7WUFFckYsNkNBQTZDO1lBQzdDLE1BQU0sUUFBUSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzFDLE9BQU87WUFDUixDQUFDO1lBRUQsMkRBQTJEO1lBQzNELDBEQUEwRDtZQUMxRCxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUU5QixDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNYLElBQUksQ0FBQztvQkFDSixNQUFNLEtBQUssR0FBRyxNQUFNLFlBQVksQ0FBQztvQkFFakMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3BDLG9EQUFvRDt3QkFDcEQsT0FBTztvQkFDUixDQUFDO29CQUVELElBQUksS0FBSyxZQUFZLHlDQUFtQixFQUFFLENBQUM7d0JBQzFDLHFEQUFxRDt3QkFDckQsd0RBQXdEO3dCQUN4RCxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDcEQsQ0FBQzt5QkFBTSxJQUFJLEtBQUssWUFBWSxpREFBdUIsRUFBRSxDQUFDO3dCQUNyRCx5REFBeUQ7d0JBQ3pELHdEQUF3RDt3QkFDeEQsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3ZELENBQUM7b0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3BDLG9EQUFvRDt3QkFDcEQsT0FBTztvQkFDUixDQUFDO29CQUVELG1DQUFtQztvQkFDbkMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLFNBQVM7Z0JBQ1YsQ0FBQzt3QkFBUyxDQUFDO29CQUNWLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsNEJBQTRCO2dCQUMvRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNOLENBQUM7UUFFRCxnQ0FBZ0MsQ0FBQyxNQUFjLEVBQUUsUUFBbUM7WUFDbkYsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixTQUFTLEdBQUcsRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBRUQsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU1QixPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUN6QixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxLQUFLLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNsQixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsa0JBQWtCLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFcEMsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3JDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMvQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsMkJBQTJCLENBQUMsTUFBYztZQUN6QyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLFNBQVMsQ0FBQztRQUNqRCxDQUFDO1FBRU8sS0FBSyxDQUFDLHVCQUF1QixDQUFDLEdBQVc7WUFDaEQsTUFBTSxRQUFRLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoQyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFckUsS0FBSyxNQUFNLFFBQVEsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLEtBQUssR0FBRyxNQUFNLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMscURBQXFELEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDN0UsQ0FBQztLQUNELENBQUE7SUE1S0ssdUJBQXVCO1FBTTFCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw0QkFBZ0IsQ0FBQTtRQUNoQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLHFCQUFhLENBQUE7T0FUVix1QkFBdUIsQ0E0SzVCO0lBRU0sSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtRQUt2RCxJQUFZLHVCQUF1QjtZQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDbkcsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDO1FBQ3RDLENBQUM7UUFHRCxJQUFZLG9CQUFvQjtZQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLG9DQUF3QixDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3pGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztRQUNuQyxDQUFDO1FBRUQsWUFDd0Isb0JBQTRELEVBQ3JFLFdBQTBDLEVBQ3RDLGVBQWtELEVBQ3JELFlBQTRDLEVBQ3RDLGtCQUF3RDtZQUU3RSxLQUFLLEVBQUUsQ0FBQztZQU5nQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3BELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3JCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNwQyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNyQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBdkJ0RSw2QkFBd0IsR0FBK0csU0FBUyxDQUFDO1lBU2pKLDBCQUFxQixHQUFtRSxTQUFTLENBQUM7WUFrQnpHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxtREFBd0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUM3RixDQUFDO1FBRUQsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFFBQWE7WUFFdkMsOERBQThEO1lBQzlELGdFQUFnRTtZQUNoRSw4REFBOEQ7WUFDOUQsUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFNUQsT0FBTyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELGdDQUFnQyxDQUFDLE1BQWMsRUFBRSxRQUFtQztZQUNuRixPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVELGlCQUFpQixDQUFDLFFBQWE7WUFDOUIsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDNUgsT0FBTyxJQUFJLENBQUMsQ0FBQywrREFBK0Q7WUFDN0UsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLDJCQUEyQixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRixDQUFDO0tBQ0QsQ0FBQTtJQXZEWSw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQXVCbEMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsaUNBQW1CLENBQUE7T0EzQlQsd0JBQXdCLENBdURwQztJQUVELElBQUEsOEJBQWlCLEVBQUMsbUNBQWlCLEVBQUUsd0JBQXdCLG9DQUE0QixDQUFDIn0=