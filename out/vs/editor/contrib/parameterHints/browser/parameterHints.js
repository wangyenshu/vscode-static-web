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
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/parameterHints/browser/parameterHintsModel", "vs/editor/contrib/parameterHints/browser/provideSignatureHelp", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "./parameterHintsWidget"], function (require, exports, lazy_1, lifecycle_1, editorExtensions_1, editorContextKeys_1, languages, languageFeatures_1, parameterHintsModel_1, provideSignatureHelp_1, nls, contextkey_1, instantiation_1, parameterHintsWidget_1) {
    "use strict";
    var ParameterHintsController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TriggerParameterHintsAction = exports.ParameterHintsController = void 0;
    let ParameterHintsController = class ParameterHintsController extends lifecycle_1.Disposable {
        static { ParameterHintsController_1 = this; }
        static { this.ID = 'editor.controller.parameterHints'; }
        static get(editor) {
            return editor.getContribution(ParameterHintsController_1.ID);
        }
        constructor(editor, instantiationService, languageFeaturesService) {
            super();
            this.editor = editor;
            this.model = this._register(new parameterHintsModel_1.ParameterHintsModel(editor, languageFeaturesService.signatureHelpProvider));
            this._register(this.model.onChangedHints(newParameterHints => {
                if (newParameterHints) {
                    this.widget.value.show();
                    this.widget.value.render(newParameterHints);
                }
                else {
                    this.widget.rawValue?.hide();
                }
            }));
            this.widget = new lazy_1.Lazy(() => this._register(instantiationService.createInstance(parameterHintsWidget_1.ParameterHintsWidget, this.editor, this.model)));
        }
        cancel() {
            this.model.cancel();
        }
        previous() {
            this.widget.rawValue?.previous();
        }
        next() {
            this.widget.rawValue?.next();
        }
        trigger(context) {
            this.model.trigger(context, 0);
        }
    };
    exports.ParameterHintsController = ParameterHintsController;
    exports.ParameterHintsController = ParameterHintsController = ParameterHintsController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, languageFeatures_1.ILanguageFeaturesService)
    ], ParameterHintsController);
    class TriggerParameterHintsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.triggerParameterHints',
                label: nls.localize('parameterHints.trigger.label', "Trigger Parameter Hints"),
                alias: 'Trigger Parameter Hints',
                precondition: editorContextKeys_1.EditorContextKeys.hasSignatureHelpProvider,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 10 /* KeyCode.Space */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = ParameterHintsController.get(editor);
            controller?.trigger({
                triggerKind: languages.SignatureHelpTriggerKind.Invoke
            });
        }
    }
    exports.TriggerParameterHintsAction = TriggerParameterHintsAction;
    (0, editorExtensions_1.registerEditorContribution)(ParameterHintsController.ID, ParameterHintsController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorExtensions_1.registerEditorAction)(TriggerParameterHintsAction);
    const weight = 100 /* KeybindingWeight.EditorContrib */ + 75;
    const ParameterHintsCommand = editorExtensions_1.EditorCommand.bindToContribution(ParameterHintsController.get);
    (0, editorExtensions_1.registerEditorCommand)(new ParameterHintsCommand({
        id: 'closeParameterHints',
        precondition: provideSignatureHelp_1.Context.Visible,
        handler: x => x.cancel(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new ParameterHintsCommand({
        id: 'showPrevParameterHint',
        precondition: contextkey_1.ContextKeyExpr.and(provideSignatureHelp_1.Context.Visible, provideSignatureHelp_1.Context.MultipleSignatures),
        handler: x => x.previous(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 16 /* KeyCode.UpArrow */,
            secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
            mac: { primary: 16 /* KeyCode.UpArrow */, secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */, 256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */] }
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new ParameterHintsCommand({
        id: 'showNextParameterHint',
        precondition: contextkey_1.ContextKeyExpr.and(provideSignatureHelp_1.Context.Visible, provideSignatureHelp_1.Context.MultipleSignatures),
        handler: x => x.next(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 18 /* KeyCode.DownArrow */,
            secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
            mac: { primary: 18 /* KeyCode.DownArrow */, secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */, 256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */] }
        }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVySGludHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9wYXJhbWV0ZXJIaW50cy9icm93c2VyL3BhcmFtZXRlckhpbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7O2lCQUVoQyxPQUFFLEdBQUcsa0NBQWtDLEFBQXJDLENBQXNDO1FBRXhELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDcEMsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUEyQiwwQkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBTUQsWUFDQyxNQUFtQixFQUNJLG9CQUEyQyxFQUN4Qyx1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUVyQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5Q0FBbUIsQ0FBQyxNQUFNLEVBQUUsdUJBQXVCLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1lBRTVHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsRUFBRTtnQkFDNUQsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO29CQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQzdDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksV0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJDQUFvQixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsSSxDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUVELFFBQVE7WUFDUCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBRUQsSUFBSTtZQUNILElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFRCxPQUFPLENBQUMsT0FBdUI7WUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7O0lBakRXLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBY2xDLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSwyQ0FBd0IsQ0FBQTtPQWZkLHdCQUF3QixDQWtEcEM7SUFFRCxNQUFhLDJCQUE0QixTQUFRLCtCQUFZO1FBRTVEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxxQ0FBcUM7Z0JBQ3pDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDhCQUE4QixFQUFFLHlCQUF5QixDQUFDO2dCQUM5RSxLQUFLLEVBQUUseUJBQXlCO2dCQUNoQyxZQUFZLEVBQUUscUNBQWlCLENBQUMsd0JBQXdCO2dCQUN4RCxNQUFNLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLHFDQUFpQixDQUFDLGVBQWU7b0JBQ3pDLE9BQU8sRUFBRSxtREFBNkIseUJBQWdCO29CQUN0RCxNQUFNLDBDQUFnQztpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBbUI7WUFDekQsTUFBTSxVQUFVLEdBQUcsd0JBQXdCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hELFVBQVUsRUFBRSxPQUFPLENBQUM7Z0JBQ25CLFdBQVcsRUFBRSxTQUFTLENBQUMsd0JBQXdCLENBQUMsTUFBTTthQUN0RCxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUF0QkQsa0VBc0JDO0lBRUQsSUFBQSw2Q0FBMEIsRUFBQyx3QkFBd0IsQ0FBQyxFQUFFLEVBQUUsd0JBQXdCLGlFQUF5RCxDQUFDO0lBQzFJLElBQUEsdUNBQW9CLEVBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUVsRCxNQUFNLE1BQU0sR0FBRywyQ0FBaUMsRUFBRSxDQUFDO0lBRW5ELE1BQU0scUJBQXFCLEdBQUcsZ0NBQWEsQ0FBQyxrQkFBa0IsQ0FBMkIsd0JBQXdCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFdkgsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLHFCQUFxQixDQUFDO1FBQy9DLEVBQUUsRUFBRSxxQkFBcUI7UUFDekIsWUFBWSxFQUFFLDhCQUFPLENBQUMsT0FBTztRQUM3QixPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFO1FBQ3hCLE1BQU0sRUFBRTtZQUNQLE1BQU0sRUFBRSxNQUFNO1lBQ2QsTUFBTSxFQUFFLHFDQUFpQixDQUFDLEtBQUs7WUFDL0IsT0FBTyx3QkFBZ0I7WUFDdkIsU0FBUyxFQUFFLENBQUMsZ0RBQTZCLENBQUM7U0FDMUM7S0FDRCxDQUFDLENBQUMsQ0FBQztJQUVKLElBQUEsd0NBQXFCLEVBQUMsSUFBSSxxQkFBcUIsQ0FBQztRQUMvQyxFQUFFLEVBQUUsdUJBQXVCO1FBQzNCLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyw4QkFBTyxDQUFDLE9BQU8sRUFBRSw4QkFBTyxDQUFDLGtCQUFrQixDQUFDO1FBQzdFLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUU7UUFDMUIsTUFBTSxFQUFFO1lBQ1AsTUFBTSxFQUFFLE1BQU07WUFDZCxNQUFNLEVBQUUscUNBQWlCLENBQUMsS0FBSztZQUMvQixPQUFPLDBCQUFpQjtZQUN4QixTQUFTLEVBQUUsQ0FBQywrQ0FBNEIsQ0FBQztZQUN6QyxHQUFHLEVBQUUsRUFBRSxPQUFPLDBCQUFpQixFQUFFLFNBQVMsRUFBRSxDQUFDLCtDQUE0QixFQUFFLGdEQUE2QixDQUFDLEVBQUU7U0FDM0c7S0FDRCxDQUFDLENBQUMsQ0FBQztJQUVKLElBQUEsd0NBQXFCLEVBQUMsSUFBSSxxQkFBcUIsQ0FBQztRQUMvQyxFQUFFLEVBQUUsdUJBQXVCO1FBQzNCLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyw4QkFBTyxDQUFDLE9BQU8sRUFBRSw4QkFBTyxDQUFDLGtCQUFrQixDQUFDO1FBQzdFLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7UUFDdEIsTUFBTSxFQUFFO1lBQ1AsTUFBTSxFQUFFLE1BQU07WUFDZCxNQUFNLEVBQUUscUNBQWlCLENBQUMsS0FBSztZQUMvQixPQUFPLDRCQUFtQjtZQUMxQixTQUFTLEVBQUUsQ0FBQyxpREFBOEIsQ0FBQztZQUMzQyxHQUFHLEVBQUUsRUFBRSxPQUFPLDRCQUFtQixFQUFFLFNBQVMsRUFBRSxDQUFDLGlEQUE4QixFQUFFLGdEQUE2QixDQUFDLEVBQUU7U0FDL0c7S0FDRCxDQUFDLENBQUMsQ0FBQyJ9