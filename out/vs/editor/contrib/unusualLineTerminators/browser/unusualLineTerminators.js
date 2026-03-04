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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/dialogs/common/dialogs"], function (require, exports, lifecycle_1, resources_1, editorExtensions_1, codeEditorService_1, nls, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnusualLineTerminatorsDetector = void 0;
    const ignoreUnusualLineTerminators = 'ignoreUnusualLineTerminators';
    function writeIgnoreState(codeEditorService, model, state) {
        codeEditorService.setModelProperty(model.uri, ignoreUnusualLineTerminators, state);
    }
    function readIgnoreState(codeEditorService, model) {
        return codeEditorService.getModelProperty(model.uri, ignoreUnusualLineTerminators);
    }
    let UnusualLineTerminatorsDetector = class UnusualLineTerminatorsDetector extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.unusualLineTerminatorsDetector'; }
        constructor(_editor, _dialogService, _codeEditorService) {
            super();
            this._editor = _editor;
            this._dialogService = _dialogService;
            this._codeEditorService = _codeEditorService;
            this._isPresentingDialog = false;
            this._config = this._editor.getOption(126 /* EditorOption.unusualLineTerminators */);
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(126 /* EditorOption.unusualLineTerminators */)) {
                    this._config = this._editor.getOption(126 /* EditorOption.unusualLineTerminators */);
                    this._checkForUnusualLineTerminators();
                }
            }));
            this._register(this._editor.onDidChangeModel(() => {
                this._checkForUnusualLineTerminators();
            }));
            this._register(this._editor.onDidChangeModelContent((e) => {
                if (e.isUndoing) {
                    // skip checking in case of undoing
                    return;
                }
                this._checkForUnusualLineTerminators();
            }));
            this._checkForUnusualLineTerminators();
        }
        async _checkForUnusualLineTerminators() {
            if (this._config === 'off') {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            if (!model.mightContainUnusualLineTerminators()) {
                return;
            }
            const ignoreState = readIgnoreState(this._codeEditorService, model);
            if (ignoreState === true) {
                // this model should be ignored
                return;
            }
            if (this._editor.getOption(91 /* EditorOption.readOnly */)) {
                // read only editor => sorry!
                return;
            }
            if (this._config === 'auto') {
                // just do it!
                model.removeUnusualLineTerminators(this._editor.getSelections());
                return;
            }
            if (this._isPresentingDialog) {
                // we're currently showing the dialog, which is async.
                // avoid spamming the user
                return;
            }
            let result;
            try {
                this._isPresentingDialog = true;
                result = await this._dialogService.confirm({
                    title: nls.localize('unusualLineTerminators.title', "Unusual Line Terminators"),
                    message: nls.localize('unusualLineTerminators.message', "Detected unusual line terminators"),
                    detail: nls.localize('unusualLineTerminators.detail', "The file '{0}' contains one or more unusual line terminator characters, like Line Separator (LS) or Paragraph Separator (PS).\n\nIt is recommended to remove them from the file. This can be configured via `editor.unusualLineTerminators`.", (0, resources_1.basename)(model.uri)),
                    primaryButton: nls.localize({ key: 'unusualLineTerminators.fix', comment: ['&& denotes a mnemonic'] }, "&&Remove Unusual Line Terminators"),
                    cancelButton: nls.localize('unusualLineTerminators.ignore', "Ignore")
                });
            }
            finally {
                this._isPresentingDialog = false;
            }
            if (!result.confirmed) {
                // this model should be ignored
                writeIgnoreState(this._codeEditorService, model, true);
                return;
            }
            model.removeUnusualLineTerminators(this._editor.getSelections());
        }
    };
    exports.UnusualLineTerminatorsDetector = UnusualLineTerminatorsDetector;
    exports.UnusualLineTerminatorsDetector = UnusualLineTerminatorsDetector = __decorate([
        __param(1, dialogs_1.IDialogService),
        __param(2, codeEditorService_1.ICodeEditorService)
    ], UnusualLineTerminatorsDetector);
    (0, editorExtensions_1.registerEditorContribution)(UnusualLineTerminatorsDetector.ID, UnusualLineTerminatorsDetector, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW51c3VhbExpbmVUZXJtaW5hdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3VudXN1YWxMaW5lVGVybWluYXRvcnMvYnJvd3Nlci91bnVzdWFsTGluZVRlcm1pbmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxNQUFNLDRCQUE0QixHQUFHLDhCQUE4QixDQUFDO0lBRXBFLFNBQVMsZ0JBQWdCLENBQUMsaUJBQXFDLEVBQUUsS0FBaUIsRUFBRSxLQUFjO1FBQ2pHLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEYsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFDLGlCQUFxQyxFQUFFLEtBQWlCO1FBQ2hGLE9BQU8saUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFTSxJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLHNCQUFVO2lCQUV0QyxPQUFFLEdBQUcsK0NBQStDLEFBQWxELENBQW1EO1FBSzVFLFlBQ2tCLE9BQW9CLEVBQ3JCLGNBQStDLEVBQzNDLGtCQUF1RDtZQUUzRSxLQUFLLEVBQUUsQ0FBQztZQUpTLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDSixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDMUIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUxwRSx3QkFBbUIsR0FBWSxLQUFLLENBQUM7WUFTNUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsK0NBQXFDLENBQUM7WUFDM0UsSUFBSSxDQUFDLFNBQVMs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