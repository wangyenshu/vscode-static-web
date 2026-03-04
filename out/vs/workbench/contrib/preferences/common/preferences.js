/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, cancellation_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ENABLE_EXTENSION_TOGGLE_SETTINGS = exports.ENABLE_LANGUAGE_FILTER = exports.KEYBOARD_LAYOUT_OPEN_PICKER = exports.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG = exports.WORKSPACE_TRUST_SETTING_TAG = exports.POLICY_SETTING_TAG = exports.GENERAL_TAG_SETTING_TAG = exports.LANGUAGE_SETTING_TAG = exports.ID_SETTING_TAG = exports.FEATURE_SETTING_TAG = exports.EXTENSION_SETTING_TAG = exports.MODIFIED_SETTING_TAG = exports.KEYBINDINGS_EDITOR_SHOW_EXTENSION_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR = exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE = exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND = exports.KEYBINDINGS_EDITOR_COMMAND_COPY = exports.KEYBINDINGS_EDITOR_COMMAND_RESET = exports.KEYBINDINGS_EDITOR_COMMAND_REMOVE = exports.KEYBINDINGS_EDITOR_COMMAND_REJECT_WHEN = exports.KEYBINDINGS_EDITOR_COMMAND_ACCEPT_WHEN = exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN = exports.KEYBINDINGS_EDITOR_COMMAND_ADD = exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE = exports.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE = exports.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS = exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_HISTORY = exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = exports.KEYBINDINGS_EDITOR_COMMAND_SEARCH = exports.CONTEXT_WHEN_FOCUS = exports.CONTEXT_KEYBINDING_FOCUS = exports.CONTEXT_KEYBINDINGS_SEARCH_FOCUS = exports.CONTEXT_KEYBINDINGS_EDITOR = exports.CONTEXT_SETTINGS_ROW_FOCUS = exports.CONTEXT_TOC_ROW_FOCUS = exports.CONTEXT_SETTINGS_SEARCH_FOCUS = exports.CONTEXT_SETTINGS_JSON_EDITOR = exports.CONTEXT_SETTINGS_EDITOR = exports.SETTINGS_EDITOR_COMMAND_SUGGEST_FILTERS = exports.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU = exports.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = exports.IPreferencesSearchService = void 0;
    exports.getExperimentalExtensionToggleData = getExperimentalExtensionToggleData;
    exports.compareTwoNullableNumbers = compareTwoNullableNumbers;
    exports.IPreferencesSearchService = (0, instantiation_1.createDecorator)('preferencesSearchService');
    exports.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'settings.action.clearSearchResults';
    exports.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU = 'settings.action.showContextMenu';
    exports.SETTINGS_EDITOR_COMMAND_SUGGEST_FILTERS = 'settings.action.suggestFilters';
    exports.CONTEXT_SETTINGS_EDITOR = new contextkey_1.RawContextKey('inSettingsEditor', false);
    exports.CONTEXT_SETTINGS_JSON_EDITOR = new contextkey_1.RawContextKey('inSettingsJSONEditor', false);
    exports.CONTEXT_SETTINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inSettingsSearch', false);
    exports.CONTEXT_TOC_ROW_FOCUS = new contextkey_1.RawContextKey('settingsTocRowFocus', false);
    exports.CONTEXT_SETTINGS_ROW_FOCUS = new contextkey_1.RawContextKey('settingRowFocus', false);
    exports.CONTEXT_KEYBINDINGS_EDITOR = new contextkey_1.RawContextKey('inKeybindings', false);
    exports.CONTEXT_KEYBINDINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inKeybindingsSearch', false);
    exports.CONTEXT_KEYBINDING_FOCUS = new contextkey_1.RawContextKey('keybindingFocus', false);
    exports.CONTEXT_WHEN_FOCUS = new contextkey_1.RawContextKey('whenFocus', false);
    exports.KEYBINDINGS_EDITOR_COMMAND_SEARCH = 'keybindings.editor.searchKeybindings';
    exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'keybindings.editor.clearSearchResults';
    exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_HISTORY = 'keybindings.editor.clearSearchHistory';
    exports.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS = 'keybindings.editor.recordSearchKeys';
    exports.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE = 'keybindings.editor.toggleSortByPrecedence';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE = 'keybindings.editor.defineKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_ADD = 'keybindings.editor.addKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN = 'keybindings.editor.defineWhenExpression';
    exports.KEYBINDINGS_EDITOR_COMMAND_ACCEPT_WHEN = 'keybindings.editor.acceptWhenExpression';
    exports.KEYBINDINGS_EDITOR_COMMAND_REJECT_WHEN = 'keybindings.editor.rejectWhenExpression';
    exports.KEYBINDINGS_EDITOR_COMMAND_REMOVE = 'keybindings.editor.removeKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_RESET = 'keybindings.editor.resetKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY = 'keybindings.editor.copyKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND = 'keybindings.editor.copyCommandKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE = 'keybindings.editor.copyCommandTitle';
    exports.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR = 'keybindings.editor.showConflicts';
    exports.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS = 'keybindings.editor.focusKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS = 'keybindings.editor.showDefaultKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS = 'keybindings.editor.showUserKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_EXTENSION_KEYBINDINGS = 'keybindings.editor.showExtensionKeybindings';
    exports.MODIFIED_SETTING_TAG = 'modified';
    exports.EXTENSION_SETTING_TAG = 'ext:';
    exports.FEATURE_SETTING_TAG = 'feature:';
    exports.ID_SETTING_TAG = 'id:';
    exports.LANGUAGE_SETTING_TAG = 'lang:';
    exports.GENERAL_TAG_SETTING_TAG = 'tag:';
    exports.POLICY_SETTING_TAG = 'hasPolicy';
    exports.WORKSPACE_TRUST_SETTING_TAG = 'workspaceTrust';
    exports.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG = 'requireTrustedWorkspace';
    exports.KEYBOARD_LAYOUT_OPEN_PICKER = 'workbench.action.openKeyboardLayoutPicker';
    exports.ENABLE_LANGUAGE_FILTER = true;
    exports.ENABLE_EXTENSION_TOGGLE_SETTINGS = true;
    let cachedExtensionToggleData;
    async function getExperimentalExtensionToggleData(extensionGalleryService, productService) {
        if (!exports.ENABLE_EXTENSION_TOGGLE_SETTINGS) {
            return undefined;
        }
        if (!extensionGalleryService.isEnabled()) {
            return undefined;
        }
        if (cachedExtensionToggleData) {
            return cachedExtensionToggleData;
        }
        if (productService.extensionRecommendations && productService.commonlyUsedSettings) {
            const settingsEditorRecommendedExtensions = {};
            Object.keys(productService.extensionRecommendations).forEach(extensionId => {
                const extensionInfo = productService.extensionRecommendations[extensionId];
                if (extensionInfo.onSettingsEditorOpen) {
                    settingsEditorRecommendedExtensions[extensionId] = extensionInfo;
                }
            });
            const recommendedExtensionsGalleryInfo = {};
            for (const key in settingsEditorRecommendedExtensions) {
                const extensionId = key;
                // Recommend prerelease if not on Stable.
                const isStable = productService.quality === 'stable';
                try {
                    const [extension] = await extensionGalleryService.getExtensions([{ id: extensionId, preRelease: !isStable }], cancellation_1.CancellationToken.None);
                    if (extension) {
                        recommendedExtensionsGalleryInfo[key] = extension;
                    }
                    else {
                        // same as network connection fail. we do not want a blank settings page: https://github.com/microsoft/vscode/issues/195722
                        // so instead of returning partial data we return undefined here
                        return undefined;
                    }
                }
                catch (e) {
                    // Network connection fail. Return nothing rather than partial data.
                    return undefined;
                }
            }
            cachedExtensionToggleData = {
                settingsEditorRecommendedExtensions,
                recommendedExtensionsGalleryInfo,
                commonlyUsed: productService.commonlyUsedSettings
            };
            return cachedExtensionToggleData;
        }
        return undefined;
    }
    /**
     * Compares two nullable numbers such that null values always come after defined ones.
     */
    function compareTwoNullableNumbers(a, b) {
        const aOrMax = a ?? Number.MAX_SAFE_INTEGER;
        const bOrMax = b ?? Number.MAX_SAFE_INTEGER;
        if (aOrMax < bOrMax) {
            return -1;
        }
        else if (aOrMax > bOrMax) {
            return 1;
        }
        else {
            return 0;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9jb21tb24vcHJlZmVyZW5jZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeUdoRyxnRkFrREM7SUFLRCw4REFVQztJQTVJWSxRQUFBLHlCQUF5QixHQUFHLElBQUEsK0JBQWUsRUFBNEIsMEJBQTBCLENBQUMsQ0FBQztJQWlCbkcsUUFBQSw0Q0FBNEMsR0FBRyxvQ0FBb0MsQ0FBQztJQUNwRixRQUFBLHlDQUF5QyxHQUFHLGlDQUFpQyxDQUFDO0lBQzlFLFFBQUEsdUNBQXVDLEdBQUcsZ0NBQWdDLENBQUM7SUFFM0UsUUFBQSx1QkFBdUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEYsUUFBQSw0QkFBNEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDekYsUUFBQSw2QkFBNkIsR0FBRyxJQUFJLDBCQUFhLENBQVUsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdEYsUUFBQSxxQkFBcUIsR0FBRyxJQUFJLDBCQUFhLENBQVUscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakYsUUFBQSwwQkFBMEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEYsUUFBQSwwQkFBMEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2hGLFFBQUEsZ0NBQWdDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVGLFFBQUEsd0JBQXdCLEdBQUcsSUFBSSww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