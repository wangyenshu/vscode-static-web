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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/utils", "vs/editor/browser/widget/diffEditor/diffEditorOptions", "vs/editor/browser/widget/diffEditor/diffEditorViewModel", "vs/editor/common/services/model", "vs/platform/instantiation/common/instantiation"], function (require, exports, lifecycle_1, observable_1, utils_1, diffEditorOptions_1, diffEditorViewModel_1, model_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentDiffItemViewModel = exports.MultiDiffEditorViewModel = void 0;
    class MultiDiffEditorViewModel extends lifecycle_1.Disposable {
        async waitForDiffs() {
            for (const d of this.items.get()) {
                await d.diffEditorViewModel.waitForDiff();
            }
        }
        collapseAll() {
            (0, observable_1.transaction)(tx => {
                for (const d of this.items.get()) {
                    d.collapsed.set(true, tx);
                }
            });
        }
        expandAll() {
            (0, observable_1.transaction)(tx => {
                for (const d of this.items.get()) {
                    d.collapsed.set(false, tx);
                }
            });
        }
        get contextKeys() {
            return this.model.contextKeys;
        }
        constructor(model, _instantiationService) {
            super();
            this.model = model;
            this._instantiationService = _instantiationService;
            this._documents = (0, utils_1.observableFromValueWithChangeEvent)(this.model, this.model.documents);
            this.items = (0, utils_1.mapObservableArrayCached)(this, this._documents, (d, store) => store.add(this._instantiationService.createInstance(DocumentDiffItemViewModel, d, this)))
                .recomputeInitiallyAndOnChange(this._store);
            this.focusedDiffItem = (0, observable_1.derived)(this, reader => this.items.read(reader).find(i => i.isFocused.read(reader)));
            this.activeDiffItem = (0, utils_1.derivedObservableWithWritableCache)(this, (reader, lastValue) => this.focusedDiffItem.read(reader) ?? lastValue);
        }
    }
    exports.MultiDiffEditorViewModel = MultiDiffEditorViewModel;
    let DocumentDiffItemViewModel = class DocumentDiffItemViewModel extends lifecycle_1.Disposable {
        get originalUri() { return this.entry.value.original?.uri; }
        get modifiedUri() { return this.entry.value.modified?.uri; }
        setIsFocused(source, tx) {
            this._isFocusedSource.set(source, tx);
        }
        constructor(entry, _editorViewModel, _instantiationService, _modelService) {
            super();
            this.entry = entry;
            this._editorViewModel = _editorViewModel;
            this._instantiationService = _instantiationService;
            this._modelService = _modelService;
            this.collapsed = (0, observable_1.observableValue)(this, false);
            this.lastTemplateData = (0, observable_1.observableValue)(this, { contentHeight: 500, selections: undefined, });
            this.isActive = (0, observable_1.derived)(this, reader => this._editorViewModel.activeDiffItem.read(reader) === this);
            this._isFocusedSource = (0, observable_1.observableValue)(this, (0, utils_1.constObservable)(false));
            this.isFocused = (0, observable_1.derived)(this, reader => this._isFocusedSource.read(reader).read(reader));
            function updateOptions(options) {
                return {
                    ...options,
                    hideUnchangedRegions: {
                        enabled: true,
                    },
                };
            }
            const options = this._instantiationService.createInstance(diffEditorOptions_1.DiffEditorOptions, updateOptions(this.entry.value.options || {}));
            if (this.entry.value.onOptionsDidChange) {
                this._register(this.entry.value.onOptionsDidChange(() => {
                    options.updateOptions(updateOptions(this.entry.value.options || {}));
                }));
            }
            const originalTextModel = this.entry.value.original ?? this._register(this._modelService.createModel('', null));
            const modifiedTextModel = this.entry.value.modified ?? this._register(this._modelService.createModel('', null));
            this.diffEditorViewModel = this._register(this._instantiationService.createInstance(diffEditorViewModel_1.DiffEditorViewModel, {
                original: originalTextModel,
                modified: modifiedTextModel,
            }, options));
        }
        getKey() {
            return JSON.stringify([
                this.originalUri?.toString(),
                this.modifiedUri?.toString()
            ]);
        }
    };
    exports.DocumentDiffItemViewModel = DocumentDiffItemViewModel;
    exports.DocumentDiffItemViewModel = DocumentDiffItemViewModel = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, model_1.IModelService)
    ], DocumentDiffItemViewModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yVmlld01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L211bHRpRGlmZkVkaXRvci9tdWx0aURpZmZFZGl0b3JWaWV3TW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0JoRyxNQUFhLHdCQUF5QixTQUFRLHNCQUFVO1FBU2hELEtBQUssQ0FBQyxZQUFZO1lBQ3hCLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzQyxDQUFDO1FBQ0YsQ0FBQztRQUVNLFdBQVc7WUFDakIsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNoQixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztvQkFDbEMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMzQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sU0FBUztZQUNmLElBQUEsd0JBQVcsRUFBQyxFQUFFLENBQUMsRUFBRTtnQkFDaEIsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7b0JBQ2xDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQVcsV0FBVztZQUNy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