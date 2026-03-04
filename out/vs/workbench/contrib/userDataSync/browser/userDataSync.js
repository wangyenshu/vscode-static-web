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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/common/editor", "vs/workbench/services/output/common/output", "vs/workbench/services/activity/common/activity", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferences", "vs/base/common/date", "vs/platform/product/common/productService", "vs/platform/opener/common/opener", "vs/workbench/services/authentication/common/authentication", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/workbench/common/views", "vs/workbench/contrib/userDataSync/browser/userDataSyncViews", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/codicons", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/host/browser/host", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "vs/workbench/services/issue/common/issue", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/platform"], function (require, exports, actions_1, errors_1, event_1, lifecycle_1, resources_1, uri_1, model_1, language_1, resolverService_1, nls_1, actions_2, commands_1, contextkey_1, dialogs_1, instantiation_1, notification_1, quickInput_1, telemetry_1, userDataSync_1, editor_1, output_1, activity_1, editorService_1, preferences_1, date_1, productService_1, opener_1, authentication_1, platform_1, descriptors_1, views_1, userDataSyncViews_1, userDataSync_2, codicons_1, viewPaneContainer_1, actionCommonCategories_1, host_1, userDataProfile_1, textfiles_1, mergeEditor_1, issue_1, userDataProfile_2, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncWorkbenchContribution = void 0;
    const turnOffSyncCommand = { id: 'workbench.userDataSync.actions.turnOff', title: (0, nls_1.localize2)('stop sync', 'Turn Off') };
    const configureSyncCommand = { id: userDataSync_2.CONFIGURE_SYNC_COMMAND_ID, title: (0, nls_1.localize2)('configure sync', 'Configure...') };
    const showConflictsCommandId = 'workbench.userDataSync.actions.showConflicts';
    const syncNowCommand = {
        id: 'workbench.userDataSync.actions.syncNow',
        title: (0, nls_1.localize2)('sync now', 'Sync Now'),
        description(userDataSyncService) {
            if (userDataSyncService.status === "syncing" /* SyncStatus.Syncing */) {
                return (0, nls_1.localize)('syncing', "syncing");
            }
            if (userDataSyncService.lastSyncTime) {
                return (0, nls_1.localize)('synced with time', "synced {0}", (0, date_1.fromNow)(userDataSyncService.lastSyncTime, true));
            }
            return undefined;
        }
    };
    const showSyncSettingsCommand = { id: 'workbench.userDataSync.actions.settings', title: (0, nls_1.localize2)('sync settings', 'Show Settings'), };
    const showSyncedDataCommand = { id: 'workbench.userDataSync.actions.showSyncedData', title: (0, nls_1.localize2)('show synced data', 'Show Synced Data'), };
    const CONTEXT_TURNING_ON_STATE = new contextkey_1.RawContextKey('userDataSyncTurningOn', false);
    let UserDataSyncWorkbenchContribution = class UserDataSyncWorkbenchContribution extends lifecycle_1.Disposable {
        constructor(userDataSyncEnablementService, userDataSyncService, userDataSyncWorkbenchService, contextKeyService, activityService, notificationService, editorService, userDataProfilesService, userDataProfileService, dialogService, quickInputService, instantiationService, outputService, userDataAutoSyncService, textModelResolverService, preferencesService, telemetryService, productService, openerService, authenticationService, userDataSyncStoreManagementService, hostService, commandService, workbenchIssueService) {
            super();
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.activityService = activityService;
            this.notificationService = notificationService;
            this.editorService = editorService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileService = userDataProfileService;
            this.dialogService = dialogService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.outputService = outputService;
            this.preferencesService = preferencesService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.openerService = openerService;
            this.authenticationService = authenticationService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.hostService = hostService;
            this.commandService = commandService;
            this.workbenchIssueService = workbenchIssueService;
            this.globalActivityBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.accountBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.conflictsDisposables = new Map();
            this.invalidContentErrorDisposables = new Map();
            this.conflictsActionDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.turningOnSyncContext = CONTEXT_TURNING_ON_STATE.bindTo(contextKeyService);
            if (userDataSyncWorkbenchService.enabled) {
                (0, userDataSync_1.registerConfiguration)();
                this.updateAccountBadge();
                this.updateGlobalActivityBadge();
                this.onDidChangeConflicts(this.userDataSyncService.conflicts);
                this._register(event_1.Event.any(event_1.Event.debounce(userDataSyncService.onDidChangeStatus, () => undefined, 500), this.userDataSyncEnablementService.onDidChangeEnablement, this.userDataSyncWorkbenchService.onDidChangeAccountStatus)(() => {
                    this.updateAccountBadge();
                    this.updateGlobalActivityBadge();
                }));
                this._register(userDataSyncService.onDidChangeConflicts(() => this.onDidChangeConflicts(this.userDataSyncService.conflicts)));
                this._register(userDataSyncEnablementService.onDidChangeEnablement(() => this.onDidChangeConflicts(this.userDataSyncService.conflicts)));
                this._register(userDataSyncService.onSyncErrors(errors => this.onSynchronizerErrors(errors)));
                this._register(userDataAutoSyncService.onError(error => this.onAutoSyncError(error)));
                this.registerActions();
                this.registerViews();
                textModelResolverService.registerTextModelContentProvider(userDataSync_1.USER_DATA_SYNC_SCHEME, instantiationService.createInstance(UserDataRemoteContentProvider));
                this._register(event_1.Event.any(userDataSyncService.onDidChangeStatus, userDataSyncEnablementService.onDidChangeEnablement)(() => this.turningOnSync = !userDataSyncEnablementService.isEnabled() && userDataSyncService.status !== "idle" /* SyncStatus.Idle */));
            }
        }
        get turningOnSync() {
            return !!this.turningOnSyncContext.get();
        }
        set turningOnSync(turningOn) {
            this.turningOnSyncContext.set(turningOn);
            this.updateGlobalActivityBadge();
        }
        toKey({ syncResource: resource, profile }) {
            return `${profile.id}:${resource}`;
        }
        onDidChangeConflicts(conflicts) {
            this.updateGlobalActivityBadge();
            this.registerShowConflictsAction();
            if (!this.userDataSyncEnablementService.isEnabled()) {
                return;
            }
            if (conflicts.length) {
                // Clear and dispose conflicts those were cleared
                for (const [key, disposable] of this.conflictsDisposables.entries()) {
                    if (!conflicts.some(conflict => this.toKey(conflict) === key)) {
                        disposable.dispose();
                        this.conflictsDisposables.delete(key);
                    }
                }
                for (const conflict of this.userDataSyncService.conflicts) {
                    const key = this.toKey(conflict);
                    // Show conflicts notification if not shown before
                    if (!this.conflictsDisposables.has(key)) {
                        const conflictsArea = (0, userDataSync_2.getSyncAreaLabel)(conflict.syncResource);
                        const handle = this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('conflicts detected', "Unable to sync due to conflicts in {0}. Please resolve them to continue.", conflictsArea.toLowerCase()), [
                            {
                                label: (0, nls_1.localize)('replace remote', "Replace Remote"),
                                run: () => {
                                    this.telemetryService.publicLog2('sync/handleConflicts', { source: conflict.syncResource, action: 'acceptLocal' });
                                    this.acceptLocal(conflict, conflict.conflicts[0]);
                                }
                            },
                            {
                                label: (0, nls_1.localize)('replace local', "Replace Local"),
                                run: () => {
                                    this.telemetryService.publicLog2('sync/handleConflicts', { source: conflict.syncResource, action: 'acceptRemote' });
                                    this.acceptRemote(conflict, conflict.conflicts[0]);
                                }
                            },
                            {
                                label: (0, nls_1.localize)('show conflicts', "Show Conflicts"),
                                run: () => {
                                    this.telemetryService.publicLog2('sync/showConflicts', { source: conflict.syncResource });
                                    this.userDataSyncWorkbenchService.showConflicts(conflict.conflicts[0]);
                                }
                            }
                        ], {
                            sticky: true
                        });
                        this.conflictsDisposables.set(key, (0, lifecycle_1.toDisposable)(() => {
                            // close the conflicts warning notification
                            handle.close();
                            this.conflictsDisposables.delete(key);
                        }));
                    }
                }
            }
            else {
                this.conflictsDisposables.forEach(disposable => disposable.dispose());
                this.conflictsDisposables.clear();
            }
        }
        async acceptRemote(syncResource, conflict) {
            try {
                await this.userDataSyncService.accept(syncResource, conflict.remoteResource, undefined, this.userDataSyncEnablementService.isEnabled());
            }
            catch (e) {
                this.notificationService.error((0, nls_1.localize)('accept failed', "Error while accepting changes. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
            }
        }
        async acceptLocal(syncResource, conflict) {
            try {
                await this.userDataSyncService.accept(syncResource, conflict.localResource, undefined, this.userDataSyncEnablementService.isEnabled());
            }
            catch (e) {
                this.notificationService.error((0, nls_1.localize)('accept failed', "Error while accepting changes. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
            }
        }
        onAutoSyncError(error) {
            switch (error.code) {
                case "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('session expired', "Settings sync was turned off because current session is expired, please sign in again to turn on sync."),
                        actions: {
                            primary: [new actions_1.Action('turn on sync', (0, nls_1.localize)('turn on sync', "Turn on Settings Sync..."), undefined, true, () => this.turnOn())]
                        }
                    });
                    break;
                case "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('turned off', "Settings sync was turned off from another device, please turn on sync again."),
                        actions: {
                            primary: [new actions_1.Action('turn on sync', (0, nls_1.localize)('turn on sync', "Turn on Settings Sync..."), undefined, true, () => this.turnOn())]
                        }
                    });
                    break;
                case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                    if (error.resource === "keybindings" /* SyncResource.Keybindings */ || error.resource === "settings" /* SyncResource.Settings */ || error.resource === "tasks" /* SyncResource.Tasks */) {
                        this.disableSync(error.resource);
                        const sourceArea = (0, userDataSync_2.getSyncAreaLabel)(error.resource);
                        this.handleTooLargeError(error.resource, (0, nls_1.localize)('too large', "Disabled syncing {0} because size of the {1} file to sync is larger than {2}. Please open the file and reduce the size and enable sync", sourceArea.toLowerCase(), sourceArea.toLowerCase(), '100kb'), error);
                    }
                    break;
                case "LocalTooManyProfiles" /* UserDataSyncErrorCode.LocalTooManyProfiles */:
                    this.disableSync("profiles" /* SyncResource.Profiles */);
                    this.notificationService.error((0, nls_1.localize)('too many profiles', "Disabled syncing profiles because there are too many profiles to sync. Settings Sync supports syncing maximum 20 profiles. Please reduce the number of profiles and enable sync"));
                    break;
                case "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */:
                case "Gone" /* UserDataSyncErrorCode.Gone */:
                case "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */: {
                    const message = (0, nls_1.localize)('error upgrade required', "Settings sync is disabled because the current version ({0}, {1}) is not compatible with the sync service. Please update before turning on sync.", this.productService.version, this.productService.commit);
                    const operationId = error.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", error.operationId) : undefined;
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: operationId ? `${message} ${operationId}` : message,
                    });
                    break;
                }
                case "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */: {
                    const message = (0, nls_1.localize)('method not found', "Settings sync is disabled because the client is making invalid requests. Please report an issue with the logs.");
                    const operationId = error.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", error.operationId) : undefined;
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: operationId ? `${message} ${operationId}` : message,
                        actions: {
                            primary: [
                                new actions_1.Action('Show Sync Logs', (0, nls_1.localize)('show sync logs', "Show Log"), undefined, true, () => this.commandService.executeCommand(userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID)),
                                new actions_1.Action('Report Issue', (0, nls_1.localize)('report issue', "Report Issue"), undefined, true, () => this.workbenchIssueService.openReporter())
                            ]
                        }
                    });
                    break;
                }
                case "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: (0, nls_1.localize)('error reset required', "Settings sync is disabled because your data in the cloud is older than that of the client. Please clear your data in the cloud before turning on sync."),
                        actions: {
                            primary: [
                                new actions_1.Action('reset', (0, nls_1.localize)('reset', "Clear Data in Cloud..."), undefined, true, () => this.userDataSyncWorkbenchService.resetSyncedData()),
                                new actions_1.Action('show synced data', (0, nls_1.localize)('show synced data action', "Show Synced Data"), undefined, true, () => this.userDataSyncWorkbenchService.showSyncActivity())
                            ]
                        }
                    });
                    return;
                case "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: this.userDataSyncStoreManagementService.userDataSyncStore?.type === 'insiders' ?
                            (0, nls_1.localize)('service switched to insiders', "Settings Sync has been switched to insiders service") :
                            (0, nls_1.localize)('service switched to stable', "Settings Sync has been switched to stable service"),
                    });
                    return;
                case "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */:
                    // Settings sync is using separate service
                    if (this.userDataSyncEnablementService.isEnabled()) {
                        this.notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)('using separate service', "Settings sync now uses a separate service, more information is available in the [Settings Sync Documentation](https://aka.ms/vscode-settings-sync-help#_syncing-stable-versus-insiders)."),
                        });
                    }
                    // If settings sync got turned off then ask user to turn on sync again.
                    else {
                        this.notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)('service changed and turned off', "Settings sync was turned off because {0} now uses a separate service. Please turn on sync again.", this.productService.nameLong),
                            actions: {
                                primary: [new actions_1.Action('turn on sync', (0, nls_1.localize)('turn on sync', "Turn on Settings Sync..."), undefined, true, () => this.turnOn())]
                            }
                        });
                    }
                    return;
            }
        }
        handleTooLargeError(resource, message, error) {
            const operationId = error.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", error.operationId) : undefined;
            this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: operationId ? `${message} ${operationId}` : message,
                actions: {
                    primary: [new actions_1.Action('open sync file', (0, nls_1.localize)('open file', "Open {0} File", (0, userDataSync_2.getSyncAreaLabel)(resource)), undefined, true, () => resource === "settings" /* SyncResource.Settings */ ? this.preferencesService.openUserSettings({ jsonEditor: true }) : this.preferencesService.openGlobalKeybindingSettings(true))]
                }
            });
        }
        onSynchronizerErrors(errors) {
            if (errors.length) {
                for (const { profile, syncResource: resource, error } of errors) {
                    switch (error.code) {
                        case "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */:
                            this.handleInvalidContentError({ profile, syncResource: resource });
                            break;
                        default: {
                            const key = `${profile.id}:${resource}`;
                            const disposable = this.invalidContentErrorDisposables.get(key);
                            if (disposable) {
                                disposable.dispose();
                                this.invalidContentErrorDisposables.delete(key);
                            }
                        }
                    }
                }
            }
            else {
                this.invalidContentErrorDisposables.forEach(disposable => disposable.dispose());
                this.invalidContentErrorDisposables.clear();
            }
        }
        handleInvalidContentError({ profile, syncResource: source }) {
            if (this.userDataProfileService.currentProfile.id !== profile.id) {
                return;
            }
            const key = `${profile.id}:${source}`;
            if (this.invalidContentErrorDisposables.has(key)) {
                return;
            }
            if (source !== "settings" /* SyncResource.Settings */ && source !== "keybindings" /* SyncResource.Keybindings */ && source !== "tasks" /* SyncResource.Tasks */) {
                return;
            }
            if (!this.hostService.hasFocus) {
                return;
            }
            const resource = source === "settings" /* SyncResource.Settings */ ? this.userDataProfileService.currentProfile.settingsResource
                : source === "keybindings" /* SyncResource.Keybindings */ ? this.userDataProfileService.currentProfile.keybindingsResource
                    : this.userDataProfileService.currentProfile.tasksResource;
            const editorUri = editor_1.EditorResourceAccessor.getCanonicalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if ((0, resources_1.isEqual)(resource, editorUri)) {
                // Do not show notification if the file in error is active
                return;
            }
            const errorArea = (0, userDataSync_2.getSyncAreaLabel)(source);
            const handle = this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: (0, nls_1.localize)('errorInvalidConfiguration', "Unable to sync {0} because the content in the file is not valid. Please open the file and correct it.", errorArea.toLowerCase()),
                actions: {
                    primary: [new actions_1.Action('open sync file', (0, nls_1.localize)('open file', "Open {0} File", errorArea), undefined, true, () => source === "settings" /* SyncResource.Settings */ ? this.preferencesService.openUserSettings({ jsonEditor: true }) : this.preferencesService.openGlobalKeybindingSettings(true))]
                }
            });
            this.invalidContentErrorDisposables.set(key, (0, lifecycle_1.toDisposable)(() => {
                // close the error warning notification
                handle.close();
                this.invalidContentErrorDisposables.delete(key);
            }));
        }
        getConflictsCount() {
            return this.userDataSyncService.conflicts.reduce((result, { conflicts }) => { return result + conflicts.length; }, 0);
        }
        async updateGlobalActivityBadge() {
            this.globalActivityBadgeDisposable.clear();
            let badge = undefined;
            let priority = undefined;
            if (this.userDataSyncService.conflicts.length && this.userDataSyncEnablementService.isEnabled()) {
                badge = new activity_1.NumberBadge(this.getConflictsCount(), () => (0, nls_1.localize)('has conflicts', "{0}: Conflicts Detected", userDataSync_2.SYNC_TITLE.value));
            }
            else if (this.turningOnSync) {
                badge = new activity_1.ProgressBadge(() => (0, nls_1.localize)('turning on syncing', "Turning on Settings Sync..."));
                priority = 1;
            }
            if (badge) {
                this.globalActivityBadgeDisposable.value = this.activityService.showGlobalActivity({ badge, priority });
            }
        }
        async updateAccountBadge() {
            this.accountBadgeDisposable.clear();
            let badge = undefined;
            if (this.userDataSyncService.status !== "uninitialized" /* SyncStatus.Uninitialized */ && this.userDataSyncEnablementService.isEnabled() && this.userDataSyncWorkbenchService.accountStatus === "unavailable" /* AccountStatus.Unavailable */) {
                badge = new activity_1.NumberBadge(1, () => (0, nls_1.localize)('sign in to sync', "Sign in to Sync Settings"));
            }
            if (badge) {
                this.accountBadgeDisposable.value = this.activityService.showAccountsActivity({ badge, priority: undefined });
            }
        }
        async turnOn() {
            try {
                if (!this.userDataSyncWorkbenchService.authenticationProviders.length) {
                    throw new Error((0, nls_1.localize)('no authentication providers', "No authentication providers are available."));
                }
                const turnOn = await this.askToConfigure();
                if (!turnOn) {
                    return;
                }
                if (this.userDataSyncStoreManagementService.userDataSyncStore?.canSwitch) {
                    await this.selectSettingsSyncService(this.userDataSyncStoreManagementService.userDataSyncStore);
                }
                await this.userDataSyncWorkbenchService.turnOn();
            }
            catch (e) {
                if ((0, errors_1.isCancellationError)(e)) {
                    return;
                }
                if (e instanceof userDataSync_1.UserDataSyncError) {
                    switch (e.code) {
                        case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                            if (e.resource === "keybindings" /* SyncResource.Keybindings */ || e.resource === "settings" /* SyncResource.Settings */ || e.resource === "tasks" /* SyncResource.Tasks */) {
                                this.handleTooLargeError(e.resource, (0, nls_1.localize)('too large while starting sync', "Settings sync cannot be turned on because size of the {0} file to sync is larger than {1}. Please open the file and reduce the size and turn on sync", (0, userDataSync_2.getSyncAreaLabel)(e.resource).toLowerCase(), '100kb'), e);
                                return;
                            }
                            break;
                        case "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */:
                        case "Gone" /* UserDataSyncErrorCode.Gone */:
                        case "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */: {
                            const message = (0, nls_1.localize)('error upgrade required while starting sync', "Settings sync cannot be turned on because the current version ({0}, {1}) is not compatible with the sync service. Please update before turning on sync.", this.productService.version, this.productService.commit);
                            const operationId = e.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", e.operationId) : undefined;
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: operationId ? `${message} ${operationId}` : message,
                            });
                            return;
                        }
                        case "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */:
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: (0, nls_1.localize)('error reset required while starting sync', "Settings sync cannot be turned on because your data in the cloud is older than that of the client. Please clear your data in the cloud before turning on sync."),
                                actions: {
                                    primary: [
                                        new actions_1.Action('reset', (0, nls_1.localize)('reset', "Clear Data in Cloud..."), undefined, true, () => this.userDataSyncWorkbenchService.resetSyncedData()),
                                        new actions_1.Action('show synced data', (0, nls_1.localize)('show synced data action', "Show Synced Data"), undefined, true, () => this.userDataSyncWorkbenchService.showSyncActivity())
                                    ]
                                }
                            });
                            return;
                        case "Unauthorized" /* UserDataSyncErrorCode.Unauthorized */:
                        case "Forbidden" /* UserDataSyncErrorCode.Forbidden */:
                            this.notificationService.error((0, nls_1.localize)('auth failed', "Error while turning on Settings Sync: Authentication failed."));
                            return;
                    }
                    this.notificationService.error((0, nls_1.localize)('turn on failed with user data sync error', "Error while turning on Settings Sync. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
                }
                else {
                    this.notificationService.error((0, nls_1.localize)({ key: 'turn on failed', comment: ['Substitution is for error reason'] }, "Error while turning on Settings Sync. {0}", (0, errors_1.getErrorMessage)(e)));
                }
            }
        }
        async askToConfigure() {
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                disposables.add(quickPick);
                quickPick.title = userDataSync_2.SYNC_TITLE.value;
                quickPick.ok = false;
                quickPick.customButton = true;
                quickPick.customLabel = (0, nls_1.localize)('sign in and turn on', "Sign in");
                quickPick.description = (0, nls_1.localize)('configure and turn on sync detail', "Please sign in to backup and sync your data across devices.");
                quickPick.canSelectMany = true;
                quickPick.ignoreFocusOut = true;
                quickPick.hideInput = true;
                quickPick.hideCheckAll = true;
                const items = this.getConfigureSyncQuickPickItems();
                quickPick.items = items;
                quickPick.selectedItems = items.filter(item => this.userDataSyncEnablementService.isResourceEnabled(item.id));
                let accepted = false;
                disposables.add(event_1.Event.any(quickPick.onDidAccept, quickPick.onDidCustom)(() => {
                    accepted = true;
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    try {
                        if (accepted) {
                            this.updateConfiguration(items, quickPick.selectedItems);
                        }
                        c(accepted);
                    }
                    catch (error) {
                        e(error);
                    }
                    finally {
                        disposables.dispose();
                    }
                }));
                quickPick.show();
            });
        }
        getConfigureSyncQuickPickItems() {
            const result = [{
                    id: "settings" /* SyncResource.Settings */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("settings" /* SyncResource.Settings */)
                }, {
                    id: "keybindings" /* SyncResource.Keybindings */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("keybindings" /* SyncResource.Keybindings */),
                }, {
                    id: "snippets" /* SyncResource.Snippets */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("snippets" /* SyncResource.Snippets */)
                }, {
                    id: "tasks" /* SyncResource.Tasks */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("tasks" /* SyncResource.Tasks */)
                }, {
                    id: "globalState" /* SyncResource.GlobalState */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("globalState" /* SyncResource.GlobalState */),
                }, {
                    id: "extensions" /* SyncResource.Extensions */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("extensions" /* SyncResource.Extensions */)
                }];
            if (this.userDataProfilesService.isEnabled()) {
                result.push({
                    id: "profiles" /* SyncResource.Profiles */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("profiles" /* SyncResource.Profiles */),
                });
            }
            return result;
        }
        updateConfiguration(items, selectedItems) {
            for (const item of items) {
                const wasEnabled = this.userDataSyncEnablementService.isResourceEnabled(item.id);
                const isEnabled = !!selectedItems.filter(selected => selected.id === item.id)[0];
                if (wasEnabled !== isEnabled) {
                    this.userDataSyncEnablementService.setResourceEnablement(item.id, isEnabled);
                }
            }
        }
        async configureSyncOptions() {
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                disposables.add(quickPick);
                quickPick.title = (0, nls_1.localize)('configure sync title', "{0}: Configure...", userDataSync_2.SYNC_TITLE.value);
                quickPick.placeholder = (0, nls_1.localize)('configure sync placeholder', "Choose what to sync");
                quickPick.canSelectMany = true;
                quickPick.ignoreFocusOut = true;
                quickPick.ok = true;
                const items = this.getConfigureSyncQuickPickItems();
                quickPick.items = items;
                quickPick.selectedItems = items.filter(item => this.userDataSyncEnablementService.isResourceEnabled(item.id));
                disposables.add(quickPick.onDidAccept(async () => {
                    if (quickPick.selectedItems.length) {
                        this.updateConfiguration(items, quickPick.selectedItems);
                        quickPick.hide();
                    }
                }));
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c();
                }));
                quickPick.show();
            });
        }
        async turnOff() {
            const result = await this.dialogService.confirm({
                message: (0, nls_1.localize)('turn off sync confirmation', "Do you want to turn off sync?"),
                detail: (0, nls_1.localize)('turn off sync detail', "Your settings, keybindings, extensions, snippets and UI State will no longer be synced."),
                primaryButton: (0, nls_1.localize)({ key: 'turn off', comment: ['&& denotes a mnemonic'] }, "&&Turn off"),
                checkbox: this.userDataSyncWorkbenchService.accountStatus === "available" /* AccountStatus.Available */ ? {
                    label: (0, nls_1.localize)('turn off sync everywhere', "Turn off sync on all your devices and clear the data from the cloud.")
                } : undefined
            });
            if (result.confirmed) {
                return this.userDataSyncWorkbenchService.turnoff(!!result.checkboxChecked);
            }
        }
        disableSync(source) {
            switch (source) {
                case "settings" /* SyncResource.Settings */: return this.userDataSyncEnablementService.setResourceEnablement("settings" /* SyncResource.Settings */, false);
                case "keybindings" /* SyncResource.Keybindings */: return this.userDataSyncEnablementService.setResourceEnablement("keybindings" /* SyncResource.Keybindings */, false);
                case "snippets" /* SyncResource.Snippets */: return this.userDataSyncEnablementService.setResourceEnablement("snippets" /* SyncResource.Snippets */, false);
                case "tasks" /* SyncResource.Tasks */: return this.userDataSyncEnablementService.setResourceEnablement("tasks" /* SyncResource.Tasks */, false);
                case "extensions" /* SyncResource.Extensions */: return this.userDataSyncEnablementService.setResourceEnablement("extensions" /* SyncResource.Extensions */, false);
                case "globalState" /* SyncResource.GlobalState */: return this.userDataSyncEnablementService.setResourceEnablement("globalState" /* SyncResource.GlobalState */, false);
                case "profiles" /* SyncResource.Profiles */: return this.userDataSyncEnablementService.setResourceEnablement("profiles" /* SyncResource.Profiles */, false);
            }
        }
        showSyncActivity() {
            return this.outputService.showChannel(userDataSync_1.USER_DATA_SYNC_LOG_ID);
        }
        async selectSettingsSyncService(userDataSyncStore) {
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = disposables.add(this.quickInputService.createQuickPick());
                quickPick.title = (0, nls_1.localize)('switchSyncService.title', "{0}: Select Service", userDataSync_2.SYNC_TITLE.value);
                quickPick.description = (0, nls_1.localize)('switchSyncService.description', "Ensure you are using the same settings sync service when syncing with multiple environments");
                quickPick.hideInput = true;
                quickPick.ignoreFocusOut = true;
                const getDescription = (url) => {
                    const isDefault = (0, resources_1.isEqual)(url, userDataSyncStore.defaultUrl);
                    if (isDefault) {
                        return (0, nls_1.localize)('default', "Default");
                    }
                    return undefined;
                };
                quickPick.items = [
                    {
                        id: 'insiders',
                        label: (0, nls_1.localize)('insiders', "Insiders"),
                        description: getDescription(userDataSyncStore.insidersUrl)
                    },
                    {
                        id: 'stable',
                        label: (0, nls_1.localize)('stable', "Stable"),
                        description: getDescription(userDataSyncStore.stableUrl)
                    }
                ];
                disposables.add(quickPick.onDidAccept(async () => {
                    try {
                        await this.userDataSyncStoreManagementService.switch(quickPick.selectedItems[0].id);
                        c();
                    }
                    catch (error) {
                        e(error);
                    }
                    finally {
                        quickPick.hide();
                    }
                }));
                disposables.add(quickPick.onDidHide(() => disposables.dispose()));
                quickPick.show();
            });
        }
        registerActions() {
            if (this.userDataSyncEnablementService.canToggleEnablement()) {
                this.registerTurnOnSyncAction();
                this.registerTurnOffSyncAction();
            }
            this.registerTurningOnSyncAction();
            this.registerCancelTurnOnSyncAction();
            this.registerSignInAction(); // When Sync is turned on from CLI
            this.registerShowConflictsAction();
            this.registerEnableSyncViewsAction();
            this.registerManageSyncAction();
            this.registerSyncNowAction();
            this.registerConfigureSyncAction();
            this.registerShowSettingsAction();
            this.registerHelpAction();
            this.registerShowLogAction();
            this.registerResetSyncDataAction();
            this.registerAcceptMergesAction();
            if (platform_2.isWeb) {
                this.registerDownloadSyncActivityAction();
            }
        }
        registerTurnOnSyncAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT.toNegated(), CONTEXT_TURNING_ON_STATE.negate());
            this._register((0, actions_2.registerAction2)(class TurningOnSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.turnOn',
                        title: (0, nls_1.localize2)('global activity turn on sync', 'Backup and Sync Settings...'),
                        category: userDataSync_2.SYNC_TITLE,
                        f1: true,
                        precondition: when,
                        menu: [{
                                group: '3_settings_sync',
                                id: actions_2.MenuId.GlobalActivity,
                                when,
                                order: 1
                            }, {
                                group: '3_settings_sync',
                                id: actions_2.MenuId.MenubarPreferencesMenu,
                                when,
                                order: 1
                            }, {
                                group: '1_settings',
                                id: actions_2.MenuId.AccountsContext,
                                when,
                                order: 2
                            }]
                    });
                }
                async run() {
                    return that.turnOn();
                }
            }));
        }
        registerTurningOnSyncAction() {
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT.toNegated(), CONTEXT_TURNING_ON_STATE);
            this._register((0, actions_2.registerAction2)(class TurningOnSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userData.actions.turningOn',
                        title: (0, nls_1.localize)('turnin on sync', "Turning on Settings Sync..."),
                        precondition: contextkey_1.ContextKeyExpr.false(),
                        menu: [{
                                group: '3_settings_sync',
                                id: actions_2.MenuId.GlobalActivity,
                                when,
                                order: 2
                            }, {
                                group: '1_settings',
                                id: actions_2.MenuId.AccountsContext,
                                when,
                            }]
                    });
                }
                async run() { }
            }));
        }
        registerCancelTurnOnSyncAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class TurningOnSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userData.actions.cancelTurnOn',
                        title: (0, nls_1.localize)('cancel turning on sync', "Cancel"),
                        icon: codicons_1.Codicon.stopCircle,
                        menu: {
                            id: actions_2.MenuId.ViewContainerTitle,
                            when: contextkey_1.ContextKeyExpr.and(CONTEXT_TURNING_ON_STATE, contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID)),
                            group: 'navigation',
                            order: 1
                        }
                    });
                }
                async run() {
                    return that.userDataSyncWorkbenchService.turnoff(false);
                }
            }));
        }
        registerSignInAction() {
            const that = this;
            const id = 'workbench.userData.actions.signin';
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT, userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("unavailable" /* AccountStatus.Unavailable */));
            this._register((0, actions_2.registerAction2)(class StopSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userData.actions.signin',
                        title: (0, nls_1.localize)('sign in global', "Sign in to Sync Settings"),
                        menu: {
                            group: '3_settings_sync',
                            id: actions_2.MenuId.GlobalActivity,
                            when,
                            order: 2
                        }
                    });
                }
                async run() {
                    try {
                        await that.userDataSyncWorkbenchService.signIn();
                    }
                    catch (e) {
                        that.notificationService.error(e);
                    }
                }
            }));
            this._register(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.AccountsContext, {
                group: '1_settings',
                command: {
                    id,
                    title: (0, nls_1.localize)('sign in accounts', "Sign in to Sync Settings (1)"),
                },
                when
            }));
        }
        getShowConflictsTitle() {
            return (0, nls_1.localize2)('resolveConflicts_global', "Show Conflicts ({0})", this.getConflictsCount());
        }
        registerShowConflictsAction() {
            this.conflictsActionDisposable.value = undefined;
            const that = this;
            this.conflictsActionDisposable.value = (0, actions_2.registerAction2)(class TurningOnSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: showConflictsCommandId,
                        get title() { return that.getShowConflictsTitle(); },
                        category: userDataSync_2.SYNC_TITLE,
                        f1: true,
                        precondition: userDataSync_2.CONTEXT_HAS_CONFLICTS,
                        menu: [{
                                group: '3_settings_sync',
                                id: actions_2.MenuId.GlobalActivity,
                                when: userDataSync_2.CONTEXT_HAS_CONFLICTS,
                                order: 2
                            }, {
                                group: '3_settings_sync',
                                id: actions_2.MenuId.MenubarPreferencesMenu,
                                when: userDataSync_2.CONTEXT_HAS_CONFLICTS,
                                order: 2
                            }]
                    });
                }
                async run() {
                    return that.userDataSyncWorkbenchService.showConflicts();
                }
            });
        }
        registerManageSyncAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_ENABLEMENT, userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */));
            this._register((0, actions_2.registerAction2)(class SyncStatusAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.manage',
                        title: (0, nls_1.localize)('sync is on', "Settings Sync is On"),
                        toggled: contextkey_1.ContextKeyTrueExpr.INSTANCE,
                        menu: [
                            {
                                id: actions_2.MenuId.GlobalActivity,
                                group: '3_settings_sync',
                                when,
                                order: 2
                            },
                            {
                                id: actions_2.MenuId.MenubarPreferencesMenu,
                                group: '3_settings_sync',
                                when,
                                order: 2,
                            },
                            {
                                id: actions_2.MenuId.AccountsContext,
                                group: '1_settings',
                                when,
                            }
                        ],
                    });
                }
                run(accessor) {
                    return new Promise((c, e) => {
                        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                        const commandService = accessor.get(commands_1.ICommandService);
                        const disposables = new lifecycle_1.DisposableStore();
                        const quickPick = quickInputService.createQuickPick();
                        disposables.add(quickPick);
                        const items = [];
                        if (that.userDataSyncService.conflicts.length) {
                            items.push({ id: showConflictsCommandId, label: `${userDataSync_2.SYNC_TITLE.value}: ${that.getShowConflictsTitle().original}` });
                            items.push({ type: 'separator' });
                        }
                        items.push({ id: configureSyncCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${configureSyncCommand.title.original}` });
                        items.push({ id: showSyncSettingsCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${showSyncSettingsCommand.title.original}` });
                        items.push({ id: showSyncedDataCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${showSyncedDataCommand.title.original}` });
                        items.push({ type: 'separator' });
                        items.push({ id: syncNowCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${syncNowCommand.title.original}`, description: syncNowCommand.description(that.userDataSyncService) });
                        if (that.userDataSyncEnablementService.canToggleEnablement()) {
                            const account = that.userDataSyncWorkbenchService.current;
                            items.push({ id: turnOffSyncCommand.id, label: `${userDataSync_2.SYNC_TITLE.value}: ${turnOffSyncCommand.title.original}`, description: account ? `${account.accountName} (${that.authenticationService.getProvider(account.authenticationProviderId).label})` : undefined });
                        }
                        quickPick.items = items;
                        disposables.add(quickPick.onDidAccept(() => {
                            if (quickPick.selectedItems[0] && quickPick.selectedItems[0].id) {
                                commandService.executeCommand(quickPick.selectedItems[0].id);
                            }
                            quickPick.hide();
                        }));
                        disposables.add(quickPick.onDidHide(() => {
                            disposables.dispose();
                            c();
                        }));
                        quickPick.show();
                    });
                }
            }));
        }
        registerEnableSyncViewsAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */));
            this._register((0, actions_2.registerAction2)(class SyncStatusAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: showSyncedDataCommand.id,
                        title: showSyncedDataCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        precondition: when,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when
                        }
                    });
                }
                run(accessor) {
                    return that.userDataSyncWorkbenchService.showSyncActivity();
                }
            }));
        }
        registerSyncNowAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class SyncNowAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: syncNowCommand.id,
                        title: syncNowCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_ENABLEMENT, userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */))
                        }
                    });
                }
                run(accessor) {
                    return that.userDataSyncWorkbenchService.syncNow();
                }
            }));
        }
        registerTurnOffSyncAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class StopSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: turnOffSyncCommand.id,
                        title: turnOffSyncCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT),
                        },
                    });
                }
                async run() {
                    try {
                        await that.turnOff();
                    }
                    catch (e) {
                        if (!(0, errors_1.isCancellationError)(e)) {
                            that.notificationService.error((0, nls_1.localize)('turn off failed', "Error while turning off Settings Sync. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
                        }
                    }
                }
            }));
        }
        registerConfigureSyncAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT);
            this._register((0, actions_2.registerAction2)(class ConfigureSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: configureSyncCommand.id,
                        title: configureSyncCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        icon: codicons_1.Codicon.settingsGear,
                        tooltip: (0, nls_1.localize)('configure', "Configure..."),
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when
                            }, {
                                id: actions_2.MenuId.ViewContainerTitle,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_ENABLEMENT, contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID)),
                                group: 'navigation',
                                order: 2
                            }]
                    });
                }
                run() { return that.configureSyncOptions(); }
            }));
        }
        registerShowLogAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class ShowSyncActivityAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID,
                        title: (0, nls_1.localize)('show sync log title', "{0}: Show Log", userDataSync_2.SYNC_TITLE.value),
                        tooltip: (0, nls_1.localize)('show sync log toolrip', "Show Log"),
                        icon: codicons_1.Codicon.output,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */)),
                            }, {
                                id: actions_2.MenuId.ViewContainerTitle,
                                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                                group: 'navigation',
                                order: 1
                            }],
                    });
                }
                run() { return that.showSyncActivity(); }
            }));
        }
        registerShowSettingsAction() {
            this._register((0, actions_2.registerAction2)(class ShowSyncSettingsAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: showSyncSettingsCommand.id,
                        title: showSyncSettingsCommand.title,
                        category: userDataSync_2.SYNC_TITLE,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */)),
                        },
                    });
                }
                run(accessor) {
                    accessor.get(preferences_1.IPreferencesService).openUserSettings({ jsonEditor: false, query: '@tag:sync' });
                }
            }));
        }
        registerHelpAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class HelpAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.help',
                        title: userDataSync_2.SYNC_TITLE,
                        category: actionCommonCategories_1.Categories.Help,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */)),
                            }],
                    });
                }
                run() { return that.openerService.open(uri_1.URI.parse('https://aka.ms/vscode-settings-sync-help')); }
            }));
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewContainerTitle, {
                command: {
                    id: 'workbench.userDataSync.actions.help',
                    title: actionCommonCategories_1.Categories.Help.value
                },
                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                group: '1_help',
            });
        }
        registerAcceptMergesAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class AcceptMergesAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.acceptMerges',
                        title: (0, nls_1.localize)('complete merges title', "Complete Merge"),
                        menu: [{
                                id: actions_2.MenuId.EditorContent,
                                when: contextkey_1.ContextKeyExpr.and(mergeEditor_1.ctxIsMergeResultEditor, contextkey_1.ContextKeyExpr.regex(mergeEditor_1.ctxMergeBaseUri.key, new RegExp(`^${userDataSync_1.USER_DATA_SYNC_SCHEME}:`))),
                            }],
                    });
                }
                async run(accessor, previewResource) {
                    const textFileService = accessor.get(textfiles_1.ITextFileService);
                    await textFileService.save(previewResource);
                    const content = await textFileService.read(previewResource);
                    await that.userDataSyncService.accept(this.getSyncResource(previewResource), previewResource, content.value, true);
                }
                getSyncResource(previewResource) {
                    const conflict = that.userDataSyncService.conflicts.find(({ conflicts }) => conflicts.some(conflict => (0, resources_1.isEqual)(conflict.previewResource, previewResource)));
                    if (conflict) {
                        return conflict;
                    }
                    throw new Error(`Unknown resource: ${previewResource.toString()}`);
                }
            }));
        }
        registerDownloadSyncActivityAction() {
            this._register((0, actions_2.registerAction2)(class DownloadSyncActivityAction extends actions_2.Action2 {
                constructor() {
                    super(userDataSync_2.DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR);
                }
                async run(accessor) {
                    const userDataSyncWorkbenchService = accessor.get(userDataSync_2.IUserDataSyncWorkbenchService);
                    const notificationService = accessor.get(notification_1.INotificationService);
                    const folder = await userDataSyncWorkbenchService.downloadSyncActivity();
                    if (folder) {
                        notificationService.info((0, nls_1.localize)('download sync activity complete', "Successfully downloaded Settings Sync activity."));
                    }
                }
            }));
        }
        registerViews() {
            const container = this.registerViewContainer();
            this.registerDataViews(container);
        }
        registerViewContainer() {
            return platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: userDataSync_2.SYNC_VIEW_CONTAINER_ID,
                title: userDataSync_2.SYNC_TITLE,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [userDataSync_2.SYNC_VIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
                icon: userDataSync_2.SYNC_VIEW_ICON,
                hideIfEmpty: true,
            }, 0 /* ViewContainerLocation.Sidebar */);
        }
        registerResetSyncDataAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.actions.syncData.reset',
                        title: (0, nls_1.localize)('workbench.actions.syncData.reset', "Clear Data in Cloud..."),
                        menu: [{
                                id: actions_2.MenuId.ViewContainerTitle,
                                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                                group: '0_configure',
                            }],
                    });
                }
                run() { return that.userDataSyncWorkbenchService.resetSyncedData(); }
            }));
        }
        registerDataViews(container) {
            this._register(this.instantiationService.createInstance(userDataSyncViews_1.UserDataSyncDataViews, container));
        }
    };
    exports.UserDataSyncWorkbenchContribution = UserDataSyncWorkbenchContribution;
    exports.UserDataSyncWorkbenchContribution = UserDataSyncWorkbenchContribution = __decorate([
        __param(0, userDataSync_1.IUserDataSyncEnablementService),
        __param(1, userDataSync_1.IUserDataSyncService),
        __param(2, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, activity_1.IActivityService),
        __param(5, notification_1.INotificationService),
        __param(6, editorService_1.IEditorService),
        __param(7, userDataProfile_1.IUserDataProfilesService),
        __param(8, userDataProfile_2.IUserDataProfileService),
        __param(9, dialogs_1.IDialogService),
        __param(10, quickInput_1.IQuickInputService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, output_1.IOutputService),
        __param(13, userDataSync_1.IUserDataAutoSyncService),
        __param(14, resolverService_1.ITextModelService),
        __param(15, preferences_1.IPreferencesService),
        __param(16, telemetry_1.ITelemetryService),
        __param(17, productService_1.IProductService),
        __param(18, opener_1.IOpenerService),
        __param(19, authentication_1.IAuthenticationService),
        __param(20, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(21, host_1.IHostService),
        __param(22, commands_1.ICommandService),
        __param(23, issue_1.IWorkbenchIssueService)
    ], UserDataSyncWorkbenchContribution);
    let UserDataRemoteContentProvider = class UserDataRemoteContentProvider {
        constructor(userDataSyncService, modelService, languageService) {
            this.userDataSyncService = userDataSyncService;
            this.modelService = modelService;
            this.languageService = languageService;
        }
        provideTextContent(uri) {
            if (uri.scheme === userDataSync_1.USER_DATA_SYNC_SCHEME) {
                return this.userDataSyncService.resolveContent(uri).then(content => this.modelService.createModel(content || '', this.languageService.createById('jsonc'), uri));
            }
            return null;
        }
    };
    UserDataRemoteContentProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService)
    ], UserDataRemoteContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXNlckRhdGFTeW5jL2Jyb3dzZXIvdXNlckRhdGFTeW5jLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStEaEcsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLEVBQUUsRUFBRSx3Q0FBd0MsRUFBRSxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7SUFDdkgsTUFBTSxvQkFBb0IsR0FBRyxFQUFFLEVBQUUsRUFBRSx3Q0FBeUIsRUFBRSxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLEVBQUUsQ0FBQztJQUNuSCxNQUFNLHNCQUFzQixHQUFHLDhDQUE4QyxDQUFDO0lBQzlFLE1BQU0sY0FBYyxHQUFHO1FBQ3RCLEVBQUUsRUFBRSx3Q0FBd0M7UUFDNUMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7UUFDeEMsV0FBVyxDQUFDLG1CQUF5QztZQUNwRCxJQUFJLG1CQUFtQixDQUFDLE1BQU0sdUNBQXVCLEVBQUUsQ0FBQztnQkFDdkQsT0FBTyxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUNELElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLElBQUEsY0FBTyxFQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BHLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO0tBQ0Qs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