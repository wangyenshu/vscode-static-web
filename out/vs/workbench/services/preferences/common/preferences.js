/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor"], function (require, exports, instantiation_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USE_SPLIT_JSON_SETTING = exports.DEFAULT_SETTINGS_EDITOR_SETTING = exports.FOLDER_SETTINGS_PATH = exports.DEFINE_KEYBINDING_EDITOR_CONTRIB_ID = exports.IPreferencesService = exports.SettingMatchType = exports.SettingValueType = void 0;
    exports.validateSettingsEditorOptions = validateSettingsEditorOptions;
    var SettingValueType;
    (function (SettingValueType) {
        SettingValueType["Null"] = "null";
        SettingValueType["Enum"] = "enum";
        SettingValueType["String"] = "string";
        SettingValueType["MultilineString"] = "multiline-string";
        SettingValueType["Integer"] = "integer";
        SettingValueType["Number"] = "number";
        SettingValueType["Boolean"] = "boolean";
        SettingValueType["Array"] = "array";
        SettingValueType["Exclude"] = "exclude";
        SettingValueType["Include"] = "include";
        SettingValueType["Complex"] = "complex";
        SettingValueType["NullableInteger"] = "nullable-integer";
        SettingValueType["NullableNumber"] = "nullable-number";
        SettingValueType["Object"] = "object";
        SettingValueType["BooleanObject"] = "boolean-object";
        SettingValueType["LanguageTag"] = "language-tag";
        SettingValueType["ExtensionToggle"] = "extension-toggle";
    })(SettingValueType || (exports.SettingValueType = SettingValueType = {}));
    /**
     * The ways a setting could match a query,
     * sorted in increasing order of relevance.
     */
    var SettingMatchType;
    (function (SettingMatchType) {
        SettingMatchType[SettingMatchType["None"] = 0] = "None";
        SettingMatchType[SettingMatchType["LanguageTagSettingMatch"] = 1] = "LanguageTagSettingMatch";
        SettingMatchType[SettingMatchType["RemoteMatch"] = 2] = "RemoteMatch";
        SettingMatchType[SettingMatchType["DescriptionOrValueMatch"] = 4] = "DescriptionOrValueMatch";
        SettingMatchType[SettingMatchType["KeyMatch"] = 8] = "KeyMatch";
    })(SettingMatchType || (exports.SettingMatchType = SettingMatchType = {}));
    function validateSettingsEditorOptions(options) {
        return {
            // Inherit provided options
            ...options,
            // Enforce some options for settings specifically
            override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
            pinned: true
        };
    }
    exports.IPreferencesService = (0, instantiation_1.createDecorator)('preferencesService');
    exports.DEFINE_KEYBINDING_EDITOR_CONTRIB_ID = 'editor.contrib.defineKeybinding';
    exports.FOLDER_SETTINGS_PATH = '.vscode/settings.json';
    exports.DEFAULT_SETTINGS_EDITOR_SETTING = 'workbench.settings.openDefaultSettings';
    exports.USE_SPLIT_JSON_SETTING = 'workbench.settings.useSplitJSON';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcHJlZmVyZW5jZXMvY29tbW9uL3ByZWZlcmVuY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNOaEcsc0VBU0M7SUExTUQsSUFBWSxnQkFrQlg7SUFsQkQsV0FBWSxnQkFBZ0I7UUFDM0IsaUNBQWEsQ0FBQTtRQUNiLGlDQUFhLENBQUE7UUFDYixxQ0FBaUIsQ0FBQTtRQUNqQix3REFBb0MsQ0FBQTtRQUNwQyx1Q0FBbUIsQ0FBQTtRQUNuQixxQ0FBaUIsQ0FBQTtRQUNqQix1Q0FBbUIsQ0FBQTtRQUNuQixtQ0FBZSxDQUFBO1FBQ2YsdUNBQW1CLENBQUE7UUFDbkIsdUNBQW1CLENBQUE7UUFDbkIsdUNBQW1CLENBQUE7UUFDbkIsd0RBQW9DLENBQUE7UUFDcEMsc0RBQWtDLENBQUE7UUFDbEMscUNBQWlCLENBQUE7UUFDakIsb0RBQWdDLENBQUE7UUFDaEMsZ0RBQTRCLENBQUE7UUFDNUIsd0RBQW9DLENBQUE7SUFDckMsQ0FBQyxFQWxCVyxnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQWtCM0I7SUEyRkQ7OztPQUdHO0lBQ0gsSUFBWSxnQkFNWDtJQU5ELFdBQVksZ0JBQWdCO1FBQzNCLHVEQUFRLENBQUE7UUFDUiw2RkFBZ0MsQ0FBQTtRQUNoQyxxRUFBb0IsQ0FBQTtRQUNwQiw2RkFBZ0MsQ0FBQTtRQUNoQywrREFBaUIsQ0FBQTtJQUNsQixDQUFDLEVBTlcsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFNM0I7SUEwRUQsU0FBZ0IsNkJBQTZCLENBQUMsT0FBK0I7UUFDNUUsT0FBTztZQUNOLDJCQUEyQjtZQUMzQixHQUFHLE9BQU87WUFFVixpREFBaUQ7WUFDakQsUUFBUSxFQUFFLG1DQUEwQixDQUFDLEVBQUU7WUFDdkMsTUFBTSxFQUFFLElBQUk7U0FDWixDQUFDO0lBQ0gsQ0FBQztJQVNZLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwrQkFBZSxFQUFzQixvQkFBb0IsQ0FBQyxDQUFDO0lBd0ZqRixRQUFBLG1DQUFtQyxHQUFHLGlDQUFpQyxDQUFDO0lBS3hFLFFBQUEsb0JBQW9CLEdBQUcsdUJBQXVCLENBQUM7SUFDL0MsUUFBQSwrQkFBK0IsR0FBRyx3Q0FBd0MsQ0FBQztJQUMzRSxRQUFBLHNCQUFzQixHQUFHLGlDQUFpQyxDQUFDIn0=