/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation"], function (require, exports, types, uri_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationTarget = exports.IConfigurationService = void 0;
    exports.isConfigurationOverrides = isConfigurationOverrides;
    exports.isConfigurationUpdateOverrides = isConfigurationUpdateOverrides;
    exports.ConfigurationTargetToString = ConfigurationTargetToString;
    exports.isConfigured = isConfigured;
    exports.toValuesTree = toValuesTree;
    exports.addToValueTree = addToValueTree;
    exports.removeFromValueTree = removeFromValueTree;
    exports.getConfigurationValue = getConfigurationValue;
    exports.merge = merge;
    exports.getLanguageTagSettingPlainKey = getLanguageTagSettingPlainKey;
    exports.IConfigurationService = (0, instantiation_1.createDecorator)('configurationService');
    function isConfigurationOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifier || typeof thing.overrideIdentifier === 'string')
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    function isConfigurationUpdateOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifiers || Array.isArray(thing.overrideIdentifiers))
            && !thing.overrideIdentifier
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    var ConfigurationTarget;
    (function (ConfigurationTarget) {
        ConfigurationTarget[ConfigurationTarget["APPLICATION"] = 1] = "APPLICATION";
        ConfigurationTarget[ConfigurationTarget["USER"] = 2] = "USER";
        ConfigurationTarget[ConfigurationTarget["USER_LOCAL"] = 3] = "USER_LOCAL";
        ConfigurationTarget[ConfigurationTarget["USER_REMOTE"] = 4] = "USER_REMOTE";
        ConfigurationTarget[ConfigurationTarget["WORKSPACE"] = 5] = "WORKSPACE";
        ConfigurationTarget[ConfigurationTarget["WORKSPACE_FOLDER"] = 6] = "WORKSPACE_FOLDER";
        ConfigurationTarget[ConfigurationTarget["DEFAULT"] = 7] = "DEFAULT";
        ConfigurationTarget[ConfigurationTarget["MEMORY"] = 8] = "MEMORY";
    })(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
    function ConfigurationTargetToString(configurationTarget) {
        switch (configurationTarget) {
            case 1 /* ConfigurationTarget.APPLICATION */: return 'APPLICATION';
            case 2 /* ConfigurationTarget.USER */: return 'USER';
            case 3 /* ConfigurationTarget.USER_LOCAL */: return 'USER_LOCAL';
            case 4 /* ConfigurationTarget.USER_REMOTE */: return 'USER_REMOTE';
            case 5 /* ConfigurationTarget.WORKSPACE */: return 'WORKSPACE';
            case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */: return 'WORKSPACE_FOLDER';
            case 7 /* ConfigurationTarget.DEFAULT */: return 'DEFAULT';
            case 8 /* ConfigurationTarget.MEMORY */: return 'MEMORY';
        }
    }
    function isConfigured(configValue) {
        return configValue.applicationValue !== undefined ||
            configValue.userValue !== undefined ||
            configValue.userLocalValue !== undefined ||
            configValue.userRemoteValue !== undefined ||
            configValue.workspaceValue !== undefined ||
            configValue.workspaceFolderValue !== undefined;
    }
    function toValuesTree(properties, conflictReporter) {
        const root = Object.create(null);
        for (const key in properties) {
            addToValueTree(root, key, properties[key], conflictReporter);
        }
        return root;
    }
    function addToValueTree(settingsTreeRoot, key, value, conflictReporter) {
        const segments = key.split('.');
        const last = segments.pop();
        let curr = settingsTreeRoot;
        for (let i = 0; i < segments.length; i++) {
            const s = segments[i];
            let obj = curr[s];
            switch (typeof obj) {
                case 'undefined':
                    obj = curr[s] = Object.create(null);
                    break;
                case 'object':
                    if (obj === null) {
                        conflictReporter(`Ignoring ${key} as ${segments.slice(0, i + 1).join('.')} is null`);
                        return;
                    }
                    break;
                default:
                    conflictReporter(`Ignoring ${key} as ${segments.slice(0, i + 1).join('.')} is ${JSON.stringify(obj)}`);
                    return;
            }
            curr = obj;
        }
        if (typeof curr === 'object' && curr !== null) {
            try {
                curr[last] = value; // workaround https://github.com/microsoft/vscode/issues/13606
            }
            catch (e) {
                conflictReporter(`Ignoring ${key} as ${segments.join('.')} is ${JSON.stringify(curr)}`);
            }
        }
        else {
            conflictReporter(`Ignoring ${key} as ${segments.join('.')} is ${JSON.stringify(curr)}`);
        }
    }
    function removeFromValueTree(valueTree, key) {
        const segments = key.split('.');
        doRemoveFromValueTree(valueTree, segments);
    }
    function doRemoveFromValueTree(valueTree, segments) {
        const first = segments.shift();
        if (segments.length === 0) {
            // Reached last segment
            delete valueTree[first];
            return;
        }
        if (Object.keys(valueTree).indexOf(first) !== -1) {
            const value = valueTree[first];
            if (typeof value === 'object' && !Array.isArray(value)) {
                doRemoveFromValueTree(value, segments);
                if (Object.keys(value).length === 0) {
                    delete valueTree[first];
                }
            }
        }
    }
    /**
     * A helper function to get the configuration value with a specific settings path (e.g. config.some.setting)
     */
    function getConfigurationValue(config, settingPath, defaultValue) {
        function accessSetting(config, path) {
            let current = config;
            for (const component of path) {
                if (typeof current !== 'object' || current === null) {
                    return undefined;
                }
                current = current[component];
            }
            return current;
        }
        const path = settingPath.split('.');
        const result = accessSetting(config, path);
        return typeof result === 'undefined' ? defaultValue : result;
    }
    function merge(base, add, overwrite) {
        Object.keys(add).forEach(key => {
            if (key !== '__proto__') {
                if (key in base) {
                    if (types.isObject(base[key]) && types.isObject(add[key])) {
                        merge(base[key], add[key], overwrite);
                    }
                    else if (overwrite) {
                        base[key] = add[key];
                    }
                }
                else {
                    base[key] = add[key];
                }
            }
        });
    }
    function getLanguageTagSettingPlainKey(settingKey) {
        return settingKey.replace(/[\[\]]/g, '');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2NvbmZpZ3VyYXRpb24vY29tbW9uL2NvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLDREQUtDO0lBT0Qsd0VBTUM7SUFjRCxrRUFXQztJQWdERCxvQ0FPQztJQWlHRCxvQ0FRQztJQUVELHdDQWtDQztJQUVELGtEQUdDO0lBd0JELHNEQWdCQztJQUVELHNCQWNDO0lBRUQsc0VBRUM7SUFsVFksUUFBQSxxQkFBcUIsR0FBRyxJQUFBLCtCQUFlLEVBQXdCLHNCQUFzQixDQUFDLENBQUM7SUFFcEcsU0FBZ0Isd0JBQXdCLENBQUMsS0FBVTtRQUNsRCxPQUFPLEtBQUs7ZUFDUixPQUFPLEtBQUssS0FBSyxRQUFRO2VBQ3pCLENBQUMsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLElBQUksT0FBTyxLQUFLLENBQUMsa0JBQWtCLEtBQUssUUFBUSxDQUFDO2VBQzNFLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLFlBQVksU0FBRyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQU9ELFNBQWdCLDhCQUE4QixDQUFDLEtBQVU7UUFDeEQsT0FBTyxLQUFLO2VBQ1IsT0FBTyxLQUFLLEtBQUssUUFBUTtlQUN6QixDQUFDLENBQUMsS0FBSyxDQUFDLG1CQUFtQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7ZUFDeEUsQ0FBQyxLQUFLLENBQUMsa0JBQWtCO2VBQ3pCLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLFlBQVksU0FBRyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUlELElBQWtCLG1CQVNq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