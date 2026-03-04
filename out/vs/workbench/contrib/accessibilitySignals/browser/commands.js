/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/themables", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/configuration/common/configuration", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/preferences/common/preferences"], function (require, exports, codicons_1, themables_1, nls_1, accessibility_1, actions_1, accessibilitySignalService_1, configuration_1, quickInput_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowAccessibilityAnnouncementHelp = exports.ShowSignalSoundHelp = void 0;
    class ShowSignalSoundHelp extends actions_1.Action2 {
        static { this.ID = 'signals.sounds.help'; }
        constructor() {
            super({
                id: ShowSignalSoundHelp.ID,
                title: (0, nls_1.localize2)('signals.sound.help', "Help: List Signal Sounds"),
                f1: true,
                metadata: {
                    description: (0, nls_1.localize)('accessibility.sound.help.description', "List all accessibility sounds, noises, or audio cues and configure their settings")
                }
            });
        }
        async run(accessor) {
            const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const accessibilityService = accessor.get(accessibility_1.IAccessibilityService);
            const preferencesService = accessor.get(preferences_1.IPreferencesService);
            const userGestureSignals = [accessibilitySignalService_1.AccessibilitySignal.save, accessibilitySignalService_1.AccessibilitySignal.format];
            const items = accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.map((signal, idx) => ({
                label: userGestureSignals.includes(signal) ? `${signal.name} (${configurationService.getValue(signal.settingsKey + '.sound')})` : signal.name,
                signal,
                buttons: userGestureSignals.includes(signal) ? [{
                        iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.settingsGear),
                        tooltip: (0, nls_1.localize)('sounds.help.settings', 'Configure Sound'),
                        alwaysVisible: true
                    }] : []
            })).sort((a, b) => a.label.localeCompare(b.label));
            const qp = quickInputService.createQuickPick();
            qp.items = items;
            qp.selectedItems = items.filter(i => accessibilitySignalService.isSoundEnabled(i.signal) || userGestureSignals.includes(i.signal) && configurationService.getValue(i.signal.settingsKey + '.sound') !== 'never');
            qp.onDidAccept(() => {
                const enabledSounds = qp.selectedItems.map(i => i.signal);
                const disabledSounds = qp.items.map(i => i.signal).filter(i => !enabledSounds.includes(i));
                for (const signal of enabledSounds) {
                    let { sound, announcement } = configurationService.getValue(signal.settingsKey);
                    sound = userGestureSignals.includes(signal) ? 'userGesture' : accessibilityService.isScreenReaderOptimized() ? 'auto' : 'on';
                    if (announcement) {
                        configurationService.updateValue(signal.settingsKey, { sound, announcement });
                    }
                    else {
                        configurationService.updateValue(signal.settingsKey, { sound });
                    }
                }
                for (const signal of disabledSounds) {
                    const announcement = configurationService.getValue(signal.settingsKey + '.announcement');
                    const sound = getDisabledSettingValue(userGestureSignals.includes(signal), accessibilityService.isScreenReaderOptimized());
                    const value = announcement ? { sound, announcement } : { sound };
                    configurationService.updateValue(signal.settingsKey, value);
                }
                qp.hide();
            });
            qp.onDidTriggerItemButton(e => {
                preferencesService.openUserSettings({ jsonEditor: true, revealSetting: { key: e.item.signal.settingsKey, edit: true } });
            });
            qp.onDidChangeActive(() => {
                accessibilitySignalService.playSound(qp.activeItems[0].signal.sound.getSound(true), true, accessibilitySignalService_1.AcknowledgeDocCommentsToken);
            });
            qp.placeholder = (0, nls_1.localize)('sounds.help.placeholder', 'Select a sound to play and configure');
            qp.canSelectMany = true;
            await qp.show();
        }
    }
    exports.ShowSignalSoundHelp = ShowSignalSoundHelp;
    function getDisabledSettingValue(isUserGestureSignal, isScreenReaderOptimized) {
        return isScreenReaderOptimized ? (isUserGestureSignal ? 'never' : 'off') : (isUserGestureSignal ? 'never' : 'auto');
    }
    class ShowAccessibilityAnnouncementHelp extends actions_1.Action2 {
        static { this.ID = 'accessibility.announcement.help'; }
        constructor() {
            super({
                id: ShowAccessibilityAnnouncementHelp.ID,
                title: (0, nls_1.localize2)('accessibility.announcement.help', "Help: List Signal Announcements"),
                f1: true,
                metadata: {
                    description: (0, nls_1.localize)('accessibility.announcement.help.description', "List all accessibility announcements, alerts, braille messages, and configure their settings")
                }
            });
        }
        async run(accessor) {
            const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const accessibilityService = accessor.get(accessibility_1.IAccessibilityService);
            const preferencesService = accessor.get(preferences_1.IPreferencesService);
            const userGestureSignals = [accessibilitySignalService_1.AccessibilitySignal.save, accessibilitySignalService_1.AccessibilitySignal.format];
            const items = accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.filter(c => !!c.legacyAnnouncementSettingsKey).map((signal, idx) => ({
                label: userGestureSignals.includes(signal) ? `${signal.name} (${configurationService.getValue(signal.settingsKey + '.announcement')})` : signal.name,
                signal,
                buttons: userGestureSignals.includes(signal) ? [{
                        iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.settingsGear),
                        tooltip: (0, nls_1.localize)('announcement.help.settings', 'Configure Announcement'),
                        alwaysVisible: true,
                    }] : []
            })).sort((a, b) => a.label.localeCompare(b.label));
            const qp = quickInputService.createQuickPick();
            qp.items = items;
            qp.selectedItems = items.filter(i => accessibilitySignalService.isAnnouncementEnabled(i.signal) || userGestureSignals.includes(i.signal) && configurationService.getValue(i.signal.settingsKey + '.announcement') !== 'never');
            const screenReaderOptimized = accessibilityService.isScreenReaderOptimized();
            qp.onDidAccept(() => {
                if (!screenReaderOptimized) {
                    // announcements are off by default when screen reader is not active
                    qp.hide();
                    return;
                }
                const enabledAnnouncements = qp.selectedItems.map(i => i.signal);
                const disabledAnnouncements = accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.filter(cue => !!cue.legacyAnnouncementSettingsKey && !enabledAnnouncements.includes(cue));
                for (const signal of enabledAnnouncements) {
                    let { sound, announcement } = configurationService.getValue(signal.settingsKey);
                    announcement = userGestureSignals.includes(signal) ? 'userGesture' : signal.announcementMessage && accessibilityService.isScreenReaderOptimized() ? 'auto' : undefined;
                    configurationService.updateValue(signal.settingsKey, { sound, announcement });
                }
                for (const signal of disabledAnnouncements) {
                    const announcement = getDisabledSettingValue(userGestureSignals.includes(signal), true);
                    const sound = configurationService.getValue(signal.settingsKey + '.sound');
                    const value = announcement ? { sound, announcement } : { sound };
                    configurationService.updateValue(signal.settingsKey, value);
                }
                qp.hide();
            });
            qp.onDidTriggerItemButton(e => {
                preferencesService.openUserSettings({ jsonEditor: true, revealSetting: { key: e.item.signal.settingsKey, edit: true } });
            });
            qp.placeholder = screenReaderOptimized ? (0, nls_1.localize)('announcement.help.placeholder', 'Select an announcement to configure') : (0, nls_1.localize)('announcement.help.placeholder.disabled', 'Screen reader is not active, announcements are disabled by default.');
            qp.canSelectMany = true;
            await qp.show();
        }
    }
    exports.ShowAccessibilityAnnouncementHelp = ShowAccessibilityAnnouncementHelp;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hY2Nlc3NpYmlsaXR5U2lnbmFscy9icm93c2VyL2NvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFhLG1CQUFvQixTQUFRLGlCQUFPO2lCQUMvQixPQUFFLEdBQUcscUJBQXFCLENBQUM7UUFFM0M7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLG1CQUFtQixDQUFDLEVBQUU7Z0JBQzFCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxvQkFBb0IsRUFBRSwwQkFBMEIsQ0FBQztnQkFDbEUsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsUUFBUSxFQUFFO29CQUNULFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQ0FBc0MsRUFBRSxtRkFBbUYsQ0FBQztpQkFDbEo7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUM1QyxNQUFNLDBCQUEwQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0RBQTJCLENBQUMsQ0FBQztZQUM3RSxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztZQUMzRCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUNqRSxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUNqRSxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLENBQUMsQ0FBQztZQUM3RCxNQUFNLGtCQUFrQixHQUFHLENBQUMsZ0RBQW1CLENBQUMsSUFBSSxFQUFF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