/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/types", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/base/common/themables", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/common/constants", "vs/workbench/contrib/testing/common/testProfileService"], function (require, exports, arrays_1, types_1, nls_1, commands_1, quickInput_1, themables_1, icons_1, constants_1, testProfileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function buildPicker(accessor, { onlyGroup, showConfigureButtons = true, onlyForTest, onlyConfigurable, placeholder = (0, nls_1.localize)('testConfigurationUi.pick', 'Pick a test profile to use'), }) {
        const profileService = accessor.get(testProfileService_1.ITestProfileService);
        const items = [];
        const pushItems = (allProfiles, description) => {
            for (const profiles of (0, arrays_1.groupBy)(allProfiles, (a, b) => a.group - b.group)) {
                let addedHeader = false;
                if (onlyGroup) {
                    if (profiles[0].group !== onlyGroup) {
                        continue;
                    }
                    addedHeader = true; // showing one group, no need for label
                }
                for (const profile of profiles) {
                    if (onlyConfigurable && !profile.hasConfigurationHandler) {
                        continue;
                    }
                    if (!addedHeader) {
                        items.push({ type: 'separator', label: constants_1.testConfigurationGroupNames[profiles[0].group] });
                        addedHeader = true;
                    }
                    items.push(({
                        type: 'item',
                        profile,
                        label: profile.label,
                        description,
                        alwaysShow: true,
                        buttons: profile.hasConfigurationHandler && showConfigureButtons
                            ? [{
                                    iconClass: themables_1.ThemeIcon.asClassName(icons_1.testingUpdateProfiles),
                                    tooltip: (0, nls_1.localize)('updateTestConfiguration', 'Update Test Configuration')
                                }] : []
                    }));
                }
            }
        };
        if (onlyForTest !== undefined) {
            pushItems(profileService.getControllerProfiles(onlyForTest.controllerId).filter(p => (0, testProfileService_1.canUseProfileWithTest)(p, onlyForTest)));
        }
        else {
            for (const { profiles, controller } of profileService.all()) {
                pushItems(profiles, controller.label.value);
            }
        }
        const quickpick = accessor.get(quickInput_1.IQuickInputService).createQuickPick();
        quickpick.items = items;
        quickpick.placeholder = placeholder;
        return quickpick;
    }
    const triggerButtonHandler = (service, resolve) => (evt) => {
        const profile = evt.item.profile;
        if (profile) {
            service.configure(profile.controllerId, profile.profileId);
            resolve(undefined);
        }
    };
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.pickMultipleTestProfiles',
        handler: async (accessor, options) => {
            const profileService = accessor.get(testProfileService_1.ITestProfileService);
            const quickpick = buildPicker(accessor, options);
            if (!quickpick) {
                return;
            }
            quickpick.canSelectMany = true;
            if (options.selected) {
                quickpick.selectedItems = quickpick.items
                    .filter((i) => i.type === 'item')
                    .filter(i => options.selected.some(s => s.controllerId === i.profile.controllerId && s.profileId === i.profile.profileId));
            }
            const pick = await new Promise(resolve => {
                quickpick.onDidAccept(() => {
                    const selected = quickpick.selectedItems;
                    resolve(selected.map(s => s.profile).filter(types_1.isDefined));
                });
                quickpick.onDidHide(() => resolve(undefined));
                quickpick.onDidTriggerItemButton(triggerButtonHandler(profileService, resolve));
                quickpick.show();
            });
            quickpick.dispose();
            return pick;
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.pickTestProfile',
        handler: async (accessor, options) => {
            const profileService = accessor.get(testProfileService_1.ITestProfileService);
            const quickpick = buildPicker(accessor, options);
            if (!quickpick) {
                return;
            }
            const pick = await new Promise(resolve => {
                quickpick.onDidAccept(() => resolve(quickpick.selectedItems[0]?.profile));
                quickpick.onDidHide(() => resolve(undefined));
                quickpick.onDidTriggerItemButton(triggerButtonHandler(profileService, resolve));
                quickpick.show();
            });
            quickpick.dispose();
            return pick;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0NvbmZpZ3VyYXRpb25VaS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci90ZXN0aW5nQ29uZmlndXJhdGlvblVpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMkJoRyxTQUFTLFdBQVcsQ0FBQyxRQUEwQixFQUFFLEVBQ2hELFNBQVMsRUFDVCxvQkFBb0IsR0FBRyxJQUFJLEVBQzNCLFdBQVcsRUFDWCxnQkFBZ0IsRUFDaEIsV0FBVyxHQUFHLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLDRCQUE0QixDQUFDLEdBQ25EO1FBQzdCLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0NBQW1CLENBQUMsQ0FBQztRQUN6RCxNQUFNLEtBQUssR0FBb0UsRUFBRSxDQUFDO1FBQ2xGLE1BQU0sU0FBUyxHQUFHLENBQUMsV0FBOEIsRUFBRSxXQUFvQixFQUFFLEVBQUU7WUFDMUUsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFBLGdCQUFPLEVBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUUsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDO2dCQUN4QixJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNmLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDckMsU0FBUztvQkFDVixDQUFDO29CQUVELFdBQVcsR0FBRyxJQUFJLENBQUMsQ0FBQyx1Q0FBdUM7Z0JBQzVELENBQUM7Z0JBRUQsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUUs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