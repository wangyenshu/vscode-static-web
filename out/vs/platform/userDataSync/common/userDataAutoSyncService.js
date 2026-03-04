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
define(["require", "exports", "vs/base/common/async", "vs/base/common/date", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/nls", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSyncMachines"], function (require, exports, async_1, date_1, errorMessage_1, errors_1, event_1, lifecycle_1, platform_1, resources_1, uri_1, nls_1, productService_1, storage_1, telemetry_1, userDataSync_1, userDataSyncAccount_1, userDataSyncMachines_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataAutoSyncService = void 0;
    const disableMachineEventuallyKey = 'sync.disableMachineEventually';
    const sessionIdKey = 'sync.sessionId';
    const storeUrlKey = 'sync.storeUrl';
    const productQualityKey = 'sync.productQuality';
    let UserDataAutoSyncService = class UserDataAutoSyncService extends lifecycle_1.Disposable {
        get syncUrl() {
            const value = this.storageService.get(storeUrlKey, -1 /* StorageScope.APPLICATION */);
            return value ? uri_1.URI.parse(value) : undefined;
        }
        set syncUrl(syncUrl) {
            if (syncUrl) {
                this.storageService.store(storeUrlKey, syncUrl.toString(), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(storeUrlKey, -1 /* StorageScope.APPLICATION */);
            }
        }
        get productQuality() {
            return this.storageService.get(productQualityKey, -1 /* StorageScope.APPLICATION */);
        }
        set productQuality(productQuality) {
            if (productQuality) {
                this.storageService.store(productQualityKey, productQuality, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(productQualityKey, -1 /* StorageScope.APPLICATION */);
            }
        }
        constructor(productService, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncEnablementService, userDataSyncService, logService, userDataSyncAccountService, telemetryService, userDataSyncMachinesService, storageService) {
            super();
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncService = userDataSyncService;
            this.logService = logService;
            this.userDataSyncAccountService = userDataSyncAccountService;
            this.telemetryService = telemetryService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.storageService = storageService;
            this.autoSync = this._register(new lifecycle_1.MutableDisposable());
            this.successiveFailures = 0;
            this.lastSyncTriggerTime = undefined;
            this.suspendUntilRestart = false;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this.sources = [];
            this.syncTriggerDelayer = this._register(new async_1.ThrottledDelayer(this.getSyncTriggerDelayTime()));
            this.lastSyncUrl = this.syncUrl;
            this.syncUrl = userDataSyncStoreManagementService.userDataSyncStore?.url;
            this.previousProductQuality = this.productQuality;
            this.productQuality = productService.quality;
            if (this.syncUrl) {
                this.logService.info('Using settings sync service', this.syncUrl.toString());
                this._register(userDataSyncStoreManagementService.onDidChangeUserDataSyncStore(() => {
                    if (!(0, resources_1.isEqual)(this.syncUrl, userDataSyncStoreManagementService.userDataSyncStore?.url)) {
                        this.lastSyncUrl = this.syncUrl;
                        this.syncUrl = userDataSyncStoreManagementService.userDataSyncStore?.url;
                        if (this.syncUrl) {
                            this.logService.info('Using settings sync service', this.syncUrl.toString());
                        }
                    }
                }));
                if (this.userDataSyncEnablementService.isEnabled()) {
                    this.logService.info('Auto Sync is enabled.');
                }
                else {
                    this.logService.info('Auto Sync is disabled.');
                }
                this.updateAutoSync();
                if (this.hasToDisableMachineEventually()) {
                    this.disableMachineEventually();
                }
                this._register(userDataSyncAccountService.onDidChangeAccount(() => this.updateAutoSync()));
                this._register(userDataSyncStoreService.onDidChangeDonotMakeRequestsUntil(() => this.updateAutoSync()));
                this._register(userDataSyncService.onDidChangeLocal(source => this.triggerSync([source], false, false)));
                this._register(event_1.Event.filter(this.userDataSyncEnablementService.onDidChangeResourceEnablement, ([, enabled]) => enabled)(() => this.triggerSync(['resourceEnablement'], false, false)));
                this._register(this.userDataSyncStoreManagementService.onDidChangeUserDataSyncStore(() => this.triggerSync(['userDataSyncStoreChanged'], false, false)));
            }
        }
        updateAutoSync() {
            const { enabled, message } = this.isAutoSyncEnabled();
            if (enabled) {
                if (this.autoSync.value === undefined) {
                    this.autoSync.value = new AutoSync(this.lastSyncUrl, 1000 * 60 * 5 /* 5 miutes */, this.userDataSyncStoreManagementService, this.userDataSyncStoreService, this.userDataSyncService, this.userDataSyncMachinesService, this.logService, this.telemetryService, this.storageService);
                    this.autoSync.value.register(this.autoSync.value.onDidStartSync(() => this.lastSyncTriggerTime = new Date().getTime()));
                    this.autoSync.value.register(this.autoSync.value.onDidFinishSync(e => this.onDidFinishSync(e)));
                    if (this.startAutoSync()) {
                        this.autoSync.value.start();
                    }
                }
            }
            else {
                this.syncTriggerDelayer.cancel();
                if (this.autoSync.value !== undefined) {
                    if (message) {
                        this.logService.info(message);
                    }
                    this.autoSync.clear();
                }
                /* log message when auto sync is not disabled by user */
                else if (message && this.userDataSyncEnablementService.isEnabled()) {
                    this.logService.info(message);
                }
            }
        }
        // For tests purpose only
        startAutoSync() { return true; }
        isAutoSyncEnabled() {
            if (!this.userDataSyncEnablementService.isEnabled()) {
                return { enabled: false, message: 'Auto Sync: Disabled.' };
            }
            if (!this.userDataSyncAccountService.account) {
                return { enabled: false, message: 'Auto Sync: Suspended until auth token is available.' };
            }
            if (this.userDataSyncStoreService.donotMakeRequestsUntil) {
                return { enabled: false, message: `Auto Sync: Suspended until ${(0, date_1.toLocalISOString)(this.userDataSyncStoreService.donotMakeRequestsUntil)} because server is not accepting requests until then.` };
            }
            if (this.suspendUntilRestart) {
                return { enabled: false, message: 'Auto Sync: Suspended until restart.' };
            }
            return { enabled: true };
        }
        async turnOn() {
            this.stopDisableMachineEventually();
            this.lastSyncUrl = this.syncUrl;
            this.updateEnablement(true);
        }
        async turnOff(everywhere, softTurnOffOnError, donotRemoveMachine) {
            try {
                // Remove machine
                if (this.userDataSyncAccountService.account && !donotRemoveMachine) {
                    await this.userDataSyncMachinesService.removeCurrentMachine();
                }
                // Disable Auto Sync
                this.updateEnablement(false);
                // Reset Session
                this.storageService.remove(sessionIdKey, -1 /* StorageScope.APPLICATION */);
                // Reset
                if (everywhere) {
                    this.telemetryService.publicLog2('sync/turnOffEveryWhere');
                    await this.userDataSyncService.reset();
                }
                else {
                    await this.userDataSyncService.resetLocal();
                }
            }
            catch (error) {
                this.logService.error(error);
                if (softTurnOffOnError) {
                    this.updateEnablement(false);
                }
                else {
                    throw error;
                }
            }
        }
        updateEnablement(enabled) {
            if (this.userDataSyncEnablementService.isEnabled() !== enabled) {
                this.userDataSyncEnablementService.setEnablement(enabled);
                this.updateAutoSync();
            }
        }
        hasProductQualityChanged() {
            return !!this.previousProductQuality && !!this.productQuality && this.previousProductQuality !== this.productQuality;
        }
        async onDidFinishSync(error) {
            if (!error) {
                // Sync finished without errors
                this.successiveFailures = 0;
                return;
            }
            // Error while syncing
            const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
            // Log to telemetry
            if (userDataSyncError instanceof userDataSync_1.UserDataAutoSyncError) {
                this.telemetryService.publicLog2(`autosync/error`, { code: userDataSyncError.code, service: this.userDataSyncStoreManagementService.userDataSyncStore.url.toString() });
            }
            // Session got expired
            if (userDataSyncError.code === "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info('Auto Sync: Turned off sync because current session is expired');
            }
            // Turned off from another device
            else if (userDataSyncError.code === "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info('Auto Sync: Turned off sync because sync is turned off in the cloud');
            }
            // Exceeded Rate Limit on Client
            else if (userDataSyncError.code === "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */) {
                this.suspendUntilRestart = true;
                this.logService.info('Auto Sync: Suspended sync because of making too many requests to server');
                this.updateAutoSync();
            }
            // Exceeded Rate Limit on Server
            else if (userDataSyncError.code === "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */) {
                await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine because disabling a machine makes request to server and can fail with TooManyRequests */);
                this.disableMachineEventually();
                this.logService.info('Auto Sync: Turned off sync because of making too many requests to server');
            }
            // Method Not Found
            else if (userDataSyncError.code === "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info('Auto Sync: Turned off sync because current client is making requests to server that are not supported');
            }
            // Upgrade Required or Gone
            else if (userDataSyncError.code === "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */ || userDataSyncError.code === "Gone" /* UserDataSyncErrorCode.Gone */) {
                await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine because disabling a machine makes request to server and can fail with upgrade required or gone */);
                this.disableMachineEventually();
                this.logService.info('Auto Sync: Turned off sync because current client is not compatible with server. Requires client upgrade.');
            }
            // Incompatible Local Content
            else if (userDataSyncError.code === "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info(`Auto Sync: Turned off sync because server has ${userDataSyncError.resource} content with newer version than of client. Requires client upgrade.`);
            }
            // Incompatible Remote Content
            else if (userDataSyncError.code === "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info(`Auto Sync: Turned off sync because server has ${userDataSyncError.resource} content with older version than of client. Requires server reset.`);
            }
            // Service changed
            else if (userDataSyncError.code === "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */ || userDataSyncError.code === "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */) {
                // Check if default settings sync service has changed in web without changing the product quality
                // Then turn off settings sync and ask user to turn on again
                if (platform_1.isWeb && userDataSyncError.code === "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */ && !this.hasProductQualityChanged()) {
                    await this.turnOff(false, true /* force soft turnoff on error */);
                    this.logService.info('Auto Sync: Turned off sync because default sync service is changed.');
                }
                // Service has changed by the user. So turn off and turn on sync.
                // Show a prompt to the user about service change.
                else {
                    await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine */);
                    await this.turnOn();
                    this.logService.info('Auto Sync: Sync Service changed. Turned off auto sync, reset local state and turned on auto sync.');
                }
            }
            else {
                this.logService.error(userDataSyncError);
                this.successiveFailures++;
            }
            this._onError.fire(userDataSyncError);
        }
        async disableMachineEventually() {
            this.storageService.store(disableMachineEventuallyKey, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            await (0, async_1.timeout)(1000 * 60 * 10);
            // Return if got stopped meanwhile.
            if (!this.hasToDisableMachineEventually()) {
                return;
            }
            this.stopDisableMachineEventually();
            // disable only if sync is disabled
            if (!this.userDataSyncEnablementService.isEnabled() && this.userDataSyncAccountService.account) {
                await this.userDataSyncMachinesService.removeCurrentMachine();
            }
        }
        hasToDisableMachineEventually() {
            return this.storageService.getBoolean(disableMachineEventuallyKey, -1 /* StorageScope.APPLICATION */, false);
        }
        stopDisableMachineEventually() {
            this.storageService.remove(disableMachineEventuallyKey, -1 /* StorageScope.APPLICATION */);
        }
        async triggerSync(sources, skipIfSyncedRecently, disableCache) {
            if (this.autoSync.value === undefined) {
                return this.syncTriggerDelayer.cancel();
            }
            if (skipIfSyncedRecently && this.lastSyncTriggerTime
                && Math.round((new Date().getTime() - this.lastSyncTriggerTime) / 1000) < 10) {
                this.logService.debug('Auto Sync: Skipped. Limited to once per 10 seconds.');
                return;
            }
            this.sources.push(...sources);
            return this.syncTriggerDelayer.trigger(async () => {
                this.logService.trace('activity sources', ...this.sources);
                const providerId = this.userDataSyncAccountService.account?.authenticationProviderId || '';
                this.telemetryService.publicLog2('sync/triggered', { sources: this.sources, providerId });
                this.sources = [];
                if (this.autoSync.value) {
                    await this.autoSync.value.sync('Activity', disableCache);
                }
            }, this.successiveFailures
                ? this.getSyncTriggerDelayTime() * 1 * Math.min(Math.pow(2, this.successiveFailures), 60) /* Delay exponentially until max 1 minute */
                : this.getSyncTriggerDelayTime());
        }
        getSyncTriggerDelayTime() {
            return 2000; /* Debounce for 2 seconds if there are no failures */
        }
    };
    exports.UserDataAutoSyncService = UserDataAutoSyncService;
    exports.UserDataAutoSyncService = UserDataAutoSyncService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService),
        __param(4, userDataSync_1.IUserDataSyncService),
        __param(5, userDataSync_1.IUserDataSyncLogService),
        __param(6, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(9, storage_1.IStorageService)
    ], UserDataAutoSyncService);
    class AutoSync extends lifecycle_1.Disposable {
        static { this.INTERVAL_SYNCING = 'Interval'; }
        constructor(lastSyncUrl, interval /* in milliseconds */, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncService, userDataSyncMachinesService, logService, telemetryService, storageService) {
            super();
            this.lastSyncUrl = lastSyncUrl;
            this.interval = interval;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.logService = logService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this.intervalHandler = this._register(new lifecycle_1.MutableDisposable());
            this._onDidStartSync = this._register(new event_1.Emitter());
            this.onDidStartSync = this._onDidStartSync.event;
            this._onDidFinishSync = this._register(new event_1.Emitter());
            this.onDidFinishSync = this._onDidFinishSync.event;
            this.manifest = null;
        }
        start() {
            this._register(this.onDidFinishSync(() => this.waitUntilNextIntervalAndSync()));
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this.syncPromise) {
                    this.syncPromise.cancel();
                    this.logService.info('Auto sync: Cancelled sync that is in progress');
                    this.syncPromise = undefined;
                }
                this.syncTask?.stop();
                this.logService.info('Auto Sync: Stopped');
            }));
            this.sync(AutoSync.INTERVAL_SYNCING, false);
        }
        waitUntilNextIntervalAndSync() {
            this.intervalHandler.value = (0, async_1.disposableTimeout)(() => {
                this.sync(AutoSync.INTERVAL_SYNCING, false);
                this.intervalHandler.value = undefined;
            }, this.interval);
        }
        sync(reason, disableCache) {
            const syncPromise = (0, async_1.createCancelablePromise)(async (token) => {
                if (this.syncPromise) {
                    try {
                        // Wait until existing sync is finished
                        this.logService.debug('Auto Sync: Waiting until sync is finished.');
                        await this.syncPromise;
                    }
                    catch (error) {
                        if ((0, errors_1.isCancellationError)(error)) {
                            // Cancelled => Disposed. Donot continue sync.
                            return;
                        }
                    }
                }
                return this.doSync(reason, disableCache, token);
            });
            this.syncPromise = syncPromise;
            this.syncPromise.finally(() => this.syncPromise = undefined);
            return this.syncPromise;
        }
        hasSyncServiceChanged() {
            return this.lastSyncUrl !== undefined && !(0, resources_1.isEqual)(this.lastSyncUrl, this.userDataSyncStoreManagementService.userDataSyncStore?.url);
        }
        async hasDefaultServiceChanged() {
            const previous = await this.userDataSyncStoreManagementService.getPreviousUserDataSyncStore();
            const current = this.userDataSyncStoreManagementService.userDataSyncStore;
            // check if defaults changed
            return !!current && !!previous &&
                (!(0, resources_1.isEqual)(current.defaultUrl, previous.defaultUrl) ||
                    !(0, resources_1.isEqual)(current.insidersUrl, previous.insidersUrl) ||
                    !(0, resources_1.isEqual)(current.stableUrl, previous.stableUrl));
        }
        async doSync(reason, disableCache, token) {
            this.logService.info(`Auto Sync: Triggered by ${reason}`);
            this._onDidStartSync.fire();
            let error;
            try {
                await this.createAndRunSyncTask(disableCache, token);
            }
            catch (e) {
                this.logService.error(e);
                error = e;
                if (userDataSync_1.UserDataSyncError.toUserDataSyncError(e).code === "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */) {
                    try {
                        this.logService.info('Auto Sync: Client is making invalid requests. Cleaning up data...');
                        await this.userDataSyncService.cleanUpRemoteData();
                        this.logService.info('Auto Sync: Retrying sync...');
                        await this.createAndRunSyncTask(disableCache, token);
                        error = undefined;
                    }
                    catch (e1) {
                        this.logService.error(e1);
                        error = e1;
                    }
                }
            }
            this._onDidFinishSync.fire(error);
        }
        async createAndRunSyncTask(disableCache, token) {
            this.syncTask = await this.userDataSyncService.createSyncTask(this.manifest, disableCache);
            if (token.isCancellationRequested) {
                return;
            }
            this.manifest = this.syncTask.manifest;
            // Server has no data but this machine was synced before
            if (this.manifest === null && await this.userDataSyncService.hasPreviouslySynced()) {
                if (this.hasSyncServiceChanged()) {
                    if (await this.hasDefaultServiceChanged()) {
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('default service changed', "Cannot sync because default service has changed"), "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */);
                    }
                    else {
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('service changed', "Cannot sync because sync service has changed"), "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */);
                    }
                }
                else {
                    // Sync was turned off in the cloud
                    throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('turned off', "Cannot sync because syncing is turned off in the cloud"), "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */);
                }
            }
            const sessionId = this.storageService.get(sessionIdKey, -1 /* StorageScope.APPLICATION */);
            // Server session is different from client session
            if (sessionId && this.manifest && sessionId !== this.manifest.session) {
                if (this.hasSyncServiceChanged()) {
                    if (await this.hasDefaultServiceChanged()) {
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('default service changed', "Cannot sync because default service has changed"), "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */);
                    }
                    else {
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('service changed', "Cannot sync because sync service has changed"), "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */);
                    }
                }
                else {
                    throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('session expired', "Cannot sync because current session is expired"), "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */);
                }
            }
            const machines = await this.userDataSyncMachinesService.getMachines(this.manifest || undefined);
            // Return if cancellation is requested
            if (token.isCancellationRequested) {
                return;
            }
            const currentMachine = machines.find(machine => machine.isCurrent);
            // Check if sync was turned off from other machine
            if (currentMachine?.disabled) {
                // Throw TurnedOff error
                throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('turned off machine', "Cannot sync because syncing is turned off on this machine from another machine."), "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */);
            }
            const startTime = new Date().getTime();
            await this.syncTask.run();
            this.telemetryService.publicLog2('settingsSync:sync', { duration: new Date().getTime() - startTime });
            // After syncing, get the manifest if it was not available before
            if (this.manifest === null) {
                try {
                    this.manifest = await this.userDataSyncStoreService.manifest(null);
                }
                catch (error) {
                    throw new userDataSync_1.UserDataAutoSyncError((0, errorMessage_1.toErrorMessage)(error), error instanceof userDataSync_1.UserDataSyncError ? error.code : "Unknown" /* UserDataSyncErrorCode.Unknown */);
                }
            }
            // Update local session id
            if (this.manifest && this.manifest.session !== sessionId) {
                this.storageService.store(sessionIdKey, this.manifest.session, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            // Return if cancellation is requested
            if (token.isCancellationRequested) {
                return;
            }
            // Add current machine
            if (!currentMachine) {
                await this.userDataSyncMachinesService.addCurrentMachine(this.manifest || undefined);
            }
        }
        register(t) {
            return super._register(t);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFBdXRvU3luY1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL3VzZXJEYXRhQXV0b1N5bmNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtDaEcsTUFBTSwyQkFBMkIsR0FBRywrQkFBK0IsQ0FBQztJQUNwRSxNQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQztJQUN0QyxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUM7SUFDcEMsTUFBTSxpQkFBaUIsR0FBRyxxQkFBcUIsQ0FBQztJQUV6QyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBY3RELElBQVksT0FBTztZQUNsQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxXQUFXLG9DQUEyQixDQUFDO1lBQzdFLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDN0MsQ0FBQztRQUNELElBQVksT0FBTyxDQUFDLE9BQXdCO1lBQzNDLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsbUVBQWtELENBQUM7WUFDN0csQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFdBQVcsb0NBQTJCLENBQUM7WUFDbkUsQ0FBQztRQUNGLENBQUM7UUFHRCxJQUFZLGNBQWM7WUFDekIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIs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