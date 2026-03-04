/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/config/editorConfiguration", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo", "vs/platform/accessibility/test/common/testAccessibilityService", "vs/platform/actions/common/actions"], function (require, exports, editorConfiguration_1, editorOptions_1, fontInfo_1, testAccessibilityService_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestConfiguration = void 0;
    class TestConfiguration extends editorConfiguration_1.EditorConfiguration {
        constructor(opts) {
            super(false, actions_1.MenuId.EditorContext, opts, null, new testAccessibilityService_1.TestAccessibilityService());
        }
        _readEnvConfiguration() {
            const envConfig = this.getRawOptions().envConfig;
            return {
                extraEditorClassName: envConfig?.extraEditorClassName ?? '',
                outerWidth: envConfig?.outerWidth ?? 100,
                outerHeight: envConfig?.outerHeight ?? 100,
                emptySelectionClipboard: envConfig?.emptySelectionClipboard ?? true,
                pixelRatio: envConfig?.pixelRatio ?? 1,
                accessibilitySupport: envConfig?.accessibilitySupport ?? 0 /* AccessibilitySupport.Unknown */
            };
        }
        _readFontInfo(styling) {
            return new fontInfo_1.FontInfo({
                pixelRatio: 1,
                fontFamily: 'mockFont',
                fontWeight: 'normal',
                fontSize: 14,
                fontFeatureSettings: editorOptions_1.EditorFontLigatures.OFF,
                fontVariationSettings: editorOptions_1.EditorFontVariations.OFF,
                lineHeight: 19,
                letterSpacing: 1.5,
                isMonospace: true,
                typicalHalfwidthCharacterWidth: 10,
                typicalFullwidthCharacterWidth: 20,
                canUseHalfwidthRightwardsArrow: true,
                spaceWidth: 10,
                middotWidth: 10,
                wsmiddotWidth: 10,
                maxDigitWidth: 10,
            }, true);
        }
    }
    exports.TestConfiguration = TestConfiguration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL2NvbmZpZy90ZXN0Q29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxpQkFBa0IsU0FBUSx5Q0FBbUI7UUFFekQsWUFBWSxJQUE2QztZQUN4RCxLQUFLLENBQUMsS0FBSyxFQUFFLGdCQUFNLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVrQixxQkFBcUI7WUFDdkMsTUFBTSxTQUFTLEdBQUksSUFBSSxDQUFDLGFBQWEsRUFBb0MsQ0FBQyxTQUFTLENBQUM7WUFDcEYsT0FBTztnQkFDTixvQkFBb0IsRUFBRSxTQUFTLEVBQUUsb0JBQW9CLElBQUksRUFBRTtnQkFDM0QsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLElBQUksR0FBRztnQkFDeEMsV0FBVyxFQUFFLFNBQVMsRUFBRSxXQUFXLElBQUksR0FBRztnQkFDMUMsdUJBQXVCLEVBQUUsU0FBUyxFQUFFLHVCQUF1QixJQUFJLElBQUk7Z0JBQ25FLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxJQUFJLENBQUM7Z0JBQ3RDLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxvQkFBb0Isd0NBQWdDO2FBQ3JGLENBQUM7UUFDSCxDQUFDO1FBRWtCLGFBQWEsQ0FBQyxPQUFxQjtZQUNyRCxPQUFPLElBQUksbUJBQVEsQ0FBQztnQkFDbkIsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLFVBQVUsRUFBRSxRQUFRO2dCQUNwQixRQUFRLEVBQUUsRUFBRTtnQkFDWixtQkFBbUIsRUFBRSxtQ0FBbUIsQ0FBQyxHQUFHO2dCQUM1QyxxQkFBcUIsRUFBRSxvQ0FBb0IsQ0FBQyxHQUFHO2dCQUMvQyxVQUFVLEVBQUUsRUFBRTtnQkFDZCxhQUFhLEVBQUUsR0FBRztnQkFDbEIsV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLDhCQUE4QixFQUFFLEVBQUU7Z0JBQ2xDLDhCQUE4QixFQUFFLEVBQUU7Z0JBQ2xDLDhCQUE4QixFQUFFLElBQUk7Z0JBQ3BDLFVBQVUsRUFBRSxFQUFFO2dCQUNkLFdBQVcsRUFBRSxFQUFFO2dCQUNmLGFBQWEsRUFBRSxFQUFFO2dCQUNqQixhQUFhLEVBQUUsRUFBRTthQUNqQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ1YsQ0FBQztLQUNEO0lBdENELDhDQXNDQyJ9