/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, arrays_1, types_1, nls_1, configurationRegistry_1, extensionManagement_1, instantiation_1, jsonContributionRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PREVIEW_DIR_NAME = exports.USER_DATA_SYNC_SCHEME = exports.USER_DATA_SYNC_LOG_ID = exports.IUserDataSyncLogService = exports.IUserDataSyncUtilService = exports.IUserDataAutoSyncService = exports.IUserDataSyncResourceProviderService = exports.IUserDataSyncService = exports.IUserDataSyncEnablementService = exports.SYNC_SERVICE_URL_TYPE = exports.MergeState = exports.Change = exports.SyncStatus = exports.UserDataAutoSyncError = exports.UserDataSyncStoreError = exports.UserDataSyncError = exports.UserDataSyncErrorCode = exports.HEADER_EXECUTION_ID = exports.HEADER_OPERATION_ID = exports.IUserDataSyncLocalStoreService = exports.IUserDataSyncStoreService = exports.IUserDataSyncStoreManagementService = exports.ALL_SYNC_RESOURCES = exports.SyncResource = exports.CONFIG_SYNC_KEYBINDINGS_PER_PLATFORM = exports.USER_DATA_SYNC_CONFIGURATION_SCOPE = void 0;
    exports.getDisallowedIgnoredSettings = getDisallowedIgnoredSettings;
    exports.getDefaultIgnoredSettings = getDefaultIgnoredSettings;
    exports.registerConfiguration = registerConfiguration;
    exports.isAuthenticationProvider = isAuthenticationProvider;
    exports.getPathSegments = getPathSegments;
    exports.getLastSyncResourceUri = getLastSyncResourceUri;
    exports.createSyncHeaders = createSyncHeaders;
    exports.getEnablementKey = getEnablementKey;
    function getDisallowedIgnoredSettings() {
        const allSettings = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        return Object.keys(allSettings).filter(setting => !!allSettings[setting].disallowSyncIgnore);
    }
    function getDefaultIgnoredSettings() {
        const allSettings = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        const ignoreSyncSettings = Object.keys(allSettings).filter(setting => !!allSettings[setting].ignoreSync);
        const machineSettings = Object.keys(allSettings).filter(setting => allSettings[setting].scope === 2 /* ConfigurationScope.MACHINE */ || allSettings[setting].scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */);
        const disallowedSettings = getDisallowedIgnoredSettings();
        return (0, arrays_1.distinct)([...ignoreSyncSettings, ...machineSettings, ...disallowedSettings]);
    }
    exports.USER_DATA_SYNC_CONFIGURATION_SCOPE = 'settingsSync';
    exports.CONFIG_SYNC_KEYBINDINGS_PER_PLATFORM = 'settingsSync.keybindingsPerPlatform';
    function registerConfiguration() {
        const ignoredSettingsSchemaId = 'vscode://schemas/ignoredSettings';
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        configurationRegistry.registerConfiguration({
            id: 'settingsSync',
            order: 30,
            title: (0, nls_1.localize)('settings sync', "Settings Sync"),
            type: 'object',
            properties: {
                [exports.CONFIG_SYNC_KEYBINDINGS_PER_PLATFORM]: {
                    type: 'boolean',
                    description: (0, nls_1.localize)('settingsSync.keybindingsPerPlatform', "Synchronize keybindings for each platform."),
                    default: true,
                    scope: 1 /* ConfigurationScope.APPLICATION */,
                    tags: ['sync', 'usesOnlineServices']
                },
                'settingsSync.ignoredExtensions': {
                    'type': 'array',
                    markdownDescription: (0, nls_1.localize)('settingsSync.ignoredExtensions', "List of extensions to be ignored while synchronizing. The identifier of an extension is always `${publisher}.${name}`. For example: `vscode.csharp`."),
                    items: [{
                            type: 'string',
                            pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN,
                            errorMessage: (0, nls_1.localize)('app.extension.identifier.errorMessage', "Expected format '${publisher}.${name}'. Example: 'vscode.csharp'.")
                        }],
                    'default': [],
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    uniqueItems: true,
                    disallowSyncIgnore: true,
                    tags: ['sync', 'usesOnlineServices']
                },
                'settingsSync.ignoredSettings': {
                    'type': 'array',
                    description: (0, nls_1.localize)('settingsSync.ignoredSettings', "Configure settings to be ignored while synchronizing."),
                    'default': [],
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    $ref: ignoredSettingsSchemaId,
                    additionalProperties: true,
                    uniqueItems: true,
                    disallowSyncIgnore: true,
                    tags: ['sync', 'usesOnlineServices']
                }
            }
        });
        const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        const registerIgnoredSettingsSchema = () => {
            const disallowedIgnoredSettings = getDisallowedIgnoredSettings();
            const defaultIgnoredSettings = getDefaultIgnoredSettings();
            const settings = Object.keys(configurationRegistry_1.allSettings.properties).filter(setting => !defaultIgnoredSettings.includes(setting));
            const ignoredSettings = defaultIgnoredSettings.filter(setting => !disallowedIgnoredSettings.includes(setting));
            const ignoredSettingsSchema = {
                items: {
                    type: 'string',
                    enum: [...settings, ...ignoredSettings.map(setting => `-${setting}`)]
                },
            };
            jsonRegistry.registerSchema(ignoredSettingsSchemaId, ignoredSettingsSchema);
        };
        return configurationRegistry.onDidUpdateConfiguration(() => registerIgnoredSettingsSchema());
    }
    function isAuthenticationProvider(thing) {
        return thing
            && (0, types_1.isObject)(thing)
            && (0, types_1.isString)(thing.id)
            && Array.isArray(thing.scopes);
    }
    var SyncResource;
    (function (SyncResource) {
        SyncResource["Settings"] = "settings";
        SyncResource["Keybindings"] = "keybindings";
        SyncResource["Snippets"] = "snippets";
        SyncResource["Tasks"] = "tasks";
        SyncResource["Extensions"] = "extensions";
        SyncResource["GlobalState"] = "globalState";
        SyncResource["Profiles"] = "profiles";
        SyncResource["WorkspaceState"] = "workspaceState";
    })(SyncResource || (exports.SyncResource = SyncResource = {}));
    exports.ALL_SYNC_RESOURCES = ["settings" /* SyncResource.Settings */, "keybindings" /* SyncResource.Keybindings */, "snippets" /* SyncResource.Snippets */, "tasks" /* SyncResource.Tasks */, "extensions" /* SyncResource.Extensions */, "globalState" /* SyncResource.GlobalState */, "profiles" /* SyncResource.Profiles */];
    function getPathSegments(collection, ...paths) {
        return collection ? [collection, ...paths] : paths;
    }
    function getLastSyncResourceUri(collection, syncResource, environmentService, extUri) {
        return extUri.joinPath(environmentService.userDataSyncHome, ...getPathSegments(collection, syncResource, `lastSync${syncResource}.json`));
    }
    exports.IUserDataSyncStoreManagementService = (0, instantiation_1.createDecorator)('IUserDataSyncStoreManagementService');
    exports.IUserDataSyncStoreService = (0, instantiation_1.createDecorator)('IUserDataSyncStoreService');
    exports.IUserDataSyncLocalStoreService = (0, instantiation_1.createDecorator)('IUserDataSyncLocalStoreService');
    //#endregion
    // #region User Data Sync Headers
    exports.HEADER_OPERATION_ID = 'x-operation-id';
    exports.HEADER_EXECUTION_ID = 'X-Execution-Id';
    function createSyncHeaders(executionId) {
        const headers = {};
        headers[exports.HEADER_EXECUTION_ID] = executionId;
        return headers;
    }
    //#endregion
    // #region User Data Sync Error
    var UserDataSyncErrorCode;
    (function (UserDataSyncErrorCode) {
        // Client Errors (>= 400 )
        UserDataSyncErrorCode["Unauthorized"] = "Unauthorized";
        UserDataSyncErrorCode["Forbidden"] = "Forbidden";
        UserDataSyncErrorCode["NotFound"] = "NotFound";
        UserDataSyncErrorCode["MethodNotFound"] = "MethodNotFound";
        UserDataSyncErrorCode["Conflict"] = "Conflict";
        UserDataSyncErrorCode["Gone"] = "Gone";
        UserDataSyncErrorCode["PreconditionFailed"] = "PreconditionFailed";
        UserDataSyncErrorCode["TooLarge"] = "TooLarge";
        UserDataSyncErrorCode["UpgradeRequired"] = "UpgradeRequired";
        UserDataSyncErrorCode["PreconditionRequired"] = "PreconditionRequired";
        UserDataSyncErrorCode["TooManyRequests"] = "RemoteTooManyRequests";
        UserDataSyncErrorCode["TooManyRequestsAndRetryAfter"] = "TooManyRequestsAndRetryAfter";
        // Local Errors
        UserDataSyncErrorCode["RequestFailed"] = "RequestFailed";
        UserDataSyncErrorCode["RequestCanceled"] = "RequestCanceled";
        UserDataSyncErrorCode["RequestTimeout"] = "RequestTimeout";
        UserDataSyncErrorCode["RequestProtocolNotSupported"] = "RequestProtocolNotSupported";
        UserDataSyncErrorCode["RequestPathNotEscaped"] = "RequestPathNotEscaped";
        UserDataSyncErrorCode["RequestHeadersNotObject"] = "RequestHeadersNotObject";
        UserDataSyncErrorCode["NoCollection"] = "NoCollection";
        UserDataSyncErrorCode["NoRef"] = "NoRef";
        UserDataSyncErrorCode["EmptyResponse"] = "EmptyResponse";
        UserDataSyncErrorCode["TurnedOff"] = "TurnedOff";
        UserDataSyncErrorCode["SessionExpired"] = "SessionExpired";
        UserDataSyncErrorCode["ServiceChanged"] = "ServiceChanged";
        UserDataSyncErrorCode["DefaultServiceChanged"] = "DefaultServiceChanged";
        UserDataSyncErrorCode["LocalTooManyProfiles"] = "LocalTooManyProfiles";
        UserDataSyncErrorCode["LocalTooManyRequests"] = "LocalTooManyRequests";
        UserDataSyncErrorCode["LocalPreconditionFailed"] = "LocalPreconditionFailed";
        UserDataSyncErrorCode["LocalInvalidContent"] = "LocalInvalidContent";
        UserDataSyncErrorCode["LocalError"] = "LocalError";
        UserDataSyncErrorCode["IncompatibleLocalContent"] = "IncompatibleLocalContent";
        UserDataSyncErrorCode["IncompatibleRemoteContent"] = "IncompatibleRemoteContent";
        UserDataSyncErrorCode["Unknown"] = "Unknown";
    })(UserDataSyncErrorCode || (exports.UserDataSyncErrorCode = UserDataSyncErrorCode = {}));
    class UserDataSyncError extends Error {
        constructor(message, code, resource, operationId) {
            super(message);
            this.code = code;
            this.resource = resource;
            this.operationId = operationId;
            this.name = `${this.code} (UserDataSyncError) syncResource:${this.resource || 'unknown'} operationId:${this.operationId || 'unknown'}`;
        }
    }
    exports.UserDataSyncError = UserDataSyncError;
    class UserDataSyncStoreError extends UserDataSyncError {
        constructor(message, url, code, serverCode, operationId) {
            super(message, code, undefined, operationId);
            this.url = url;
            this.serverCode = serverCode;
        }
    }
    exports.UserDataSyncStoreError = UserDataSyncStoreError;
    class UserDataAutoSyncError extends UserDataSyncError {
        constructor(message, code) {
            super(message, code);
        }
    }
    exports.UserDataAutoSyncError = UserDataAutoSyncError;
    (function (UserDataSyncError) {
        function toUserDataSyncError(error) {
            if (error instanceof UserDataSyncError) {
                return error;
            }
            const match = /^(.+) \(UserDataSyncError\) syncResource:(.+) operationId:(.+)$/.exec(error.name);
            if (match && match[1]) {
                const syncResource = match[2] === 'unknown' ? undefined : match[2];
                const operationId = match[3] === 'unknown' ? undefined : match[3];
                return new UserDataSyncError(error.message, match[1], syncResource, operationId);
            }
            return new UserDataSyncError(error.message, "Unknown" /* UserDataSyncErrorCode.Unknown */);
        }
        UserDataSyncError.toUserDataSyncError = toUserDataSyncError;
    })(UserDataSyncError || (exports.UserDataSyncError = UserDataSyncError = {}));
    var SyncStatus;
    (function (SyncStatus) {
        SyncStatus["Uninitialized"] = "uninitialized";
        SyncStatus["Idle"] = "idle";
        SyncStatus["Syncing"] = "syncing";
        SyncStatus["HasConflicts"] = "hasConflicts";
    })(SyncStatus || (exports.SyncStatus = SyncStatus = {}));
    var Change;
    (function (Change) {
        Change[Change["None"] = 0] = "None";
        Change[Change["Added"] = 1] = "Added";
        Change[Change["Modified"] = 2] = "Modified";
        Change[Change["Deleted"] = 3] = "Deleted";
    })(Change || (exports.Change = Change = {}));
    var MergeState;
    (function (MergeState) {
        MergeState["Preview"] = "preview";
        MergeState["Conflict"] = "conflict";
        MergeState["Accepted"] = "accepted";
    })(MergeState || (exports.MergeState = MergeState = {}));
    //#endregion
    // #region keys synced only in web
    exports.SYNC_SERVICE_URL_TYPE = 'sync.store.url.type';
    function getEnablementKey(resource) { return `sync.enable.${resource}`; }
    // #endregion
    // #region User Data Sync Services
    exports.IUserDataSyncEnablementService = (0, instantiation_1.createDecorator)('IUserDataSyncEnablementService');
    exports.IUserDataSyncService = (0, instantiation_1.createDecorator)('IUserDataSyncService');
    exports.IUserDataSyncResourceProviderService = (0, instantiation_1.createDecorator)('IUserDataSyncResourceProviderService');
    exports.IUserDataAutoSyncService = (0, instantiation_1.createDecorator)('IUserDataAutoSyncService');
    exports.IUserDataSyncUtilService = (0, instantiation_1.createDecorator)('IUserDataSyncUtilService');
    exports.IUserDataSyncLogService = (0, instantiation_1.createDecorator)('IUserDataSyncLogService');
    //#endregion
    exports.USER_DATA_SYNC_LOG_ID = 'userDataSync';
    exports.USER_DATA_SYNC_SCHEME = 'vscode-userdata-sync';
    exports.PREVIEW_DIR_NAME = 'preview';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi91c2VyRGF0YVN5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0JoRyxvRUFHQztJQUVELDhEQU1DO0lBWUQsc0RBMERDO0lBcUJELDREQUtDO0lBY0QsMENBRUM7SUFFRCx3REFFQztJQXdGRCw4Q0FJQztJQXdQRCw0Q0FBOEY7SUFuZDlGLFNBQWdCLDRCQUE0QjtRQUMzQyxNQUFNLFdBQVcsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUM1SCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFRCxTQUFnQix5QkFBeUI7UUFDeEMsTUFBTSxXQUFXLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDLDBCQUEwQixFQUFFLENBQUM7UUFDNUgsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDekcsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FB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