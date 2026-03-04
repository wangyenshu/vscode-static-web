/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/editor/contrib/colorPicker/browser/standaloneColorPickerWidget", "vs/editor/common/editorContextKeys", "vs/platform/actions/common/actions", "vs/css!./colorPicker"], function (require, exports, editorExtensions_1, nls_1, standaloneColorPickerWidget_1, editorContextKeys_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowOrFocusStandaloneColorPicker = void 0;
    class ShowOrFocusStandaloneColorPicker extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.showOrFocusStandaloneColorPicker',
                title: {
                    ...(0, nls_1.localize2)('showOrFocusStandaloneColorPicker', "Show or Focus Standalone Color Picker"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mishowOrFocusStandaloneColorPicker', comment: ['&& denotes a mnemonic'] }, "&&Show or Focus Standalone Color Picker"),
                },
                precondition: undefined,
                menu: [
                    { id: actions_1.MenuId.CommandPalette },
                ],
                metadata: {
                    description: (0, nls_1.localize2)('showOrFocusStandaloneColorPickerDescription', "Show or focus a standalone color picker which uses the default color provider. It displays hex/rgb/hsl colors."),
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            standaloneColorPickerWidget_1.StandaloneColorPickerController.get(editor)?.showOrFocus();
        }
    }
    exports.ShowOrFocusStandaloneColorPicker = ShowOrFocusStandaloneColorPicker;
    class HideStandaloneColorPicker extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.hideColorPicker',
                label: (0, nls_1.localize)({
                    key: 'hideColorPicker',
                    comment: [
                        'Action that hides the color picker'
                    ]
                }, "Hide the Color Picker"),
                alias: 'Hide the Color Picker',
                precondition: editorContextKeys_1.EditorContextKeys.standaloneColorPickerVisible.isEqualTo(true),
                kbOpts: {
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: (0, nls_1.localize2)('hideColorPickerDescription', "Hide the standalone color picker."),
                }
            });
        }
        run(_accessor, editor) {
            standaloneColorPickerWidget_1.StandaloneColorPickerController.get(editor)?.hide();
        }
    }
    class InsertColorWithStandaloneColorPicker extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertColorWithStandaloneColorPicker',
                label: (0, nls_1.localize)({
                    key: 'insertColorWithStandaloneColorPicker',
                    comment: [
                        'Action that inserts color with standalone color picker'
                    ]
                }, "Insert Color with Standalone Color Picker"),
                alias: 'Insert Color with Standalone Color Picker',
                precondition: editorContextKeys_1.EditorContextKeys.standaloneColorPickerFocused.isEqualTo(true),
                kbOpts: {
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: (0, nls_1.localize2)('insertColorWithStandaloneColorPickerDescription', "Insert hex/rgb/hsl colors with the focused standalone color picker."),
                }
            });
        }
        run(_accessor, editor) {
            standaloneColorPickerWidget_1.StandaloneColorPickerController.get(editor)?.insertColor();
        }
    }
    (0, editorExtensions_1.registerEditorAction)(HideStandaloneColorPicker);
    (0, editorExtensions_1.registerEditorAction)(InsertColorWithStandaloneColorPicker);
    (0, actions_1.registerAction2)(ShowOrFocusStandaloneColorPicker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUNvbG9yUGlja2VyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvbG9yUGlja2VyL2Jyb3dzZXIvc3RhbmRhbG9uZUNvbG9yUGlja2VyQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsTUFBYSxnQ0FBaUMsU0FBUSxnQ0FBYTtRQUNsRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsZ0RBQWdEO2dCQUNwRCxLQUFLLEVBQUU7b0JBQ04sR0FBRyxJQUFBLGVBQVMsRUFBQyxrQ0FBa0MsRUFBRSx1Q0FBdUMsQ0FBQztvQkFDekYsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLG9DQUFvQyxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSx5Q0FBeUMsQ0FBQztpQkFDcko7Z0JBQ0QsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGNBQWMsRUFBRTtpQkFDN0I7Z0JBQ0QsUUFBUSxFQUFFO29CQUNULFdBQVcsRUFBRSxJQUFBLGVBQVMsRUFBQyw2Q0FBNkMsRUFBRSxnSEFBZ0gsQ0FBQztpQkFDdkw7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsZ0JBQWdCLENBQUMsU0FBMkIsRUFBRSxNQUFtQjtZQUNoRSw2REFBK0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDNUQsQ0FBQztLQUNEO0lBcEJELDRFQW9CQztJQUVELE1BQU0seUJBQTBCLFNBQVEsK0JBQVk7UUFDbkQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLCtCQUErQjtnQkFDbkMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDO29CQUNmLEdBQUcsRUFBRSxpQkFBaUI7b0JBQ3RCLE9BQU8sRUFBRTt3QkFDUixvQ0FBb0M7cUJBQ3BDO2lCQUNELEVBQUUsdUJBQXVCLENBQUM7Z0JBQzNCLEtBQUssRUFBRSx1QkFBdUI7Z0JBQzlCLFlBQVksRUFBRSxxQ0FBaUIsQ0FBQyw0QkFBNEIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO2dCQUM1RSxNQUFNLEVBQUU7b0JBQ1AsT0FBTyx3QkFBZ0I7b0JBQ3ZCLE1BQU0sMENBQWdDO2lCQUN0QztnQkFDRCxRQUFRLEVBQUU7b0JBQ1QsV0FBVyxFQUFFLElBQUEsZUFBUyxFQUFDLDRCQUE0QixFQUFFLG1DQUFtQyxDQUFDO2lCQUN6RjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFDTSxHQUFHLENBQUMsU0FBMkIsRUFBRSxNQUFtQjtZQUMxRCw2REFBK0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDckQsQ0FBQztLQUNEO0lBRUQsTUFBTSxvQ0FBcUMsU0FBUSwrQkFBWTtRQUM5RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsb0RBQW9EO2dCQUN4RCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUM7b0JBQ2YsR0FBRyxFQUFFLHNDQUFzQztvQkFDM0MsT0FBTyxFQUFFO3dCQUNSLHdEQUF3RDtxQkFDeEQ7aUJBQ0QsRUFBRSwyQ0FBMkMsQ0FBQztnQkFDL0MsS0FBSyxFQUFFLDJDQUEyQztnQkFDbEQsWUFBWSxFQUFFLHFDQUFpQixDQUFDLDRCQUE0QixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQzVFLE1BQU0sRUFBRTtvQkFDUCxPQUFPLHVCQUFlO29CQUN0QixNQUFNLDBDQUFnQztpQkFDdEM7Z0JBQ0QsUUFBUSxFQUFFO29CQUNULFdBQVcsRUFBRSxJQUFBLGVBQVMsRUFBQyxpREFBaUQsRUFBRSxxRUFBcUUsQ0FBQztpQkFDaEo7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ00sR0FBRyxDQUFDLFNBQTJCLEVBQUUsTUFBbUI7WUFDMUQsNkRBQStCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQzVELENBQUM7S0FDRDtJQUVELElBQUEsdUNBQW9CLEVBQUMseUJBQXlCLENBQUMsQ0FBQztJQUNoRCxJQUFBLHVDQUFvQixFQUFDLG9DQUFvQyxDQUFDLENBQUM7SUFDM0QsSUFBQSx5QkFBZSxFQUFDLGdDQUFnQyxDQUFDLENBQUMifQ==