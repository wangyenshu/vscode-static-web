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
define(["require", "exports", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation"], function (require, exports, arrays_1, configuration_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IgnoredExtensionsManagementService = exports.IIgnoredExtensionsManagementService = void 0;
    exports.IIgnoredExtensionsManagementService = (0, instantiation_1.createDecorator)('IIgnoredExtensionsManagementService');
    let IgnoredExtensionsManagementService = class IgnoredExtensionsManagementService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        hasToNeverSyncExtension(extensionId) {
            const configuredIgnoredExtensions = this.getConfiguredIgnoredExtensions();
            return configuredIgnoredExtensions.includes(extensionId.toLowerCase());
        }
        hasToAlwaysSyncExtension(extensionId) {
            const configuredIgnoredExtensions = this.getConfiguredIgnoredExtensions();
            return configuredIgnoredExtensions.includes(`-${extensionId.toLowerCase()}`);
        }
        updateIgnoredExtensions(ignoredExtensionId, ignore) {
            // first remove the extension completely from ignored extensions
            let currentValue = [...this.configurationService.getValue('settingsSync.ignoredExtensions')].map(id => id.toLowerCase());
            currentValue = currentValue.filter(v => v !== ignoredExtensionId && v !== `-${ignoredExtensionId}`);
            // Add only if ignored
            if (ignore) {
                currentValue.push(ignoredExtensionId.toLowerCase());
            }
            return this.configurationService.updateValue('settingsSync.ignoredExtensions', currentValue.length ? currentValue : undefined, 2 /* ConfigurationTarget.USER */);
        }
        updateSynchronizedExtensions(extensionId, sync) {
            // first remove the extension completely from ignored extensions
            let currentValue = [...this.configurationService.getValue('settingsSync.ignoredExtensions')].map(id => id.toLowerCase());
            currentValue = currentValue.filter(v => v !== extensionId && v !== `-${extensionId}`);
            // Add only if synced
            if (sync) {
                currentValue.push(`-${extensionId.toLowerCase()}`);
            }
            return this.configurationService.updateValue('settingsSync.ignoredExtensions', currentValue.length ? currentValue : undefined, 2 /* ConfigurationTarget.USER */);
        }
        getIgnoredExtensions(installed) {
            const defaultIgnoredExtensions = installed.filter(i => i.isMachineScoped).map(i => i.identifier.id.toLowerCase());
            const value = this.getConfiguredIgnoredExtensions().map(id => id.toLowerCase());
            const added = [], removed = [];
            if (Array.isArray(value)) {
                for (const key of value) {
                    if (key.startsWith('-')) {
                        removed.push(key.substring(1));
                    }
                    else {
                        added.push(key);
                    }
                }
            }
            return (0, arrays_1.distinct)([...defaultIgnoredExtensions, ...added,].filter(setting => !removed.includes(setting)));
        }
        getConfiguredIgnoredExtensions() {
            let userValue = this.configurationService.inspect('settingsSync.ignoredExtensions').userValue;
            if (userValue !== undefined) {
                return userValue;
            }
            userValue = this.configurationService.inspect('sync.ignoredExtensions').userValue;
            if (userValue !== undefined) {
                return userValue;
            }
            return (this.configurationService.getValue('settingsSync.ignoredExtensions') || []).map(id => id.toLowerCase());
        }
    };
    exports.IgnoredExtensionsManagementService = IgnoredExtensionsManagementService;
    exports.IgnoredExtensionsManagementService = IgnoredExtensionsManagementService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], IgnoredExtensionsManagementService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWdub3JlZEV4dGVuc2lvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL2lnbm9yZWRFeHRlbnNpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU9uRixRQUFBLG1DQUFtQyxHQUFHLElBQUEsK0JBQWUsRUFBc0MscUNBQXFDLENBQUMsQ0FBQztJQVl4SSxJQUFNLGtDQUFrQyxHQUF4QyxNQUFNLGtDQUFrQztRQUk5QyxZQUN5QyxvQkFBMkM7WUFBM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtRQUVwRixDQUFDO1FBRUQsdUJBQXVCLENBQUMsV0FBbUI7WUFDMUMsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztZQUMxRSxPQUFPLDJCQUEyQixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRUQsd0JBQXdCLENBQUMsV0FBbUI7WUFDM0MsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztZQUMxRSxPQUFPLDJCQUEyQixDQUFDLFFBQVEsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVELHVCQUF1QixDQUFDLGtCQUEwQixFQUFFLE1BQWU7WUFDbEUsZ0VBQWdFO1lBQ2hFLElBQUksWUFBWSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFXLGdDQUFnQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUNuSSxZQUFZLEdB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