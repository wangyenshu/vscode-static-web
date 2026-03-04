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
define(["require", "exports", "vs/base/common/network", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/services/textfile/common/textEditorService", "vs/base/common/resources", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/untitled/common/untitledTextEditorService"], function (require, exports, network_1, lifecycle_1, uri_1, textEditorService_1, resources_1, modesRegistry_1, environmentService_1, filesConfigurationService_1, pathService_1, untitledTextEditorInput_1, workingCopy_1, workingCopyEditorService_1, untitledTextEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorWorkingCopyEditorHandler = exports.UntitledTextEditorInputSerializer = void 0;
    let UntitledTextEditorInputSerializer = class UntitledTextEditorInputSerializer {
        constructor(filesConfigurationService, environmentService, pathService) {
            this.filesConfigurationService = filesConfigurationService;
            this.environmentService = environmentService;
            this.pathService = pathService;
        }
        canSerialize(editorInput) {
            return this.filesConfigurationService.isHotExitEnabled && !editorInput.isDisposed();
        }
        serialize(editorInput) {
            if (!this.canSerialize(editorInput)) {
                return undefined;
            }
            const untitledTextEditorInput = editorInput;
            let resource = untitledTextEditorInput.resource;
            if (untitledTextEditorInput.hasAssociatedFilePath) {
                resource = (0, resources_1.toLocalResource)(resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme); // untitled with associated file path use the local schema
            }
            // Language: only remember language if it is either specific (not text)
            // or if the language was explicitly set by the user. We want to preserve
            // this information across restarts and not set the language unless
            // this is the case.
            let languageId;
            const languageIdCandidate = untitledTextEditorInput.getLanguageId();
            if (languageIdCandidate !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                languageId = languageIdCandidate;
            }
            else if (untitledTextEditorInput.hasLanguageSetExplicitly) {
                languageId = languageIdCandidate;
            }
            const serialized = {
                resourceJSON: resource.toJSON(),
                modeId: languageId,
                encoding: untitledTextEditorInput.getEncoding()
            };
            return JSON.stringify(serialized);
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.invokeFunction(accessor => {
                const deserialized = JSON.parse(serializedEditorInput);
                const resource = uri_1.URI.revive(deserialized.resourceJSON);
                const languageId = deserialized.modeId;
                const encoding = deserialized.encoding;
                return accessor.get(textEditorService_1.ITextEditorService).createTextEditor({ resource, languageId, encoding, forceUntitled: true });
            });
        }
    };
    exports.UntitledTextEditorInputSerializer = UntitledTextEditorInputSerializer;
    exports.UntitledTextEditorInputSerializer = UntitledTextEditorInputSerializer = __decorate([
        __param(0, filesConfigurationService_1.IFilesConfigurationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, pathService_1.IPathService)
    ], UntitledTextEditorInputSerializer);
    let UntitledTextEditorWorkingCopyEditorHandler = class UntitledTextEditorWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.untitledTextEditorWorkingCopyEditorHandler'; }
        constructor(workingCopyEditorService, environmentService, pathService, textEditorService, untitledTextEditorService) {
            super();
            this.environmentService = environmentService;
            this.pathService = pathService;
            this.textEditorService = textEditorService;
            this.untitledTextEditorService = untitledTextEditorService;
            this._register(workingCopyEditorService.registerHandler(this));
        }
        handles(workingCopy) {
            return workingCopy.resource.scheme === network_1.Schemas.untitled && workingCopy.typeId === workingCopy_1.NO_TYPE_ID;
        }
        isOpen(workingCopy, editor) {
            if (!this.handles(workingCopy)) {
                return false;
            }
            return editor instanceof untitledTextEditorInput_1.UntitledTextEditorInput && (0, resources_1.isEqual)(workingCopy.resource, editor.resource);
        }
        createEditor(workingCopy) {
            let editorInputResource;
            // If the untitled has an associated resource,
            // ensure to restore the local resource it had
            if (this.untitledTextEditorService.isUntitledWithAssociatedResource(workingCopy.resource)) {
                editorInputResource = (0, resources_1.toLocalResource)(workingCopy.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme);
            }
            else {
                editorInputResource = workingCopy.resource;
            }
            return this.textEditorService.createTextEditor({ resource: editorInputResource, forceUntitled: true });
        }
    };
    exports.UntitledTextEditorWorkingCopyEditorHandler = UntitledTextEditorWorkingCopyEditorHandler;
    exports.UntitledTextEditorWorkingCopyEditorHandler = UntitledTextEditorWorkingCopyEditorHandler = __decorate([
        __param(0, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, pathService_1.IPathService),
        __param(3, textEditorService_1.ITextEditorService),
        __param(4, untitledTextEditorService_1.IUntitledTextEditorService)
    ], UntitledTextEditorWorkingCopyEditorHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRUZXh0RWRpdG9ySGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91bnRpdGxlZC9jb21tb24vdW50aXRsZWRUZXh0RWRpdG9ySGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQnpGLElBQU0saUNBQWlDLEdBQXZDLE1BQU0saUNBQWlDO1FBRTdDLFlBQzhDLHlCQUFxRCxFQUNuRCxrQkFBZ0QsRUFDaEUsV0FBeUI7WUFGWCw4QkFBeUIsR0FBekIseUJBQXlCLENBQTRCO1lBQ25ELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDaEUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7UUFDckQsQ0FBQztRQUVMLFlBQVksQ0FBQyxXQUF3QjtZQUNwQyxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNyRixDQUFDO1FBRUQsU0FBUyxDQUFDLFdBQXdCO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLHVCQUF1QixHQUFHLFdBQXNDLENBQUM7WUFFdkUsSUFBSSxRQUFRLEdBQUcsdUJBQXVCLENBQUMsUUFBUSxDQUFDO1lBQ2hELElBQUksdUJBQXVCLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDbkQsUUFBUSxHQUFHLElBQUEsMkJBQWUsRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQywwREFBMEQ7WUFD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