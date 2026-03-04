/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, nls, platform_1, configurationRegistry_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DispatchConfig = void 0;
    exports.readKeyboardConfig = readKeyboardConfig;
    var DispatchConfig;
    (function (DispatchConfig) {
        DispatchConfig[DispatchConfig["Code"] = 0] = "Code";
        DispatchConfig[DispatchConfig["KeyCode"] = 1] = "KeyCode";
    })(DispatchConfig || (exports.DispatchConfig = DispatchConfig = {}));
    function readKeyboardConfig(configurationService) {
        const keyboard = configurationService.getValue('keyboard');
        const dispatch = (keyboard?.dispatch === 'keyCode' ? 1 /* DispatchConfig.KeyCode */ : 0 /* DispatchConfig.Code */);
        const mapAltGrToCtrlAlt = Boolean(keyboard?.mapAltGrToCtrlAlt);
        return { dispatch, mapAltGrToCtrlAlt };
    }
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const keyboardConfiguration = {
        'id': 'keyboard',
        'order': 15,
        'type': 'object',
        'title': nls.localize('keyboardConfigurationTitle', "Keyboard"),
        'properties': {
            'keyboard.dispatch': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'string',
                enum: ['code', 'keyCode'],
                default: 'code',
                markdownDescription: nls.localize('dispatch', "Controls the dispatching logic for key presses to use either `code` (recommended) or `keyCode`."),
                included: platform_1.OS === 2 /* OperatingSystem.Macintosh */ || platform_1.OS === 3 /* OperatingSystem.Linux */
            },
            'keyboard.mapAltGrToCtrlAlt': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'boolean',
                default: false,
                markdownDescription: nls.localize('mapAltGrToCtrlAlt', "Controls if the AltGraph+ modifier should be treated as Ctrl+Alt+."),
                included: platform_1.OS === 1 /* OperatingSystem.Windows */
            }
        }
    };
    configurationRegistry.registerConfiguration(keyboardConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRDb25maWcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9rZXlib2FyZExheW91dC9jb21tb24va2V5Ym9hcmRDb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxnREFLQztJQWZELElBQWtCLGNBR2pCO0lBSEQsV0FBa0IsY0FBYztRQUMvQixtREFBSSxDQUFBO1FBQ0oseURBQU8sQ0FBQTtJQUNSLENBQUMsRUFIaUIsY0FBYyw4QkFBZCxjQUFjLFFBRy9CO0lBT0QsU0FBZ0Isa0JBQWtCLENBQUMsb0JBQTJDO1FBQzdFLE1BQU0sUUFBUSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBd0QsVUFBVSxDQUFDLENBQUM7UUFDbEgsTUFBTSxRQUFRLEdBQUcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxLQUFLLFNBQVMsQ0FBQyxDQUFDLGdDQUF3QixDQUFDLDRCQUFvQixDQUFDLENBQUM7UUFDbkcsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDL0QsT0FBTyxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxDQUFDO0lBQ3hDLENBQUM7SUFFRCxNQUFNLHFCQUFxQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNsRyxNQUFNLHFCQUFxQixHQUF1QjtRQUNqRCxJQUFJLEVBQUUsVUFBVTtRQUNoQixPQUFPLEVBQUUsRUFBRTtRQUNYLE1BQU0sRUFBRSxRQUFRO1FBQ2hCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLFVBQVUsQ0FBQztRQUMvRCxZQUFZLEVBQUU7WUFDYixtQkFBbUIsRUFBRTtnQkFDcEIsS0FBSyx3Q0FBZ0M7Z0JBQ3JDLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUM7Z0JBQ3pCLE9BQU8sRUFBRSxNQUFNO2dCQUNmLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLGlHQUFpRyxDQUFDO2dCQUNoSixRQUFRLEVBQUUsYUFBRSxzQ0FBOEIsSUFBSSxhQUFFLGtDQUEwQjthQUMxRTtZQUNELDRCQUE0QixFQUFFO2dCQUM3QixLQUFLLHdDQUFnQztnQkFDckMsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxvRUFBb0UsQ0FBQztnQkFDNUgsUUFBUSxFQUFFLGFBQUUsb0NBQTRCO2FBQ3hDO1NBQ0Q7S0FDRCxDQUFDO0lBRUYscUJBQXFCLENBQUMscUJBQXFCLENBQUMscUJBQXFCLENBQUMsQ0FBQyJ9