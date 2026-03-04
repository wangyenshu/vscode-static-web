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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/selection", "vs/editor/contrib/codelens/browser/codelensController", "vs/editor/contrib/folding/browser/folding", "vs/platform/actions/browser/toolbar", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/editor", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, dom_1, event_1, lifecycle_1, observable_1, editorExtensions_1, codeEditorWidget_1, selection_1, codelensController_1, folding_1, toolbar_1, instantiation_1, editor_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TitleMenu = exports.CodeEditorView = void 0;
    exports.createSelectionsAutorun = createSelectionsAutorun;
    class CodeEditorView extends lifecycle_1.Disposable {
        updateOptions(newOptions) {
            this.editor.updateOptions(newOptions);
        }
        constructor(instantiationService, viewModel, configurationService) {
            super();
            this.instantiationService = instantiationService;
            this.viewModel = viewModel;
            this.configurationService = configurationService;
            this.model = this.viewModel.map(m => /** @description model */ m?.model);
            this.htmlElements = (0, dom_1.h)('div.code-view', [
                (0, dom_1.h)('div.header@header', [
                    (0, dom_1.h)('span.title@title'),
                    (0, dom_1.h)('span.description@description'),
                    (0, dom_1.h)('span.detail@detail'),
                    (0, dom_1.h)('span.toolbar@toolbar'),
                ]),
                (0, dom_1.h)('div.container', [
                    (0, dom_1.h)('div.gutter@gutterDiv'),
                    (0, dom_1.h)('div@editor'),
                ]),
            ]);
            this._onDidViewChange = new event_1.Emitter();
            this.view = {
                element: this.htmlElements.root,
                minimumWidth: editor_1.DEFAULT_EDITOR_MIN_DIMENSIONS.width,
                maximumWidth: editor_1.DEFAULT_EDITOR_MAX_DIMENSIONS.width,
                minimumHeight: editor_1.DEFAULT_EDITOR_MIN_DIMENSIONS.height,
                maximumHeight: editor_1.DEFAULT_EDITOR_MAX_DIMENSIONS.height,
                onDidChange: this._onDidViewChange.event,
                layout: (width, height, top, left) => {
                    (0, utils_1.setStyle)(this.htmlElements.root, { width, height, top, left });
                    this.editor.layout({
                        width: width - this.htmlElements.gutterDiv.clientWidth,
                        height: height - this.htmlElements.header.clientHeight,
                    });
                }
                // preferredWidth?: number | undefined;
                // preferredHeight?: number | undefined;
                // priority?: LayoutPriority | undefined;
                // snap?: boolean | undefined;
            };
            this.checkboxesVisible = (0, utils_1.observableConfigValue)('mergeEditor.showCheckboxes', false, this.configurationService);
            this.showDeletionMarkers = (0, utils_1.observableConfigValue)('mergeEditor.showDeletionMarkers', true, this.configurationService);
            this.useSimplifiedDecorations = (0, utils_1.observableConfigValue)('mergeEditor.useSimplifiedDecorations', false, this.configurationService);
            this.editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.htmlElements.editor, {}, {
                contributions: this.getEditorContributions(),
            });
            this.isFocused = (0, observable_1.observableFromEvent)(event_1.Event.any(this.editor.onDidBlurEditorWidget, this.editor.onDidFocusEditorWidget), () => /** @description editor.hasWidgetFocus */ this.editor.hasWidgetFocus());
            this.cursorPosition = (0, observable_1.observableFromEvent)(this.editor.onDidChangeCursorPosition, () => /** @description editor.getPosition */ this.editor.getPosition());
            this.selection = (0, observable_1.observableFromEvent)(this.editor.onDidChangeCursorSelection, () => /** @description editor.getSelections */ this.editor.getSelections());
            this.cursorLineNumber = this.cursorPosition.map(p => /** @description cursorPosition.lineNumber */ p?.lineNumber);
        }
        getEditorContributions() {
            return editorExtensions_1.EditorExtensionsRegistry.getEditorContributions().filter(c => c.id !== folding_1.FoldingController.ID && c.id !== codelensController_1.CodeLensContribution.ID);
        }
    }
    exports.CodeEditorView = CodeEditorView;
    function createSelectionsAutorun(codeEditorView, translateRange) {
        const selections = (0, observable_1.derived)(reader => {
            /** @description selections */
            const viewModel = codeEditorView.viewModel.read(reader);
            if (!viewModel) {
                return [];
            }
            const baseRange = viewModel.selectionInBase.read(reader);
            if (!baseRange || baseRange.sourceEditor === codeEditorView) {
                return [];
            }
            return baseRange.rangesInBase.map(r => translateRange(r, viewModel));
        });
        return (0, observable_1.autorun)(reader => {
            /** @description set selections */
            const ranges = selections.read(reader);
            if (ranges.length === 0) {
                return;
            }
            codeEditorView.editor.setSelections(ranges.map(r => new selection_1.Selection(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn)));
        });
    }
    let TitleMenu = class TitleMenu extends lifecycle_1.Disposable {
        constructor(menuId, targetHtmlElement, instantiationService) {
            super();
            const toolbar = instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, targetHtmlElement, menuId, {
                menuOptions: { renderShortTitle: true },
                toolbarOptions: { primaryGroup: (g) => g === 'primary' }
            });
            this._store.add(toolbar);
        }
    };
    exports.TitleMenu = TitleMenu;
    exports.TitleMenu = TitleMenu = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], TitleMenu);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUVkaXRvclZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3ZpZXcvZWRpdG9ycy9jb2RlRWRpdG9yVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0R2hHLDBEQXlCQztJQS9HRCxNQUFzQixjQUFlLFNBQVEsc0JBQVU7UUFtRC9DLGFBQWEsQ0FBQyxVQUFvQztZQUN4RCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBbUJELFlBQ2tCLG9CQUEyQyxFQUM1QyxTQUF3RCxFQUN2RCxvQkFBMkM7WUFFNUQsS0FBSyxFQUFFLENBQUM7WUFKUyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzVDLGNBQVMsR0FBVCxTQUFTLENBQStDO1lBQ3ZELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUExRXBELFVBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHlCQUF5QixDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUxRCxpQkFBWSxHQUFHLElBQUEsT0FBQyxFQUFDLGVBQWUsRUFBRTtnQkFDcEQsSUFBQSxPQUFDLEVBQUMsbUJBQW1CLEVBQUU7b0JBQ3RCLElBQUEsT0FBQyxFQUFDLGtCQUFrQixDQUFDO29CQUNyQixJQUFBLE9BQUMsRUFBQyw4QkFBOEIsQ0FBQztvQkFDakMsSUFBQSxPQUFDLEVBQUMsb0JBQW9CLENBQUM7b0JBQ3ZCLElBQUEsT0FBQyxFQUFDLHNCQUFzQixDQUFDO2lCQUN6QixDQUFDO2dCQUNGLElBQUEsT0FBQyxFQUFDLGVBQWUsRUFBRTtvQkFDbEIs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