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
define(["require", "exports", "vs/base/common/network", "vs/editor/browser/editorExtensions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/hover/browser/hover", "vs/platform/keybinding/common/keybinding", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/codeEditor/browser/emptyTextEditorHint/emptyTextEditorHint", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, network_1, editorExtensions_1, commands_1, configuration_1, hover_1, keybinding_1, productService_1, telemetry_1, emptyTextEditorHint_1, inlineChatSessionService_1, inlineChat_1, notebookBrowser_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmptyCellEditorHintContribution = void 0;
    let EmptyCellEditorHintContribution = class EmptyCellEditorHintContribution extends emptyTextEditorHint_1.EmptyTextEditorHintContribution {
        static { this.CONTRIB_ID = 'notebook.editor.contrib.emptyCellEditorHint'; }
        constructor(editor, _editorService, editorGroupsService, commandService, configurationService, hoverService, keybindingService, inlineChatSessionService, inlineChatService, telemetryService, productService) {
            super(editor, editorGroupsService, commandService, configurationService, hoverService, keybindingService, inlineChatSessionService, inlineChatService, telemetryService, productService);
            this._editorService = _editorService;
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (!activeEditor) {
                return;
            }
            this.toDispose.push(activeEditor.onDidChangeActiveCell(() => this.update()));
        }
        _getOptions() {
            return { clickable: false };
        }
        _shouldRenderHint() {
            const shouldRenderHint = super._shouldRenderHint();
            if (!shouldRenderHint) {
                return false;
            }
            const model = this.editor.getModel();
            if (!model) {
                return false;
            }
            const isNotebookCell = model?.uri.scheme === network_1.Schemas.vscodeNotebookCell;
            if (!isNotebookCell) {
                return false;
            }
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (!activeEditor) {
                return false;
            }
            const activeCell = activeEditor.getActiveCell();
            if (activeCell?.uri.fragment !== model.uri.fragment) {
                return false;
            }
            return true;
        }
    };
    exports.EmptyCellEditorHintContribution = EmptyCellEditorHintContribution;
    exports.EmptyCellEditorHintContribution = EmptyCellEditorHintContribution = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, commands_1.ICommandService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, hover_1.IHoverService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, inlineChatSessionService_1.IInlineChatSessionService),
        __param(8, inlineChat_1.IInlineChatService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, productService_1.IProductService)
    ], EmptyCellEditorHintContribution);
    (0, editorExtensions_1.registerEditorContribution)(EmptyCellEditorHintContribution.CONTRIB_ID, EmptyCellEditorHintContribution, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to render a help message
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHlDZWxsRWRpdG9ySGludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9lZGl0b3JIaW50L2VtcHR5Q2VsbEVkaXRvckhpbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUFnQyxTQUFRLHFEQUErQjtpQkFDNUQsZUFBVSxHQUFHLDZDQUE2QyxBQUFoRCxDQUFpRDtRQUNsRixZQUNDLE1BQW1CLEVBQ2MsY0FBOEIsRUFDekMsbUJBQXlDLEVBQzlDLGNBQStCLEVBQ3pCLG9CQUEyQyxFQUNuRCxZQUEyQixFQUN0QixpQkFBcUMsRUFDOUIsd0JBQW1ELEVBQzFELGlCQUFxQyxFQUN0QyxnQkFBbUMsRUFDckMsY0FBK0I7WUFFaEQsS0FBSyxDQUNKLE1BQU0sRUFDTixtQkFBbUIsRUFDbkIsY0FBYyxFQUNkLG9CQUFvQixFQUNwQixZQUFZLEVBQ1osaUJBQWlCLEVBQ2pCLHdCQUF3QixFQUN4QixpQkFBaUIsRUFDakIsZ0JBQWdCLEVBQ2hCLGNBQWMsQ0FDZCxDQUFDO1lBdEIrQixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUF3Qi9ELE1BQU0sWUFBWSxHQUFHLElBQUEsaURBQStCLEVBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRTNGLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDbkIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRWtCLFdBQVc7WUFDN0IsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUM3QixDQUFDO1FBRWtCLGlCQUFpQjtZQUNuQyxNQUFNLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ25ELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN2QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBRyxLQUFLLEVBQUUsR0FBRyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLGtCQUFrQixDQUFDO1lBQ3hFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUcsSUFBQSxpREFBK0IsRUFBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDM0YsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNuQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFaEQsSUFBSSxVQUFVLEVBQUUsR0FBRyxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNyRCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7O0lBckVXLDBFQUErQjs4Q0FBL0IsK0JBQStCO1FBSXpDLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsMENBQW9CLENBQUE7UUFDcEIsV0FBQSwwQkFBZSxDQUFBO1FBQ2YsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsb0RBQXlCLENBQUE7UUFDekIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFlBQUEsZ0NBQWUsQ0FBQTtPQWJMLCtCQUErQixDQXNFM0M7SUFFRCxJQUFBLDZDQUEwQixFQUFDLCtCQUErQixDQUFDLFVBQVUsRUFBRSwrQkFBK0IsZ0RBQXdDLENBQUMsQ0FBQyxrREFBa0QifQ==