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
define(["require", "exports", "vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidget", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/editorWithViewState", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/common/core/range"], function (require, exports, multiDiffEditorWidget_1, textResourceConfiguration_1, instantiation_1, storage_1, telemetry_1, themeService_1, labels_1, editorWithViewState_1, multiDiffEditorInput_1, editorGroupsService_1, editorService_1, range_1) {
    "use strict";
    var MultiDiffEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffEditor = void 0;
    let MultiDiffEditor = class MultiDiffEditor extends editorWithViewState_1.AbstractEditorWithViewState {
        static { MultiDiffEditor_1 = this; }
        static { this.ID = 'multiDiffEditor'; }
        get viewModel() {
            return this._viewModel;
        }
        constructor(group, instantiationService, telemetryService, themeService, storageService, editorService, editorGroupService, textResourceConfigurationService) {
            super(MultiDiffEditor_1.ID, group, 'multiDiffEditor', telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
            this._multiDiffEditorWidget = undefined;
        }
        createEditor(parent) {
            this._multiDiffEditorWidget = this._register(this.instantiationService.createInstance(multiDiffEditorWidget_1.MultiDiffEditorWidget, parent, this.instantiationService.createInstance(WorkbenchUIElementFactory)));
            this._register(this._multiDiffEditorWidget.onDidChangeActiveControl(() => {
                this._onDidChangeControl.fire();
            }));
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            this._viewModel = await input.getViewModel();
            this._multiDiffEditorWidget.setViewModel(this._viewModel);
            const viewState = this.loadEditorViewState(input, context);
            if (viewState) {
                this._multiDiffEditorWidget.setViewState(viewState);
            }
            this._applyOptions(options);
        }
        setOptions(options) {
            this._applyOptions(options);
        }
        _applyOptions(options) {
            const viewState = options?.viewState;
            if (!viewState || !viewState.revealData) {
                return;
            }
            this._multiDiffEditorWidget?.reveal(viewState.revealData.resource, {
                range: viewState.revealData.range ? range_1.Range.lift(viewState.revealData.range) : undefined,
                highlight: true
            });
        }
        async clearInput() {
            await super.clearInput();
            this._multiDiffEditorWidget.setViewModel(undefined);
        }
        layout(dimension) {
            this._multiDiffEditorWidget.layout(dimension);
        }
        getControl() {
            return this._multiDiffEditorWidget.getActiveControl();
        }
        focus() {
            super.focus();
            this._multiDiffEditorWidget?.getActiveControl()?.focus();
        }
        hasFocus() {
            return this._multiDiffEditorWidget?.getActiveControl()?.hasTextFocus() || super.hasFocus();
        }
        computeEditorViewState(resource) {
            return this._multiDiffEditorWidget.getViewState();
        }
        tracksEditorViewState(input) {
            return input instanceof multiDiffEditorInput_1.MultiDiffEditorInput;
        }
        toEditorViewStateResource(input) {
            return input.resource;
        }
        tryGetCodeEditor(resource) {
            return this._multiDiffEditorWidget.tryGetCodeEditor(resource);
        }
    };
    exports.MultiDiffEditor = MultiDiffEditor;
    exports.MultiDiffEditor = MultiDiffEditor = MultiDiffEditor_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, themeService_1.IThemeService),
        __param(4, storage_1.IStorageService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], MultiDiffEditor);
    let WorkbenchUIElementFactory = class WorkbenchUIElementFactory {
        constructor(_instantiationService) {
            this._instantiationService = _instantiationService;
        }
        createResourceLabel(element) {
            const label = this._instantiationService.createInstance(labels_1.ResourceLabel, element, {});
            return {
                setUri(uri, options = {}) {
                    if (!uri) {
                        label.element.clear();
                    }
                    else {
                        label.element.setFile(uri, { strikethrough: options.strikethrough });
                    }
                },
                dispose() {
                    label.dispose();
                }
            };
        }
    };
    WorkbenchUIElementFactory = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WorkbenchUIElementFactory);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbXVsdGlEaWZmRWRpdG9yL2Jyb3dzZXIvbXVsdGlEaWZmRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEyQnpGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsaURBQXNEOztpQkFDMUUsT0FBRSxHQUFHLGlCQUFpQixBQUFwQixDQUFxQjtRQUt2QyxJQUFXLFNBQVM7WUFDbkIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxZQUNDLEtBQW1CLEVBQ0ksb0JBQTBDLEVBQzlDLGdCQUFtQyxFQUN2QyxZQUEyQixFQUN6QixjQUErQixFQUNoQyxhQUE2QixFQUN2QixrQkFBd0MsRUFDM0IsZ0NBQW1FO1lBRXRHLEtBQUssQ0FDSixpQkFBZSxDQUFDLEVBQUUsRUFDbEIsS0FBSyxFQUNMLGlCQUFpQixFQUNqQixnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLGNBQWMsRUFDZCxnQ0FBZ0MsRUFDaEMsWUFBWSxFQUNaLGFBQWEsRUFDYixrQkFBa0IsQ0FDbEIsQ0FBQztZQTVCSywyQkFBc0IsR0FBc0MsU0FBUyxDQUFDO1FBNkI5RSxDQUFDO1FBRVMsWUFBWSxDQUFDLE1BQW1CO1lBQ3pDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQ3BGLDZDQUFxQixFQUNyQixNQUFNLEVBQ04sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUNuRSxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxz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