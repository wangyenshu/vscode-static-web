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
define(["require", "exports", "vs/base/common/assert", "vs/base/common/observable", "vs/base/common/resources", "vs/base/common/types", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/workbench/common/editor", "vs/workbench/services/editor/common/customEditorLabelService", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInputModel", "vs/workbench/contrib/mergeEditor/browser/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, assert_1, observable_1, resources_1, types_1, textResourceConfiguration_1, nls_1, configuration_1, files_1, instantiation_1, label_1, editor_1, customEditorLabelService_1, textResourceEditorInput_1, mergeEditorInputModel_1, telemetry_1, editorService_1, filesConfigurationService_1, textfiles_1) {
    "use strict";
    var MergeEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorInput = exports.MergeEditorInputData = void 0;
    class MergeEditorInputData {
        constructor(uri, title, detail, description) {
            this.uri = uri;
            this.title = title;
            this.detail = detail;
            this.description = description;
        }
    }
    exports.MergeEditorInputData = MergeEditorInputData;
    let MergeEditorInput = class MergeEditorInput extends textResourceEditorInput_1.AbstractTextResourceEditorInput {
        static { MergeEditorInput_1 = this; }
        static { this.ID = 'mergeEditor.Input'; }
        get useWorkingCopy() {
            return this.configurationService.getValue('mergeEditor.useWorkingCopy') ?? false;
        }
        constructor(base, input1, input2, result, _instaService, editorService, textFileService, labelService, fileService, configurationService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService) {
            super(result, undefined, editorService, textFileService, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
            this.base = base;
            this.input1 = input1;
            this.input2 = input2;
            this.result = result;
            this._instaService = _instaService;
            this.configurationService = configurationService;
            this.closeHandler = {
                showConfirm: () => this._inputModel?.shouldConfirmClose() ?? false,
                confirm: async (editors) => {
                    (0, assert_1.assertFn)(() => editors.every(e => e.editor instanceof MergeEditorInput_1));
                    const inputModels = editors.map(e => e.editor._inputModel).filter(types_1.isDefined);
                    return await this._inputModel.confirmClose(inputModels);
                },
            };
            this.mergeEditorModeFactory = this._instaService.createInstance(this.useWorkingCopy
                ? mergeEditorInputModel_1.TempFileMergeEditorModeFactory
                : mergeEditorInputModel_1.WorkspaceMergeEditorModeFactory, this._instaService.createInstance(telemetry_1.MergeEditorTelemetry));
        }
        dispose() {
            super.dispose();
        }
        get typeId() {
            return MergeEditorInput_1.ID;
        }
        get editorId() {
            return editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        }
        get capabilities() {
            let capabilities = super.capabilities | 256 /* EditorInputCapabilities.MultipleEditors */;
            if (this.useWorkingCopy) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            return capabilities;
        }
        getName() {
            return (0, nls_1.localize)('name', "Merging: {0}", super.getName());
        }
        async resolve() {
            if (!this._inputModel) {
                const inputModel = this._register(await this.mergeEditorModeFactory.createInputModel({
                    base: this.base,
                    input1: this.input1,
                    input2: this.input2,
                    result: this.result,
                }));
                this._inputModel = inputModel;
                this._register((0, observable_1.autorun)(reader => {
                    /** @description fire dirty event */
                    inputModel.isDirty.read(reader);
                    this._onDidChangeDirty.fire();
                }));
                await this._inputModel.model.onInitialized;
            }
            return this._inputModel;
        }
        async accept() {
            await this._inputModel?.accept();
        }
        async save(group, options) {
            await this._inputModel?.save(options);
            return undefined;
        }
        toUntyped() {
            return {
                input1: { resource: this.input1.uri, label: this.input1.title, description: this.input1.description, detail: this.input1.detail },
                input2: { resource: this.input2.uri, label: this.input2.title, description: this.input2.description, detail: this.input2.detail },
                base: { resource: this.base },
                result: { resource: this.result },
                options: {
                    override: this.typeId
                }
            };
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof MergeEditorInput_1) {
                return (0, resources_1.isEqual)(this.base, otherInput.base)
                    && (0, resources_1.isEqual)(this.input1.uri, otherInput.input1.uri)
                    && (0, resources_1.isEqual)(this.input2.uri, otherInput.input2.uri)
                    && (0, resources_1.isEqual)(this.result, otherInput.result);
            }
            if ((0, editor_1.isResourceMergeEditorInput)(otherInput)) {
                return (this.editorId === otherInput.options?.override || otherInput.options?.override === undefined)
                    && (0, resources_1.isEqual)(this.base, otherInput.base.resource)
                    && (0, resources_1.isEqual)(this.input1.uri, otherInput.input1.resource)
                    && (0, resources_1.isEqual)(this.input2.uri, otherInput.input2.resource)
                    && (0, resources_1.isEqual)(this.result, otherInput.result.resource);
            }
            return false;
        }
        async revert(group, options) {
            return this._inputModel?.revert(options);
        }
        // ---- FileEditorInput
        isDirty() {
            return this._inputModel?.isDirty.get() ?? false;
        }
        setLanguageId(languageId, source) {
            this._inputModel?.model.setLanguageId(languageId, source);
        }
    };
    exports.MergeEditorInput = MergeEditorInput;
    exports.MergeEditorInput = MergeEditorInput = MergeEditorInput_1 = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, editorService_1.IEditorService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, label_1.ILabelService),
        __param(8, files_1.IFileService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, filesConfigurationService_1.IFilesConfigurationService),
        __param(11, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(12, customEditorLabelService_1.ICustomEditorLabelService)
    ], MergeEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvbWVyZ2VFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUJoRyxNQUFhLG9CQUFvQjtRQUNoQyxZQUNVLEdBQVEsRUFDUixLQUF5QixFQUN6QixNQUEwQixFQUMxQixXQUErQjtZQUgvQixRQUFHLEdBQUgsR0FBRyxDQUFLO1lBQ1IsVUFBSyxHQUFMLEtBQUssQ0FBb0I7WUFDekIsV0FBTSxHQUFOLE1BQU0sQ0FBb0I7WUFDMUIsZ0JBQVcsR0FBWCxXQUFXLENBQW9CO1FBQ3JDLENBQUM7S0FDTDtJQVBELG9EQU9DO0lBRU0sSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSx5REFBK0I7O2lCQUNwRCxPQUFFLEdBQUcsbUJBQW1CLEFBQXRCLENBQXVCO1FBYXpDLElBQVksY0FBYztZQUN6QixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLENBQUMsSUFBSSxLQUFLLENBQUM7UUFDbEYsQ0FBQztRQUVELFlBQ2lCLElBQVMsRUFDVCxNQUE0QixFQUM1QixNQUE0QixFQUM1QixNQUFXLEVBQ0osYUFBcUQsRUFDNUQsYUFBNkIsRUFDM0IsZUFBaUMsRUFDcEMsWUFBMkIsRUFDNUIsV0FBeUIsRUFDaEIsb0JBQTRELEVBQ3ZELHlCQUFxRCxFQUM5QyxnQ0FBbUUsRUFDM0Usd0JBQW1EO1lBRTlFLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSx5QkFBeUIsRUFBRSxnQ0FBZ0MsRUFBRSx3QkFBd0IsQ0FB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