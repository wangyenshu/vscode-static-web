/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/activity", "vs/workbench/common/contextkeys"], function (require, exports, nls_1, configuration_1, storage_1, actions_1, contextkey_1, activity_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GLOBAL_ACTIVITY_TITLE_ACTION = exports.ACCOUNTS_ACTIVITY_TILE_ACTION = void 0;
    // --- Context Menu Actions --- //
    class ToggleConfigAction extends actions_1.Action2 {
        constructor(section, title, description, order, mainWindowOnly) {
            const when = mainWindowOnly ? contextkeys_1.IsAuxiliaryWindowFocusedContext.toNegated() : contextkey_1.ContextKeyExpr.true();
            super({
                id: `toggle.${section}`,
                title,
                metadata: description ? { description } : undefined,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${section}`, true),
                menu: [
                    {
                        id: actions_1.MenuId.TitleBarContext,
                        when,
                        order,
                        group: '2_config'
                    },
                    {
                        id: actions_1.MenuId.TitleBarTitleContext,
                        when,
                        order,
                        group: '2_config'
                    }
                ]
            });
            this.section = section;
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            const value = configService.getValue(this.section);
            configService.updateValue(this.section, !value);
        }
    }
    (0, actions_1.registerAction2)(class ToggleCommandCenter extends ToggleConfigAction {
        constructor() {
            super("window.commandCenter" /* LayoutSettings.COMMAND_CENTER */, (0, nls_1.localize)('toggle.commandCenter', 'Command Center'), (0, nls_1.localize)('toggle.commandCenterDescription', "Toggle visibility of the Command Center in title bar"), 1, false);
        }
    });
    (0, actions_1.registerAction2)(class ToggleLayoutControl extends ToggleConfigAction {
        constructor() {
            super('workbench.layoutControl.enabled', (0, nls_1.localize)('toggle.layout', 'Layout Controls'), (0, nls_1.localize)('toggle.layoutDescription', "Toggle visibility of the Layout Controls in title bar"), 2, true);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `toggle.${"window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */}`,
                title: (0, nls_1.localize)('toggle.hideCustomTitleBar', 'Hide Custom Title Bar'),
                menu: [
                    { id: actions_1.MenuId.TitleBarContext, order: 0, when: contextkey_1.ContextKeyExpr.equals(contextkeys_1.TitleBarStyleContext.key, "native" /* TitlebarStyle.NATIVE */), group: '3_toggle' },
                    { id: actions_1.MenuId.TitleBarTitleContext, order: 0, when: contextkey_1.ContextKeyExpr.equals(contextkeys_1.TitleBarStyleContext.key, "native" /* TitlebarStyle.NATIVE */), group: '3_toggle' },
                ]
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "never" /* CustomTitleBarVisibility.NEVER */);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCustomTitleBarWindowed extends actions_1.Action2 {
        constructor() {
            super({
                id: `toggle.${"window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */}.windowed`,
                title: (0, nls_1.localize)('toggle.hideCustomTitleBarInFullScreen', 'Hide Custom Title Bar In Full Screen'),
                menu: [
                    { id: actions_1.MenuId.TitleBarContext, order: 1, when: contextkeys_1.IsMainWindowFullscreenContext, group: '3_toggle' },
                    { id: actions_1.MenuId.TitleBarTitleContext, order: 1, when: contextkeys_1.IsMainWindowFullscreenContext, group: '3_toggle' },
                ]
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "windowed" /* CustomTitleBarVisibility.WINDOWED */);
        }
    });
    class ToggleCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `toggle.toggleCustomTitleBar`,
                title: (0, nls_1.localize)('toggle.customTitleBar', 'Custom Title Bar'),
                toggled: contextkeys_1.TitleBarVisibleContext,
                menu: [
                    {
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        order: 6,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(contextkeys_1.TitleBarStyleContext.key, "native" /* TitlebarStyle.NATIVE */), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.enabled', false), contextkey_1.ContextKeyExpr.equals('config.window.commandCenter', false), contextkey_1.ContextKeyExpr.notEquals('config.workbench.editor.editorActionsLocation', 'titleBar'), contextkey_1.ContextKeyExpr.notEquals('config.workbench.activityBar.location', 'top'), contextkey_1.ContextKeyExpr.notEquals('config.workbench.activityBar.location', 'bottom'))?.negate()), contextkeys_1.IsMainWindowFullscreenContext),
                        group: '2_workbench_layout'
                    },
                ],
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const titleBarVisibility = configService.getValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */);
            switch (titleBarVisibility) {
                case "never" /* CustomTitleBarVisibility.NEVER */:
                    configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "auto" /* CustomTitleBarVisibility.AUTO */);
                    break;
                case "windowed" /* CustomTitleBarVisibility.WINDOWED */: {
                    const isFullScreen = contextkeys_1.IsMainWindowFullscreenContext.evaluate(contextKeyService.getContext(null));
                    if (isFullScreen) {
                        configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "auto" /* CustomTitleBarVisibility.AUTO */);
                    }
                    else {
                        configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "never" /* CustomTitleBarVisibility.NEVER */);
                    }
                    break;
                }
                case "auto" /* CustomTitleBarVisibility.AUTO */:
                default:
                    configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "never" /* CustomTitleBarVisibility.NEVER */);
                    break;
            }
        }
    }
    (0, actions_1.registerAction2)(ToggleCustomTitleBar);
    (0, actions_1.registerAction2)(class ShowCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `showCustomTitleBar`,
                title: (0, nls_1.localize2)('showCustomTitleBar', "Show Custom Title Bar"),
                precondition: contextkeys_1.TitleBarVisibleContext.negate(),
                f1: true
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "auto" /* CustomTitleBarVisibility.AUTO */);
        }
    });
    (0, actions_1.registerAction2)(class HideCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `hideCustomTitleBar`,
                title: (0, nls_1.localize2)('hideCustomTitleBar', "Hide Custom Title Bar"),
                precondition: contextkeys_1.TitleBarVisibleContext,
                f1: true
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "never" /* CustomTitleBarVisibility.NEVER */);
        }
    });
    (0, actions_1.registerAction2)(class HideCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `hideCustomTitleBarInFullScreen`,
                title: (0, nls_1.localize2)('hideCustomTitleBarInFullScreen', "Hide Custom Title Bar In Full Screen"),
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.TitleBarVisibleContext, contextkeys_1.IsMainWindowFullscreenContext),
                f1: true
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "windowed" /* CustomTitleBarVisibility.WINDOWED */);
        }
    });
    (0, actions_1.registerAction2)(class ToggleEditorActions extends actions_1.Action2 {
        static { this.settingsID = `workbench.editor.editorActionsLocation`; }
        constructor() {
            const titleBarContextCondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.workbench.editor.showTabs`, 'none').negate(), contextkey_1.ContextKeyExpr.equals(`config.${ToggleEditorActions.settingsID}`, 'default'))?.negate();
            super({
                id: `toggle.${ToggleEditorActions.settingsID}`,
                title: (0, nls_1.localize)('toggle.editorActions', 'Editor Actions'),
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${ToggleEditorActions.settingsID}`, 'hidden').negate(),
                menu: [
                    { id: actions_1.MenuId.TitleBarContext, order: 3, when: titleBarContextCondition, group: '2_config' },
                    { id: actions_1.MenuId.TitleBarTitleContext, order: 3, when: titleBarContextCondition, group: '2_config' }
                ]
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            const storageService = accessor.get(storage_1.IStorageService);
            const location = configService.getValue(ToggleEditorActions.settingsID);
            if (location === 'hidden') {
                const showTabs = configService.getValue("workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */);
                // If tabs are visible, then set the editor actions to be in the title bar
                if (showTabs !== 'none') {
                    configService.updateValue(ToggleEditorActions.settingsID, 'titleBar');
                }
                // If tabs are not visible, then set the editor actions to the last location the were before being hidden
                else {
                    const storedValue = storageService.get(ToggleEditorActions.settingsID, 0 /* StorageScope.PROFILE */);
                    configService.updateValue(ToggleEditorActions.settingsID, storedValue ?? 'default');
                }
                storageService.remove(ToggleEditorActions.settingsID, 0 /* StorageScope.PROFILE */);
            }
            // Store the current value (titleBar or default) in the storage service for later to restore
            else {
                configService.updateValue(ToggleEditorActions.settingsID, 'hidden');
                storageService.store(ToggleEditorActions.settingsID, location, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
        }
    });
    // --- Toolbar actions --- //
    exports.ACCOUNTS_ACTIVITY_TILE_ACTION = {
        id: activity_1.ACCOUNTS_ACTIVITY_ID,
        label: (0, nls_1.localize)('accounts', "Accounts"),
        tooltip: (0, nls_1.localize)('accounts', "Accounts"),
        class: undefined,
        enabled: true,
        run: function () { }
    };
    exports.GLOBAL_ACTIVITY_TITLE_ACTION = {
        id: activity_1.GLOBAL_ACTIVITY_ID,
        label: (0, nls_1.localize)('manage', "Manage"),
        tooltip: (0, nls_1.localize)('manage', "Manage"),
        class: undefined,
        enabled: true,
        run: function () { }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGl0bGViYXJBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvdGl0bGViYXIvdGl0bGViYXJBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxrQ0FBa0M7SUFFbEMsTUFBTSxrQkFBbUIsU0FBUSxpQkFBTztRQUV2QyxZQUE2QixPQUFlLEVBQUUsS0FBYSxFQUFFLFdBQWtELEVBQUUsS0FBYSxFQUFFLGNBQXVCO1lBQ3RKLE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsNkNBQStCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLDJCQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEcsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxVQUFVLE9BQU8sRUFBRTtnQkFDdkIsS0FBSztnQkFDTCxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUNuRCxPQUFPLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUM7Z0JBQ3pELElBQUksRUFBRTtvQkFDTDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxlQUFlO3dCQUMxQixJQUFJO3dCQUNKLEtBQUs7d0JBQ0wsS0FBSyxFQUFFLFVBQVU7cUJBQ2pCO29CQUNEO3dCQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLG9CQUFvQjt3QkFDL0IsSUFBSTt3QkFDSixLQUFLO3dCQUNMLEtBQUssRUFBRSxVQUFVO3FCQUNqQjtpQkFDRDthQUNELENBQUMsQ0FBQztZQXJCeUIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQXNCNUMsQ0FBQztRQUVELEdBQUcsQ0FB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