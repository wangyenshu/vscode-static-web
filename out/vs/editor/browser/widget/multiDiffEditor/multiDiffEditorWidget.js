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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidgetImpl", "./multiDiffEditorViewModel", "vs/platform/instantiation/common/instantiation", "vs/editor/browser/widget/multiDiffEditor/diffEditorItemTemplate", "vs/base/common/event", "./colors"], function (require, exports, lifecycle_1, observable_1, utils_1, multiDiffEditorWidgetImpl_1, multiDiffEditorViewModel_1, instantiation_1, diffEditorItemTemplate_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffEditorWidget = void 0;
    let MultiDiffEditorWidget = class MultiDiffEditorWidget extends lifecycle_1.Disposable {
        constructor(_element, _workbenchUIElementFactory, _instantiationService) {
            super();
            this._element = _element;
            this._workbenchUIElementFactory = _workbenchUIElementFactory;
            this._instantiationService = _instantiationService;
            this._dimension = (0, observable_1.observableValue)(this, undefined);
            this._viewModel = (0, observable_1.observableValue)(this, undefined);
            this._widgetImpl = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                (0, utils_1.readHotReloadableExport)(diffEditorItemTemplate_1.DiffEditorItemTemplate, reader);
                return store.add(this._instantiationService.createInstance(((0, utils_1.readHotReloadableExport)(multiDiffEditorWidgetImpl_1.MultiDiffEditorWidgetImpl, reader)), this._element, this._dimension, this._viewModel, this._workbenchUIElementFactory));
            });
            this._activeControl = (0, observable_1.derived)(this, (reader) => this._widgetImpl.read(reader).activeControl.read(reader));
            this.onDidChangeActiveControl = event_1.Event.fromObservableLight(this._activeControl);
            this._register((0, observable_1.recomputeInitiallyAndOnChange)(this._widgetImpl));
        }
        reveal(resource, options) {
            this._widgetImpl.get().reveal(resource, options);
        }
        createViewModel(model) {
            return new multiDiffEditorViewModel_1.MultiDiffEditorViewModel(model, this._instantiationService);
        }
        setViewModel(viewModel) {
            this._viewModel.set(viewModel, undefined);
        }
        layout(dimension) {
            this._dimension.set(dimension, undefined);
        }
        getActiveControl() {
            return this._activeControl.get();
        }
        getViewState() {
            return this._widgetImpl.get().getViewState();
        }
        setViewState(viewState) {
            this._widgetImpl.get().setViewState(viewState);
        }
        tryGetCodeEditor(resource) {
            return this._widgetImpl.get().tryGetCodeEditor(resource);
        }
    };
    exports.MultiDiffEditorWidget = MultiDiffEditorWidget;
    exports.MultiDiffEditorWidget = MultiDiffEditorWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], MultiDiffEditorWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L211bHRpRGlmZkVkaXRvci9tdWx0aURpZmZFZGl0b3JXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBZXBELFlBQ2tCLFFBQXFCLEVBQ3JCLDBCQUFzRCxFQUNoRCxxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFKUyxhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ3JCLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNEI7WUFDL0IsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQWpCcEUsZUFBVSxHQUFHLElBQUEsNEJBQWUsRUFBd0IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JFLGVBQVUsR0FBRyxJQUFBLDRCQUFlLEVBQXVDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVwRixnQkFBVyxHQUFHLElBQUEsNkJBQWdCLEVBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUN2RSxJQUFBLCtCQUF1QixFQUFDLCtDQUFzQixFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN4RCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUMxRCxJQUFBLCtCQUF1QixFQUFDLHFEQUF5QixFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQzNELElBQUksQ0FBQyxRQUFRLEVBQ2IsSUFBSSxDQUFDLFVBQVUsRUFDZixJQUFJLENBQUMsVUFBVSxFQUNmLElBQUksQ0FBQywwQkFBMEIsQ0FDL0IsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUE0QmMsbUJBQWMsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFNdEcsNkJBQXdCLEdBQUcsYUFBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQXpCekYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDBDQUE2QixFQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFTSxNQUFNLENBQUMsUUFBOEIsRUFBRSxPQUF1QjtZQUNwRSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVNLGVBQWUsQ0FBQyxLQUE0QjtZQUNsRCxPQUFPLElBQUksbURBQXdCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFTSxZQUFZLENBQUMsU0FBK0M7WUFDbEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFTSxNQUFNLENBQUMsU0FBb0I7WUFDakMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFJTSxnQkFBZ0I7WUFDdEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFJTSxZQUFZO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUM5QyxDQUFDO1FBRU0sWUFBWSxDQUFDLFNBQW9DO1lBQ3ZELElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFTSxnQkFBZ0IsQ0FBQyxRQUFhO1lBQ3BDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBQ0QsQ0FBQTtJQTVEWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQWtCL0IsV0FBQSxxQ0FBcUIsQ0FBQTtPQWxCWCxxQkFBcUIsQ0E0RGpDIn0=