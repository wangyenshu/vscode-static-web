/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/native/common/native", "vs/workbench/services/editor/common/editorService", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/environment/common/environmentService", "vs/platform/contextkey/common/contextkeys", "vs/platform/files/common/files", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/base/common/uri", "vs/base/browser/dom"], function (require, exports, nls_1, native_1, editorService_1, actions_1, actionCommonCategories_1, environmentService_1, contextkeys_1, files_1, environmentService_2, uri_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenUserDataFolderAction = exports.ReloadWindowWithExtensionsDisabledAction = exports.ConfigureRuntimeArgumentsAction = exports.ToggleDevToolsAction = void 0;
    class ToggleDevToolsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleDevTools',
                title: (0, nls_1.localize2)('toggleDevTools', 'Toggle Developer Tools'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
                    when: contextkeys_1.IsDevelopmentContext,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 39 /* KeyCode.KeyI */ }
                },
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '5_tools',
                    order: 1
                }
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            return nativeHostService.toggleDevTools({ targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId });
        }
    }
    exports.ToggleDevToolsAction = ToggleDevToolsAction;
    class ConfigureRuntimeArgumentsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.configureRuntimeArguments',
                title: (0, nls_1.localize2)('configureRuntimeArguments', 'Configure Runtime Arguments'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            await editorService.openEditor({
                resource: environmentService.argvResource,
                options: { pinned: true }
            });
        }
    }
    exports.ConfigureRuntimeArgumentsAction = ConfigureRuntimeArgumentsAction;
    class ReloadWindowWithExtensionsDisabledAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.reloadWindowWithExtensionsDisabled',
                title: (0, nls_1.localize2)('reloadWindowWithExtensionsDisabled', 'Reload With Extensions Disabled'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            return accessor.get(native_1.INativeHostService).reload({ disableExtensions: true });
        }
    }
    exports.ReloadWindowWithExtensionsDisabledAction = ReloadWindowWithExtensionsDisabledAction;
    class OpenUserDataFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openUserDataFolder',
                title: (0, nls_1.localize2)('openUserDataFolder', 'Open User Data Folder'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const fileService = accessor.get(files_1.IFileService);
            const environmentService = accessor.get(environmentService_2.INativeWorkbenchEnvironmentService);
            const userDataHome = uri_1.URI.file(environmentService.userDataPath);
            const file = await fileService.resolve(userDataHome);
            let itemToShow;
            if (file.children && file.children.length > 0) {
                itemToShow = file.children[0].resource;
            }
            else {
                itemToShow = userDataHome;
            }
            return nativeHostService.showItemInFolder(itemToShow.fsPath);
        }
    }
    exports.OpenUserDataFolderAction = OpenUserDataFolderAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2ZWxvcGVyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9lbGVjdHJvbi1zYW5kYm94L2FjdGlvbnMvZGV2ZWxvcGVyQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQWEsb0JBQXFCLFNBQVEsaUJBQU87UUFFaEQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGlDQUFpQztnQkFDckMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGdCQUFnQixFQUFFLHdCQUF3QixDQUFDO2dCQUM1RCxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTtnQkFDUixVQUFVLEVBQUU7b0JBQ1gsTUFBTSxFQUFFLDhDQUFvQyxFQUFFO29CQUM5QyxJQUFJLEVBQUUsa0NBQW9CO29CQUMxQixPQUFPLEVBQUUsbURBQTZCLHdCQUFlO29CQUNyRCxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsZ0RBQTJCLHdCQUFlLEVBQUU7aUJBQzVEO2dCQUNELElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxlQUFlO29CQUMxQixLQUFLLEVBQUUsU0FBUztvQkFDaEIsS0FBSyxFQUFFLENBQUM7aUJBQ1I7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWtCLENBQUMsQ0FBQztZQUUzRCxPQUFPLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFBLHFCQUFlLEdBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQy9GLENBQUM7S0FDRDtJQTNCRCxvREEy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