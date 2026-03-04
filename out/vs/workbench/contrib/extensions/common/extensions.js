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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions"], function (require, exports, instantiation_1, lifecycle_1, extensionManagementUtil_1, contextkey_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extensionsSearchActionsMenu = exports.UPDATE_ACTIONS_GROUP = exports.INSTALL_ACTIONS_GROUP = exports.THEME_ACTIONS_GROUP = exports.CONTEXT_HAS_GALLERY = exports.HasOutdatedExtensionsContext = exports.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID = exports.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID = exports.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID = exports.TOGGLE_IGNORE_EXTENSION_ACTION_ID = exports.OUTDATED_EXTENSIONS_VIEW_ID = exports.WORKSPACE_RECOMMENDATIONS_VIEW_ID = exports.ExtensionContainers = exports.CloseExtensionDetailsOnViewChangeKey = exports.AutoCheckUpdatesConfigurationKey = exports.AutoUpdateConfigurationKey = exports.ConfigurationKey = exports.ExtensionEditorTab = exports.IExtensionsWorkbenchService = exports.ExtensionRuntimeActionType = exports.ExtensionState = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.extensions';
    var ExtensionState;
    (function (ExtensionState) {
        ExtensionState[ExtensionState["Installing"] = 0] = "Installing";
        ExtensionState[ExtensionState["Installed"] = 1] = "Installed";
        ExtensionState[ExtensionState["Uninstalling"] = 2] = "Uninstalling";
        ExtensionState[ExtensionState["Uninstalled"] = 3] = "Uninstalled";
    })(ExtensionState || (exports.ExtensionState = ExtensionState = {}));
    var ExtensionRuntimeActionType;
    (function (ExtensionRuntimeActionType) {
        ExtensionRuntimeActionType["ReloadWindow"] = "reloadWindow";
        ExtensionRuntimeActionType["RestartExtensions"] = "restartExtensions";
        ExtensionRuntimeActionType["DownloadUpdate"] = "downloadUpdate";
        ExtensionRuntimeActionType["ApplyUpdate"] = "applyUpdate";
        ExtensionRuntimeActionType["QuitAndInstall"] = "quitAndInstall";
    })(ExtensionRuntimeActionType || (exports.ExtensionRuntimeActionType = ExtensionRuntimeActionType = {}));
    exports.IExtensionsWorkbenchService = (0, instantiation_1.createDecorator)('extensionsWorkbenchService');
    var ExtensionEditorTab;
    (function (ExtensionEditorTab) {
        ExtensionEditorTab["Readme"] = "readme";
        ExtensionEditorTab["Features"] = "features";
        ExtensionEditorTab["Changelog"] = "changelog";
        ExtensionEditorTab["Dependencies"] = "dependencies";
        ExtensionEditorTab["ExtensionPack"] = "extensionPack";
    })(ExtensionEditorTab || (exports.ExtensionEditorTab = ExtensionEditorTab = {}));
    exports.ConfigurationKey = 'extensions';
    exports.AutoUpdateConfigurationKey = 'extensions.autoUpdate';
    exports.AutoCheckUpdatesConfigurationKey = 'extensions.autoCheckUpdates';
    exports.CloseExtensionDetailsOnViewChangeKey = 'extensions.closeExtensionDetailsOnViewChange';
    let ExtensionContainers = class ExtensionContainers extends lifecycle_1.Disposable {
        constructor(containers, extensionsWorkbenchService) {
            super();
            this.containers = containers;
            this._register(extensionsWorkbenchService.onChange(this.update, this));
        }
        set extension(extension) {
            this.containers.forEach(c => c.extension = extension);
        }
        update(extension) {
            for (const container of this.containers) {
                if (extension && container.extension) {
                    if ((0, extensionManagementUtil_1.areSameExtensions)(container.extension.identifier, extension.identifier)) {
                        if (container.extension.server && extension.server && container.extension.server !== extension.server) {
                            if (container.updateWhenCounterExtensionChanges) {
                                container.update();
                            }
                        }
                        else {
                            container.extension = extension;
                        }
                    }
                }
                else {
                    container.update();
                }
            }
        }
    };
    exports.ExtensionContainers = ExtensionContainers;
    exports.ExtensionContainers = ExtensionContainers = __decorate([
        __param(1, exports.IExtensionsWorkbenchService)
    ], ExtensionContainers);
    exports.WORKSPACE_RECOMMENDATIONS_VIEW_ID = 'workbench.views.extensions.workspaceRecommendations';
    exports.OUTDATED_EXTENSIONS_VIEW_ID = 'workbench.views.extensions.searchOutdated';
    exports.TOGGLE_IGNORE_EXTENSION_ACTION_ID = 'workbench.extensions.action.toggleIgnoreExtension';
    exports.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID = 'workbench.extensions.action.installVSIX';
    exports.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID = 'workbench.extensions.command.installFromVSIX';
    exports.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID = 'workbench.extensions.action.listWorkspaceUnsupportedExtensions';
    // Context Keys
    exports.HasOutdatedExtensionsContext = new contextkey_1.RawContextKey('hasOutdatedExtensions', false);
    exports.CONTEXT_HAS_GALLERY = new contextkey_1.RawContextKey('hasGallery', false);
    // Context Menu Groups
    exports.THEME_ACTIONS_GROUP = '_theme_';
    exports.INSTALL_ACTIONS_GROUP = '0_install';
    exports.UPDATE_ACTIONS_GROUP = '0_update';
    exports.extensionsSearchActionsMenu = new actions_1.MenuId('extensionsSearchActionsMenu');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJuRixRQUFBLFVBQVUsR0FBRywyQkFBMkIsQ0FBQztJQVl0RCxJQUFrQixjQUtqQjtJQUxELFdBQWtCLGNBQWM7UUFDL0IsK0RBQVUsQ0FBQTtRQUNWLDZEQUFTLENBQUE7UUFDVCxtRUFBWSxDQUFBO1FBQ1osaUVBQVcsQ0FBQTtJQUNaLENBQUMsRUFMaUIsY0FBYyw4QkFBZCxjQUFjLFFBSy9CO0lBRUQsSUFBa0IsMEJBTWpCO0lBTkQsV0FBa0IsMEJBQTBCO1FBQzNDLDJEQUE2QixDQUFBO1FBQzdCLHFFQUF1QyxDQUFBO1FBQ3ZDLCtEQUFpQyxDQUFBO1FBQ2pDLHlEQUEyQixDQUFBO1FBQzNCLCtEQUFpQyxDQUFBO0lBQ2xDLENBQUMsRUFOaUIsMEJBQTBCLDBDQUExQiwwQkFBMEIsUUFNM0M7SUF3RFksUUFBQSwyQkFBMkIsR0FBRyxJQUFBLCtCQUFlLEVBQThCLDRCQUE0QixDQUFDLENBQUM7SUFrRHRILElBQWtCLGtCQU1qQjtJQU5ELFdBQWtCLGtCQUFrQjtRQUNuQyx1Q0FBaUIsQ0FBQTtRQUNqQiwyQ0FBcUIsQ0FBQTtRQUNyQiw2Q0FBdUIsQ0FBQTtRQUN2QixtREFBNkIsQ0FBQTtRQUM3QixxREFBK0IsQ0FBQTtJQUNoQyxDQUFDLEVBTmlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBTW5DO0lBRVksUUFBQSxnQkFBZ0IsR0FBRyxZQUFZLENBQUM7SUFDaEMsUUFBQSwwQkFBMEIsR0FBRyx1QkFBdUIsQ0FBQztJQUNyRCxRQUFBLGdDQUFnQyxHQUFHLDZCQUE2QixDQUFD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