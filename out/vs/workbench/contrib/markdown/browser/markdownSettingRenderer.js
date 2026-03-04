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
define(["require", "exports", "vs/nls", "vs/workbench/services/preferences/common/preferences", "vs/workbench/contrib/preferences/browser/settingsTreeModels", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/workbench/services/preferences/common/preferencesModels", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/telemetry/common/telemetry", "vs/platform/clipboard/common/clipboardService"], function (require, exports, nls, preferences_1, settingsTreeModels_1, network_1, configuration_1, preferencesModels_1, contextView_1, actionViewItems_1, telemetry_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleSettingRenderer = void 0;
    const codeSettingRegex = /^<code (codesetting)="([^\s"\:]+)(?::([^"]+))?">/;
    let SimpleSettingRenderer = class SimpleSettingRenderer {
        constructor(_configurationService, _contextMenuService, _preferencesService, _telemetryService, _clipboardService) {
            this._configurationService = _configurationService;
            this._contextMenuService = _contextMenuService;
            this._preferencesService = _preferencesService;
            this._telemetryService = _telemetryService;
            this._clipboardService = _clipboardService;
            this._updatedSettings = new Map(); // setting ID to user's original setting value
            this._encounteredSettings = new Map(); // setting ID to setting
            this._featuredSettings = new Map(); // setting ID to feature value
            this.settingsGroups = undefined;
            this._defaultSettings = new preferencesModels_1.DefaultSettings([], 2 /* ConfigurationTarget.USER */);
        }
        get featuredSettingStates() {
            const result = new Map();
            for (const [settingId, value] of this._featuredSettings) {
                result.set(settingId, this._configurationService.getValue(settingId) === value);
            }
            return result;
        }
        getHtmlRenderer() {
            return (html) => {
                const match = codeSettingRegex.exec(html);
                if (match && match.length === 4) {
                    const settingId = match[2];
                    const rendered = this.render(settingId, match[3]);
                    if (rendered) {
                        html = html.replace(codeSettingRegex, rendered);
                    }
                }
                return html;
            };
        }
        settingToUriString(settingId, value) {
            return `${network_1.Schemas.codeSetting}://${settingId}${value ? `/${value}` : ''}`;
        }
        getSetting(settingId) {
            if (!this.settingsGroups) {
                this.settingsGroups = this._defaultSettings.getSettingsGroups();
            }
            if (this._encounteredSettings.has(settingId)) {
                return this._encounteredSettings.get(settingId);
            }
            for (const group of this.settingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        if (setting.key === settingId) {
                            this._encounteredSettings.set(settingId, setting);
                            return setting;
                        }
                    }
                }
            }
            return undefined;
        }
        parseValue(settingId, value) {
            if (value === 'undefined' || value === '') {
                return undefined;
            }
            const setting = this.getSetting(settingId);
            if (!setting) {
                return value;
            }
            switch (setting.type) {
                case 'boolean':
                    return value === 'true';
                case 'number':
                    return parseInt(value, 10);
                case 'string':
                default:
                    return value;
            }
        }
        render(settingId, newValue) {
            const setting = this.getSetting(settingId);
            if (!setting) {
                return '';
            }
            return this.renderSetting(setting, newValue);
        }
        viewInSettingsMessage(settingId, alreadyDisplayed) {
            if (alreadyDisplayed) {
                return nls.localize('viewInSettings', "View in Settings");
            }
            else {
                const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(settingId);
                return nls.localize('viewInSettingsDetailed', "View \"{0}: {1}\" in Settings", displayName.category, displayName.label);
            }
        }
        restorePreviousSettingMessage(settingId) {
            const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(settingId);
            return nls.localize('restorePreviousValue', "Restore value of \"{0}: {1}\"", displayName.category, displayName.label);
        }
        booleanSettingMessage(setting, booleanValue) {
            const currentValue = this._configurationService.getValue(setting.key);
            if (currentValue === booleanValue || (currentValue === undefined && setting.value === booleanValue)) {
                return undefined;
            }
            const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(setting.key);
            if (booleanValue) {
                return nls.localize('trueMessage', "Enable \"{0}: {1}\"", displayName.category, displayName.label);
            }
            else {
                return nls.localize('falseMessage', "Disable \"{0}: {1}\"", displayName.category, displayName.label);
            }
        }
        stringSettingMessage(setting, stringValue) {
            const currentValue = this._configurationService.getValue(setting.key);
            if (currentValue === stringValue || (currentValue === undefined && setting.value === stringValue)) {
                return undefined;
            }
            const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(setting.key);
            return nls.localize('stringValue', "Set \"{0}: {1}\" to \"{2}\"", displayName.category, displayName.label, stringValue);
        }
        numberSettingMessage(setting, numberValue) {
            const currentValue = this._configurationService.getValue(setting.key);
            if (currentValue === numberValue || (currentValue === undefined && setting.value === numberValue)) {
                return undefined;
            }
            const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(setting.key);
            return nls.localize('numberValue', "Set \"{0}: {1}\" to {2}", displayName.category, displayName.label, numberValue);
        }
        renderSetting(setting, newValue) {
            const href = this.settingToUriString(setting.key, newValue);
            const title = nls.localize('changeSettingTitle', "View or change setting");
            return `<code tabindex="0"><a href="${href}" class="codesetting" title="${title}" aria-role="button"><svg width="14" height="14" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM9.4 1l.5 2.4L12 2.1l2 2-1.4 2.1 2.4.4v2.8l-2.4.5L14 12l-2 2-2.1-1.4-.5 2.4H6.6l-.5-2.4L4 13.9l-2-2 1.4-2.1L1 9.4V6.6l2.4-.5L2.1 4l2-2 2.1 1.4.4-2.4h2.8zm.6 7c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM8 9c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z"/></svg>
			<span class="separator"></span>
			<span class="setting-name">${setting.key}</span>
		</a></code><code>`;
        }
        getSettingMessage(setting, newValue) {
            if (setting.type === 'boolean') {
                return this.booleanSettingMessage(setting, newValue);
            }
            else if (setting.type === 'string') {
                return this.stringSettingMessage(setting, newValue);
            }
            else if (setting.type === 'number') {
                return this.numberSettingMessage(setting, newValue);
            }
            return undefined;
        }
        async restoreSetting(settingId) {
            const userOriginalSettingValue = this._updatedSettings.get(settingId);
            this._updatedSettings.delete(settingId);
            return this._configurationService.updateValue(settingId, userOriginalSettingValue, 2 /* ConfigurationTarget.USER */);
        }
        async setSetting(settingId, currentSettingValue, newSettingValue) {
            this._updatedSettings.set(settingId, currentSettingValue);
            return this._configurationService.updateValue(settingId, newSettingValue, 2 /* ConfigurationTarget.USER */);
        }
        getActions(uri) {
            if (uri.scheme !== network_1.Schemas.codeSetting) {
                return;
            }
            const actions = [];
            const settingId = uri.authority;
            const newSettingValue = this.parseValue(uri.authority, uri.path.substring(1));
            const currentSettingValue = this._configurationService.inspect(settingId).userValue;
            if ((newSettingValue !== undefined) && newSettingValue === currentSettingValue && this._updatedSettings.has(settingId)) {
                const restoreMessage = this.restorePreviousSettingMessage(settingId);
                actions.push({
                    class: undefined,
                    id: 'restoreSetting',
                    enabled: true,
                    tooltip: restoreMessage,
                    label: restoreMessage,
                    run: () => {
                        return this.restoreSetting(settingId);
                    }
                });
            }
            else if (newSettingValue !== undefined) {
                const setting = this.getSetting(settingId);
                const trySettingMessage = setting ? this.getSettingMessage(setting, newSettingValue) : undefined;
                if (setting && trySettingMessage) {
                    actions.push({
                        class: undefined,
                        id: 'trySetting',
                        enabled: currentSettingValue !== newSettingValue,
                        tooltip: trySettingMessage,
                        label: trySettingMessage,
                        run: () => {
                            this.setSetting(settingId, currentSettingValue, newSettingValue);
                        }
                    });
                }
            }
            const viewInSettingsMessage = this.viewInSettingsMessage(settingId, actions.length > 0);
            actions.push({
                class: undefined,
                enabled: true,
                id: 'viewInSettings',
                tooltip: viewInSettingsMessage,
                label: viewInSettingsMessage,
                run: () => {
                    return this._preferencesService.openApplicationSettings({ query: `@id:${settingId}` });
                }
            });
            actions.push({
                class: undefined,
                enabled: true,
                id: 'copySettingId',
                tooltip: nls.localize('copySettingId', "Copy Setting ID"),
                label: nls.localize('copySettingId', "Copy Setting ID"),
                run: () => {
                    this._clipboardService.writeText(settingId);
                }
            });
            return actions;
        }
        showContextMenu(uri, x, y) {
            const actions = this.getActions(uri);
            if (!actions) {
                return;
            }
            this._contextMenuService.showContextMenu({
                getAnchor: () => ({ x, y }),
                getActions: () => actions,
                getActionViewItem: (action) => {
                    return new actionViewItems_1.ActionViewItem(action, action, { label: true });
                },
            });
        }
        async updateSetting(uri, x, y) {
            if (uri.scheme === network_1.Schemas.codeSetting) {
                this._telemetryService.publicLog2('releaseNotesSettingAction', {
                    settingId: uri.authority
                });
                return this.showContextMenu(uri, x, y);
            }
        }
    };
    exports.SimpleSettingRenderer = SimpleSettingRenderer;
    exports.SimpleSettingRenderer = SimpleSettingRenderer = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, preferences_1.IPreferencesService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, clipboardService_1.IClipboardService)
    ], SimpleSettingRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25TZXR0aW5nUmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tYXJrZG93bi9icm93c2VyL21hcmtkb3duU2V0dGluZ1JlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWVoRyxNQUFNLGdCQUFnQixHQUFHLGtEQUFrRCxDQUFDO0lBRXJFLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCO1FBTWpDLFlBQ3dCLHFCQUE2RCxFQUMvRCxtQkFBeUQsRUFDekQsbUJBQXlELEVBQzNELGlCQUFxRCxFQUNyRCxpQkFBcUQ7WUFKaEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM5Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ3hDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDMUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNwQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBVGpFLHFCQUFnQixHQUFHLElBQUksR0FBRyxFQUFlLENBQUMsQ0FBQyw4Q0FBOEM7WUFDekYseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQW9CLENBQUMsQ0FBQyx3QkFBd0I7WUFDNUUsc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQyxDQUFDLDhCQUE4QjtZQXNDMUUsbUJBQWMsR0FBaUMsU0FBUyxDQUFDO1lBN0JoRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxtQ0FBZSxDQUFDLEVBQUUsbUNBQTJCLENBQUM7UUFDM0UsQ0FBQztRQUVELElBQUkscUJBQXFCO1lBQ3hCLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDO1lBQzFDLEtBQUssTUFBTSxDQUFDLFNBQVMsRUFBRSxL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