/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/window/electron-sandbox/window", "vs/platform/keybinding/common/keybinding", "vs/base/browser/browser", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/platform/configuration/common/configuration", "vs/platform/native/common/native", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/workspace/common/workspace", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/base/common/platform", "vs/base/browser/dom", "vs/platform/window/common/window", "vs/css!./media/actions"], function (require, exports, uri_1, nls_1, window_1, keybinding_1, browser_1, files_1, model_1, language_1, quickInput_1, getIconClasses_1, configuration_1, native_1, codicons_1, themables_1, workspace_1, actions_1, actionCommonCategories_1, platform_1, dom_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleWindowTabsBarHandler = exports.MergeWindowTabsHandlerHandler = exports.MoveWindowTabToNewWindowHandler = exports.ShowNextWindowTabHandler = exports.ShowPreviousWindowTabHandler = exports.NewWindowTabHandler = exports.QuickSwitchWindowAction = exports.SwitchWindowAction = exports.ZoomResetAction = exports.ZoomOutAction = exports.ZoomInAction = exports.CloseWindowAction = void 0;
    class CloseWindowAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.closeWindow'; }
        constructor() {
            super({
                id: CloseWindowAction.ID,
                title: {
                    ...(0, nls_1.localize2)('closeWindow', "Close Window"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miCloseWindow', comment: ['&& denotes a mnemonic'] }, "Clos&&e Window"),
                },
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */ },
                    linux: { primary: 512 /* KeyMod.Alt */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */] },
                    win: { primary: 512 /* KeyMod.Alt */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */] }
                },
                menu: {
                    id: actions_1.MenuId.MenubarFileMenu,
                    group: '6_close',
                    order: 4
                }
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            return nativeHostService.closeWindow({ targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId });
        }
    }
    exports.CloseWindowAction = CloseWindowAction;
    class BaseZoomAction extends actions_1.Action2 {
        static { this.ZOOM_LEVEL_SETTING_KEY = 'window.zoomLevel'; }
        static { this.ZOOM_PER_WINDOW_SETTING_KEY = 'window.zoomPerWindow'; }
        constructor(desc) {
            super(desc);
        }
        async setZoomLevel(accessor, levelOrReset) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            let target;
            if (configurationService.getValue(BaseZoomAction.ZOOM_PER_WINDOW_SETTING_KEY) !== false) {
                target = window_1.ApplyZoomTarget.ACTIVE_WINDOW;
            }
            else {
                target = window_1.ApplyZoomTarget.ALL_WINDOWS;
            }
            let level;
            if (typeof levelOrReset === 'number') {
                level = Math.round(levelOrReset); // prevent fractional zoom levels
            }
            else {
                // reset to 0 when we apply to all windows
                if (target === window_1.ApplyZoomTarget.ALL_WINDOWS) {
                    level = 0;
                }
                // otherwise, reset to the default zoom level
                else {
                    const defaultLevel = configurationService.getValue(BaseZoomAction.ZOOM_LEVEL_SETTING_KEY);
                    if (typeof defaultLevel === 'number') {
                        level = defaultLevel;
                    }
                    else {
                        level = 0;
                    }
                }
            }
            if (level > window_1.MAX_ZOOM_LEVEL || level < window_1.MIN_ZOOM_LEVEL) {
                return; // https://github.com/microsoft/vscode/issues/48357
            }
            if (target === window_1.ApplyZoomTarget.ALL_WINDOWS) {
                await configurationService.updateValue(BaseZoomAction.ZOOM_LEVEL_SETTING_KEY, level);
            }
            (0, window_1.applyZoom)(level, target);
        }
    }
    class ZoomInAction extends BaseZoomAction {
        constructor() {
            super({
                id: 'workbench.action.zoomIn',
                title: {
                    ...(0, nls_1.localize2)('zoomIn', "Zoom In"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miZoomIn', comment: ['&& denotes a mnemonic'] }, "&&Zoom In"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 86 /* KeyCode.Equal */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 86 /* KeyCode.Equal */, 2048 /* KeyMod.CtrlCmd */ | 109 /* KeyCode.NumpadAdd */]
                },
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '5_zoom',
                    order: 1
                }
            });
        }
        run(accessor) {
            return super.setZoomLevel(accessor, (0, browser_1.getZoomLevel)((0, dom_1.getActiveWindow)()) + 1);
        }
    }
    exports.ZoomInAction = ZoomInAction;
    class ZoomOutAction extends BaseZoomAction {
        constructor() {
            super({
                id: 'workbench.action.zoomOut',
                title: {
                    ...(0, nls_1.localize2)('zoomOut', "Zoom Out"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miZoomOut', comment: ['&& denotes a mnemonic'] }, "&&Zoom Out"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Minus */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Minus */, 2048 /* KeyMod.CtrlCmd */ | 111 /* KeyCode.NumpadSubtract */],
                    linux: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Minus */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 111 /* KeyCode.NumpadSubtract */]
                    }
                },
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '5_zoom',
                    order: 2
                }
            });
        }
        run(accessor) {
            return super.setZoomLevel(accessor, (0, browser_1.getZoomLevel)((0, dom_1.getActiveWindow)()) - 1);
        }
    }
    exports.ZoomOutAction = ZoomOutAction;
    class ZoomResetAction extends BaseZoomAction {
        constructor() {
            super({
                id: 'workbench.action.zoomReset',
                title: {
                    ...(0, nls_1.localize2)('zoomReset', "Reset Zoom"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miZoomReset', comment: ['&& denotes a mnemonic'] }, "&&Reset Zoom"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 98 /* KeyCode.Numpad0 */
                },
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '5_zoom',
                    order: 3
                }
            });
        }
        run(accessor) {
            return super.setZoomLevel(accessor, true);
        }
    }
    exports.ZoomResetAction = ZoomResetAction;
    class BaseSwitchWindow extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
            this.closeWindowAction = {
                iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.removeClose),
                tooltip: (0, nls_1.localize)('close', "Close Window")
            };
            this.closeDirtyWindowAction = {
                iconClass: 'dirty-window ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.closeDirty),
                tooltip: (0, nls_1.localize)('close', "Close Window"),
                alwaysVisible: true
            };
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const modelService = accessor.get(model_1.IModelService);
            const languageService = accessor.get(language_1.ILanguageService);
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const currentWindowId = (0, dom_1.getActiveWindow)().vscodeWindowId;
            const windows = await nativeHostService.getWindows({ includeAuxiliaryWindows: true });
            const mainWindows = new Set();
            const mapMainWindowToAuxiliaryWindows = new Map();
            for (const window of windows) {
                if ((0, window_2.isOpenedAuxiliaryWindow)(window)) {
                    let auxiliaryWindows = mapMainWindowToAuxiliaryWindows.get(window.parentId);
                    if (!auxiliaryWindows) {
                        auxiliaryWindows = new Set();
                        mapMainWindowToAuxiliaryWindows.set(window.parentId, auxiliaryWindows);
                    }
                    auxiliaryWindows.add(window);
                }
                else {
                    mainWindows.add(window);
                }
            }
            const picks = [];
            for (const window of mainWindows) {
                const auxiliaryWindows = mapMainWindowToAuxiliaryWindows.get(window.id);
                if (mapMainWindowToAuxiliaryWindows.size > 0) {
                    picks.push({ type: 'separator', payload: -1, label: auxiliaryWindows ? (0, nls_1.localize)('windowGroup', "window group") : undefined });
                }
                const resource = window.filename ? uri_1.URI.file(window.filename) : (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.workspace) ? window.workspace.uri : (0, workspace_1.isWorkspaceIdentifier)(window.workspace) ? window.workspace.configPath : undefined;
                const fileKind = window.filename ? files_1.FileKind.FILE : (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.workspace) ? files_1.FileKind.FOLDER : (0, workspace_1.isWorkspaceIdentifier)(window.workspace) ? files_1.FileKind.ROOT_FOLDER : files_1.FileKind.FILE;
                const pick = {
                    windowId: window.id,
                    label: window.title,
                    ariaLabel: window.dirty ? (0, nls_1.localize)('windowDirtyAriaLabel', "{0}, window with unsaved changes", window.title) : window.title,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource, fileKind),
                    description: (currentWindowId === window.id) ? (0, nls_1.localize)('current', "Current Window") : undefined,
                    buttons: currentWindowId !== window.id ? window.dirty ? [this.closeDirtyWindowAction] : [this.closeWindowAction] : undefined
                };
                picks.push(pick);
                if (auxiliaryWindows) {
                    for (const auxiliaryWindow of auxiliaryWindows) {
                        const pick = {
                            windowId: auxiliaryWindow.id,
                            label: auxiliaryWindow.title,
                            iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, auxiliaryWindow.filename ? uri_1.URI.file(auxiliaryWindow.filename) : undefined, files_1.FileKind.FILE),
                            description: (currentWindowId === auxiliaryWindow.id) ? (0, nls_1.localize)('current', "Current Window") : undefined,
                            buttons: [this.closeWindowAction]
                        };
                        picks.push(pick);
                    }
                }
            }
            const placeHolder = (0, nls_1.localize)('switchWindowPlaceHolder', "Select a window to switch to");
            const autoFocusIndex = (picks.indexOf(picks.filter(pick => pick.windowId === currentWindowId)[0]) + 1) % picks.length;
            const pick = await quickInputService.pick(picks, {
                contextKey: 'inWindowsPicker',
                activeItem: picks[autoFocusIndex],
                placeHolder,
                quickNavigate: this.isQuickNavigate() ? { keybindings: keybindingService.lookupKeybindings(this.desc.id) } : undefined,
                hideInput: this.isQuickNavigate(),
                onDidTriggerItemButton: async (context) => {
                    await nativeHostService.closeWindow({ targetWindowId: context.item.windowId });
                    context.removeItem();
                }
            });
            if (pick) {
                nativeHostService.focusWindow({ targetWindowId: pick.windowId });
            }
        }
    }
    class SwitchWindowAction extends BaseSwitchWindow {
        constructor() {
            super({
                id: 'workbench.action.switchWindow',
                title: (0, nls_1.localize2)('switchWindow', 'Switch Window...'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 53 /* KeyCode.KeyW */ }
                }
            });
        }
        isQuickNavigate() {
            return false;
        }
    }
    exports.SwitchWindowAction = SwitchWindowAction;
    class QuickSwitchWindowAction extends BaseSwitchWindow {
        constructor() {
            super({
                id: 'workbench.action.quickSwitchWindow',
                title: (0, nls_1.localize2)('quickSwitchWindow', 'Quick Switch Window...'),
                f1: false // hide quick pickers from command palette to not confuse with the other entry that shows a input field
            });
        }
        isQuickNavigate() {
            return true;
        }
    }
    exports.QuickSwitchWindowAction = QuickSwitchWindowAction;
    function canRunNativeTabsHandler(accessor) {
        if (!platform_1.isMacintosh) {
            return false;
        }
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        return configurationService.getValue('window.nativeTabs') === true;
    }
    const NewWindowTabHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).newWindowTab();
    };
    exports.NewWindowTabHandler = NewWindowTabHandler;
    const ShowPreviousWindowTabHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).showPreviousWindowTab();
    };
    exports.ShowPreviousWindowTabHandler = ShowPreviousWindowTabHandler;
    const ShowNextWindowTabHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).showNextWindowTab();
    };
    exports.ShowNextWindowTabHandler = ShowNextWindowTabHandler;
    const MoveWindowTabToNewWindowHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).moveWindowTabToNewWindow();
    };
    exports.MoveWindowTabToNewWindowHandler = MoveWindowTabToNewWindowHandler;
    const MergeWindowTabsHandlerHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).mergeAllWindowTabs();
    };
    exports.MergeWindowTabsHandlerHandler = MergeWindowTabsHandlerHandler;
    const ToggleWindowTabsBarHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).toggleWindowTabsBar();
    };
    exports.ToggleWindowTabsBarHandler = ToggleWindowTabsBarHandler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9lbGVjdHJvbi1zYW5kYm94L2FjdGlvbnMvd2luZG93QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0QmhHLE1BQWEsaUJBQWtCLFNBQVEsaUJBQU87aUJBRTdCLE9BQUUsR0FBRyw4QkFBOEIsQ0FBQztRQUVwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsaUJBQWlCLENBQUMsRUFBRTtnQkFDeEIsS0FBSyxFQUFFO29CQUNOLEdBQUcsSUFBQSxlQUFTLEVBQUMsYUFBYSxFQUFFLGNBQWMsQ0FBQztvQkFDM0MsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsZ0JBQWdCLENBQUM7aUJBQ3ZHO2dCQUNELEVBQUUsRUFBRSxJQUFJO2dCQUNSLFVBQVUsRUFBRTtvQkFDWCxNQUFNLDZDQUFtQztvQkFDekMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLG1EQUE2Qix3QkFBZSxFQUFFO29CQUM5RCxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsMENBQXVCLEVBQUUsU0FBUyxFQUFFLENBQUMsbURBQTZCLHdCQUFlLENBQUMsRUFBRTtvQkFDdEcsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLDBDQUF1QixFQUFFLFNBQVMsRUFBRSxDQUFDLG1EQUE2Qix3QkFBZSxDQUFDLEVBQUU7aUJBQ3BHO2dCQUNELElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxlQUFlO29CQUMxQixLQUFLLEVBQUUsU0FBUztvQkFDaEIsS0FBSyxFQUFFLENBQUM7aUJBQ1I7YUFDRCxDQUFDLENB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