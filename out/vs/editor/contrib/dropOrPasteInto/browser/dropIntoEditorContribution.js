/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorConfigurationSchema", "vs/editor/common/editorFeatures", "vs/editor/contrib/dropOrPasteInto/browser/defaultProviders", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "./dropIntoEditorController"], function (require, exports, editorExtensions_1, editorConfigurationSchema_1, editorFeatures_1, defaultProviders_1, nls, configurationRegistry_1, platform_1, dropIntoEditorController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(dropIntoEditorController_1.DropIntoEditorController.ID, dropIntoEditorController_1.DropIntoEditorController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorFeatures_1.registerEditorFeature)(defaultProviders_1.DefaultDropProvidersFeature);
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: dropIntoEditorController_1.changeDropTypeCommandId,
                precondition: dropIntoEditorController_1.dropWidgetVisibleCtx,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
                }
            });
        }
        runEditorCommand(_accessor, editor, _args) {
            dropIntoEditorController_1.DropIntoEditorController.get(editor)?.changeDropType();
        }
    });
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.hideDropWidget',
                precondition: dropIntoEditorController_1.dropWidgetVisibleCtx,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */,
                }
            });
        }
        runEditorCommand(_accessor, editor, _args) {
            dropIntoEditorController_1.DropIntoEditorController.get(editor)?.clearWidgets();
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        properties: {
            [dropIntoEditorController_1.defaultProviderConfig]: {
                type: 'object',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                description: nls.localize('defaultProviderDescription', "Configures the default drop provider to use for content of a given mime type."),
                default: {},
                additionalProperties: {
                    type: 'string',
                },
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcEludG9FZGl0b3JDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9kcm9wT3JQYXN0ZUludG8vYnJvd3Nlci9kcm9wSW50b0VkaXRvckNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxJQUFBLDZDQUEwQixFQUFDLG1EQUF3QixDQUFDLEVBQUUsRUFBRSxtREFBd0IsaUVBQXlELENBQUM7SUFDMUksSUFBQSxzQ0FBcUIsRUFBQyw4Q0FBMkIsQ0FBQyxDQUFDO0lBRW5ELElBQUEsd0NBQXFCLEVBQUMsSUFBSSxLQUFNLFNBQVEsZ0NBQWE7UUFDcEQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGtEQUF1QjtnQkFDM0IsWUFBWSxFQUFFLCtDQUFvQjtnQkFDbEMsTUFBTSxFQUFFO29CQUNQLE1BQU0sMENBQWdDO29CQUN0QyxPQUFPLEVBQUUsbURBQStCO2lCQUN4QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFZSxnQkFBZ0IsQ0FBQyxTQUFrQyxFQUFFLE1BQW1CLEVBQUUsS0FBVTtZQUNuRyxtREFBd0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsY0FBYyxFQUFFLENBQUM7UUFDeEQsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEsd0NBQXFCLEVBQUMsSUFBSSxLQUFNLFNBQVEsZ0NBQWE7UUFDcEQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHVCQUF1QjtnQkFDM0IsWUFBWSxFQUFFLCtDQUFvQjtnQkFDbEMsTUFBTSxFQUFFO29CQUNQLE1BQU0sMENBQWdDO29CQUN0QyxPQUFPLHdCQUFnQjtpQkFDdkI7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRWUsZ0JBQWdCLENBQUMsU0FBa0MsRUFBRSxNQUFtQixFQUFFLEtBQVU7WUFDbkcsbURBQXdCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDO1FBQ3RELENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUMscUJBQXFCLENBQUM7UUFDaEcsR0FBRyx1REFBMkI7UUFDOUIsVUFBVSxFQUFFO1lBQ1gsQ0FBQyxnREFBcUIsQ0FBQyxFQUFFO2dCQUN4QixJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLGlEQUF5QztnQkFDOUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQUUsK0VBQStFLENBQUM7Z0JBQ3hJLE9BQU8sRUFBRSxFQUFFO2dCQUNYLG9CQUFvQixFQUFFO29CQUNyQixJQUFJLEVBQUUsUUFBUTtpQkFDZDthQUNEO1NBQ0Q7S0FDRCxDQUFDLENBQUMifQ==