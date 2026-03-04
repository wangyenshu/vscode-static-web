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
define(["require", "exports", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/model/editStack"], function (require, exports, model_1, resolverService_1, lifecycle_1, undoRedo_1, editStack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModelUndoRedoParticipant = void 0;
    let ModelUndoRedoParticipant = class ModelUndoRedoParticipant extends lifecycle_1.Disposable {
        constructor(_modelService, _textModelService, _undoRedoService) {
            super();
            this._modelService = _modelService;
            this._textModelService = _textModelService;
            this._undoRedoService = _undoRedoService;
            this._register(this._modelService.onModelRemoved((model) => {
                // a model will get disposed, so let's check if the undo redo stack is maintained
                const elements = this._undoRedoService.getElements(model.uri);
                if (elements.past.length === 0 && elements.future.length === 0) {
                    return;
                }
                for (const element of elements.past) {
                    if (element instanceof editStack_1.MultiModelEditStackElement) {
                        element.setDelegate(this);
                    }
                }
                for (const element of elements.future) {
                    if (element instanceof editStack_1.MultiModelEditStackElement) {
                        element.setDelegate(this);
                    }
                }
            }));
        }
        prepareUndoRedo(element) {
            // Load all the needed text models
            const missingModels = element.getMissingModels();
            if (missingModels.length === 0) {
                // All models are available!
                return lifecycle_1.Disposable.None;
            }
            const disposablesPromises = missingModels.map(async (uri) => {
                try {
                    const reference = await this._textModelService.createModelReference(uri);
                    return reference;
                }
                catch (err) {
                    // This model could not be loaded, maybe it was deleted in the meantime?
                    return lifecycle_1.Disposable.None;
                }
            });
            return Promise.all(disposablesPromises).then(disposables => {
                return {
                    dispose: () => (0, lifecycle_1.dispose)(disposables)
                };
            });
        }
    };
    exports.ModelUndoRedoParticipant = ModelUndoRedoParticipant;
    exports.ModelUndoRedoParticipant = ModelUndoRedoParticipant = __decorate([
        __param(0, model_1.IModelService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, undoRedo_1.IUndoRedoService)
    ], ModelUndoRedoParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxVbmRvUmVkb1BhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9zZXJ2aWNlcy9tb2RlbFVuZG9SZWRvUGFydGljaXBhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFDdkQsWUFDaUMsYUFBNEIsRUFDeEIsaUJBQW9DLEVBQ3JDLGdCQUFrQztZQUVyRSxLQUFLLEVBQUUsQ0FBQztZQUp3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUN4QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3JDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFHckUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUMxRCxpRkFBaUY7Z0JBQ2pGLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM5RCxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDaEUsT0FBTztnQkFDUixDQUFDO2dCQUNELEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNyQyxJQUFJLE9BQU8sWUFBWSxzQ0FBMEIsRUFBRSxDQUFDO3dCQUNuRCxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUMzQixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3ZDLElBQUksT0FBTyxZQUFZLHNDQUEwQixFQUFFLENBQUM7d0JBQ25ELE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzNCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU0sZUFBZSxDQUFDLE9BQW1DO1lBQ3pELGtDQUFrQztZQUNsQyxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNqRCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLDRCQUE0QjtnQkFDNUIsT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQztZQUN4QixDQUFDO1lBRUQsTUFBTSxtQkFBbUIsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDM0QsSUFBSSxDQUFDO29CQUNKLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN6RSxPQUFvQixTQUFTLENBQUM7Z0JBQy9CLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCx3RUFBd0U7b0JBQ3hFLE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3hCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDMUQsT0FBTztvQkFDTixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSxtQkFBTyxFQUFDLFdBQVcsQ0FBQztpQkFDbkMsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUFsRFksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFFbEMsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxtQ0FBaUIsQ0FBQTtRQUNqQixXQUFBLDJCQUFnQixDQUFBO09BSk4sd0JBQXdCLENBa0RwQyJ9