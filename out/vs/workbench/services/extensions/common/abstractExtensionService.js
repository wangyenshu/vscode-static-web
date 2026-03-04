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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/stopwatch", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/extensionManagement/common/implicitActivationEvents", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteExtensionsScanner", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensionDescriptionRegistry", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/workbench/services/extensions/common/extensionHostManager", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensionRunningLocation", "vs/workbench/services/extensions/common/extensionRunningLocationTracker", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/extensions/common/lazyCreateExtensionHostManager", "vs/workbench/services/extensions/common/workspaceContains", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, async_1, errorMessage_1, event_1, htmlContent_1, lifecycle_1, network_1, perf, platform_1, resources_1, stopwatch_1, types_1, nls, configuration_1, dialogs_1, implicitActivationEvents_1, extensions_1, files_1, descriptors_1, instantiation_1, lifecycle_2, log_1, notification_1, productService_1, platform_2, remoteAuthorityResolver_1, remoteExtensionsScanner_1, telemetry_1, workspace_1, environmentService_1, extensionFeatures_1, extensionManagement_1, extensionDescriptionRegistry_1, extensionDevOptions_1, extensionHostManager_1, extensionManifestPropertiesService_1, extensionRunningLocation_1, extensionRunningLocationTracker_1, extensions_2, extensionsRegistry_1, lazyCreateExtensionHostManager_1, workspaceContains_1, lifecycle_3, remoteAgentService_1) {
    "use strict";
    var AbstractExtensionService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImplicitActivationAwareReader = exports.ExtensionHostCrashTracker = exports.ExtensionStatus = exports.ResolvedExtensions = exports.AbstractExtensionService = void 0;
    exports.checkEnabledAndProposedAPI = checkEnabledAndProposedAPI;
    exports.filterEnabledExtensions = filterEnabledExtensions;
    exports.extensionIsEnabled = extensionIsEnabled;
    const hasOwnProperty = Object.hasOwnProperty;
    const NO_OP_VOID_PROMISE = Promise.resolve(undefined);
    let AbstractExtensionService = AbstractExtensionService_1 = class AbstractExtensionService extends lifecycle_1.Disposable {
        constructor(_extensionsProposedApi, _extensionHostFactory, _extensionHostKindPicker, _instantiationService, _notificationService, _environmentService, _telemetryService, _extensionEnablementService, _fileService, _productService, _extensionManagementService, _contextService, _configurationService, _extensionManifestPropertiesService, _logService, _remoteAgentService, _remoteExtensionsScannerService, _lifecycleService, _remoteAuthorityResolverService, _dialogService) {
            super();
            this._extensionsProposedApi = _extensionsProposedApi;
            this._extensionHostFactory = _extensionHostFactory;
            this._extensionHostKindPicker = _extensionHostKindPicker;
            this._instantiationService = _instantiationService;
            this._notificationService = _notificationService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._extensionEnablementService = _extensionEnablementService;
            this._fileService = _fileService;
            this._productService = _productService;
            this._extensionManagementService = _extensionManagementService;
            this._contextService = _contextService;
            this._configurationService = _configurationService;
            this._extensionManifestPropertiesService = _extensionManifestPropertiesService;
            this._logService = _logService;
            this._remoteAgentService = _remoteAgentService;
            this._remoteExtensionsScannerService = _remoteExtensionsScannerService;
            this._lifecycleService = _lifecycleService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._dialogService = _dialogService;
            this._onDidRegisterExtensions = this._register(new event_1.Emitter());
            this.onDidRegisterExtensions = this._onDidRegisterExtensions.event;
            this._onDidChangeExtensionsStatus = this._register(new event_1.Emitter());
            this.onDidChangeExtensionsStatus = this._onDidChangeExtensionsStatus.event;
            this._onDidChangeExtensions = this._register(new event_1.Emitter({ leakWarningThreshold: 400 }));
            this.onDidChangeExtensions = this._onDidChangeExtensions.event;
            this._onWillActivateByEvent = this._register(new event_1.Emitter());
            this.onWillActivateByEvent = this._onWillActivateByEvent.event;
            this._onDidChangeResponsiveChange = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveChange = this._onDidChangeResponsiveChange.event;
            this._onWillStop = this._register(new event_1.Emitter());
            this.onWillStop = this._onWillStop.event;
            this._activationEventReader = new ImplicitActivationAwareReader();
            this._registry = new extensionDescriptionRegistry_1.LockableExtensionDescriptionRegistry(this._activationEventReader);
            this._installedExtensionsReady = new async_1.Barrier();
            this._extensionStatus = new extensions_1.ExtensionIdentifierMap();
            this._allRequestedActivateEvents = new Set();
            this._remoteCrashTracker = new ExtensionHostCrashTracker();
            this._deltaExtensionsQueue = [];
            this._inHandleDeltaExtensions = false;
            this._extensionHostManagers = [];
            this._resolveAuthorityAttempt = 0;
            // help the file service to activate providers by activating extensions by file system event
            this._register(this._fileService.onWillActivateFileSystemProvider(e => {
                if (e.scheme !== network_1.Schemas.vscodeRemote) {
                    e.join(this.activateByEvent(`onFileSystem:${e.scheme}`));
                }
            }));
            this._runningLocations = new extensionRunningLocationTracker_1.ExtensionRunningLocationTracker(this._registry, this._extensionHostKindPicker, this._environmentService, this._configurationService, this._logService, this._extensionManifestPropertiesService);
            this._register(this._extensionEnablementService.onEnablementChanged((extensions) => {
                const toAdd = [];
                const toRemove = [];
                for (const extension of extensions) {
                    if (this._safeInvokeIsEnabled(extension)) {
                        // an extension has been enabled
                        toAdd.push(extension);
                    }
                    else {
                        // an extension has been disabled
                        toRemove.push(extension);
                    }
                }
                if (platform_1.isCI) {
                    this._logService.info(`AbstractExtensionService.onEnablementChanged fired for ${extensions.map(e => e.identifier.id).join(', ')}`);
                }
                this._handleDeltaExtensions(new DeltaExtensionsQueueItem(toAdd, toRemove));
            }));
            this._register(this._extensionManagementService.onDidChangeProfile(({ added, removed }) => {
                if (added.length || removed.length) {
                    if (platform_1.isCI) {
                        this._logService.info(`AbstractExtensionService.onDidChangeProfile fired`);
                    }
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem(added, removed));
                }
            }));
            this._register(this._extensionManagementService.onDidEnableExtensions(extensions => {
                if (extensions.length) {
                    if (platform_1.isCI) {
                        this._logService.info(`AbstractExtensionService.onDidEnableExtensions fired`);
                    }
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem(extensions, []));
                }
            }));
            this._register(this._extensionManagementService.onDidInstallExtensions((result) => {
                const extensions = [];
                for (const { local, operation } of result) {
                    if (local && local.isValid && operation !== 4 /* InstallOperation.Migrate */ && this._safeInvokeIsEnabled(local)) {
                        extensions.push(local);
                    }
                }
                if (extensions.length) {
                    if (platform_1.isCI) {
                        this._logService.info(`AbstractExtensionService.onDidInstallExtensions fired for ${extensions.map(e => e.identifier.id).join(', ')}`);
                    }
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem(extensions, []));
                }
            }));
            this._register(this._extensionManagementService.onDidUninstallExtension((event) => {
                if (!event.error) {
                    // an extension has been uninstalled
                    if (platform_1.isCI) {
                        this._logService.info(`AbstractExtensionService.onDidUninstallExtension fired for ${event.identifier.id}`);
                    }
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem([], [event.identifier.id]));
                }
            }));
            this._register(this._lifecycleService.onDidShutdown(() => {
                // We need to disconnect the management connection before killing the local extension host.
                // Otherwise, the local extension host might terminate the underlying tunnel before the
                // management connection has a chance to send its disconnection message.
                const connection = this._remoteAgentService.getConnection();
                connection?.dispose();
                this._doStopExtensionHosts();
            }));
        }
        _getExtensionHostManagers(kind) {
            return this._extensionHostManagers.filter(extHostManager => extHostManager.kind === kind);
        }
        _getExtensionHostManagerByRunningLocation(runningLocation) {
            for (const extensionHostManager of this._extensionHostManagers) {
                if (extensionHostManager.representsRunningLocation(runningLocation)) {
                    return extensionHostManager;
                }
            }
            return null;
        }
        //#region deltaExtensions
        async _handleDeltaExtensions(item) {
            this._deltaExtensionsQueue.push(item);
            if (this._inHandleDeltaExtensions) {
                // Let the current item finish, the new one will be picked up
                return;
            }
            let lock = null;
            try {
                this._inHandleDeltaExtensions = true;
                // wait for _initialize to finish before hanlding any delta extension events
                await this._installedExtensionsReady.wait();
                lock = await this._registry.acquireLock('handleDeltaExtensions');
                while (this._deltaExtensionsQueue.length > 0) {
                    const item = this._deltaExtensionsQueue.shift();
                    await this._deltaExtensions(lock, item.toAdd, item.toRemove);
                }
            }
            finally {
                this._inHandleDeltaExtensions = false;
                lock?.dispose();
            }
        }
        async _deltaExtensions(lock, _toAdd, _toRemove) {
            if (platform_1.isCI) {
                this._logService.info(`AbstractExtensionService._deltaExtensions: toAdd: [${_toAdd.map(e => e.identifier.id).join(',')}] toRemove: [${_toRemove.map(e => typeof e === 'string' ? e : e.identifier.id).join(',')}]`);
            }
            let toRemove = [];
            for (let i = 0, len = _toRemove.length; i < len; i++) {
                const extensionOrId = _toRemove[i];
                const extensionId = (typeof extensionOrId === 'string' ? extensionOrId : extensionOrId.identifier.id);
                const extension = (typeof extensionOrId === 'string' ? null : extensionOrId);
                const extensionDescription = this._registry.getExtensionDescription(extensionId);
                if (!extensionDescription) {
                    // ignore disabling/uninstalling an extension which is not running
                    continue;
                }
                if (extension && extensionDescription.extensionLocation.scheme !== extension.location.scheme) {
                    // this event is for a different extension than mine (maybe for the local extension, while I have the remote extension)
                    continue;
                }
                if (!this.canRemoveExtension(extensionDescription)) {
                    // uses non-dynamic extension point or is activated
                    continue;
                }
                toRemove.push(extensionDescription);
            }
            const toAdd = [];
            for (let i = 0, len = _toAdd.length; i < len; i++) {
                const extension = _toAdd[i];
                const extensionDescription = await this._scanSingleExtension(extension);
                if (!extensionDescription) {
                    // could not scan extension...
                    continue;
                }
                if (!this._canAddExtension(extensionDescription, toRemove)) {
                    continue;
                }
                toAdd.push(extensionDescription);
            }
            if (toAdd.length === 0 && toRemove.length === 0) {
                return;
            }
            // Update the local registry
            const result = this._registry.deltaExtensions(lock, toAdd, toRemove.map(e => e.identifier));
            this._onDidChangeExtensions.fire({ added: toAdd, removed: toRemove });
            toRemove = toRemove.concat(result.removedDueToLooping);
            if (result.removedDueToLooping.length > 0) {
                this._notificationService.notify({
                    severity: notification_1.Severity.Error,
                    message: nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', '))
                });
            }
            // enable or disable proposed API per extension
            this._extensionsProposedApi.updateEnabledApiProposals(toAdd);
            // Update extension points
            this._doHandleExtensionPoints([].concat(toAdd).concat(toRemove));
            // Update the extension host
            await this._updateExtensionsOnExtHosts(result.versionId, toAdd, toRemove.map(e => e.identifier));
            for (let i = 0; i < toAdd.length; i++) {
                this._activateAddedExtensionIfNeeded(toAdd[i]);
            }
        }
        async _updateExtensionsOnExtHosts(versionId, toAdd, toRemove) {
            const removedRunningLocation = this._runningLocations.deltaExtensions(toAdd, toRemove);
            const promises = this._extensionHostManagers.map(extHostManager => this._updateExtensionsOnExtHost(extHostManager, versionId, toAdd, toRemove, removedRunningLocation));
            await Promise.all(promises);
        }
        async _updateExtensionsOnExtHost(extensionHostManager, versionId, toAdd, toRemove, removedRunningLocation) {
            const myToAdd = this._runningLocations.filterByExtensionHostManager(toAdd, extensionHostManager);
            const myToRemove = (0, extensionRunningLocationTracker_1.filterExtensionIdentifiers)(toRemove, removedRunningLocation, extRunningLocation => extensionHostManager.representsRunningLocation(extRunningLocation));
            const addActivationEvents = implicitActivationEvents_1.ImplicitActivationEvents.createActivationEventsMap(toAdd);
            if (platform_1.isCI) {
                const printExtIds = (extensions) => extensions.map(e => e.identifier.value).join(',');
                const printIds = (extensions) => extensions.map(e => e.value).join(',');
                this._logService.info(`AbstractExtensionService: Calling deltaExtensions: toRemove: [${printIds(toRemove)}], toAdd: [${printExtIds(toAdd)}], myToRemove: [${printIds(myToRemove)}], myToAdd: [${printExtIds(myToAdd)}],`);
            }
            await extensionHostManager.deltaExtensions({ versionId, toRemove, toAdd, addActivationEvents, myToRemove, myToAdd: myToAdd.map(extension => extension.identifier) });
        }
        canAddExtension(extension) {
            return this._canAddExtension(extension, []);
        }
        _canAddExtension(extension, extensionsBeingRemoved) {
            // (Also check for renamed extensions)
            const existing = this._registry.getExtensionDescriptionByIdOrUUID(extension.identifier, extension.id);
            if (existing) {
                // This extension is already known (most likely at a different version)
                // so it cannot be added again unless it is removed first
                const isBeingRemoved = extensionsBeingRemoved.some((extensionDescription) => extensions_1.ExtensionIdentifier.equals(extension.identifier, extensionDescription.identifier));
                if (!isBeingRemoved) {
                    return false;
                }
            }
            const extensionKinds = this._runningLocations.readExtensionKinds(extension);
            const isRemote = extension.extensionLocation.scheme === network_1.Schemas.vscodeRemote;
            const extensionHostKind = this._extensionHostKindPicker.pickExtensionHostKind(extension.identifier, extensionKinds, !isRemote, isRemote, 0 /* ExtensionRunningPreference.None */);
            if (extensionHostKind === null) {
                return false;
            }
            return true;
        }
        canRemoveExtension(extension) {
            const extensionDescription = this._registry.getExtensionDescription(extension.identifier);
            if (!extensionDescription) {
                // Can't remove an extension that is unknown!
                return false;
            }
            if (this._extensionStatus.get(extensionDescription.identifier)?.activationStarted) {
                // Extension is running, cannot remove it safely
                return false;
            }
            return true;
        }
        async _activateAddedExtensionIfNeeded(extensionDescription) {
            let shouldActivate = false;
            let shouldActivateReason = null;
            let hasWorkspaceContains = false;
            const activationEvents = this._activationEventReader.readActivationEvents(extensionDescription);
            for (const activationEvent of activationEvents) {
                if (this._allRequestedActivateEvents.has(activationEvent)) {
                    // This activation event was fired before the extension was added
                    shouldActivate = true;
                    shouldActivateReason = activationEvent;
                    break;
                }
                if (activationEvent === '*') {
                    shouldActivate = true;
                    shouldActivateReason = activationEvent;
                    break;
                }
                if (/^workspaceContains/.test(activationEvent)) {
                    hasWorkspaceContains = true;
                }
                if (activationEvent === 'onStartupFinished') {
                    shouldActivate = true;
                    shouldActivateReason = activationEvent;
                    break;
                }
            }
            if (shouldActivate) {
                await Promise.all(this._extensionHostManagers.map(extHostManager => extHostManager.activate(extensionDescription.identifier, { startup: false, extensionId: extensionDescription.identifier, activationEvent: shouldActivateReason }))).then(() => { });
            }
            else if (hasWorkspaceContains) {
                const workspace = await this._contextService.getCompleteWorkspace();
                const forceUsingSearch = !!this._environmentService.remoteAuthority;
                const host = {
                    logService: this._logService,
                    folders: workspace.folders.map(folder => folder.uri),
                    forceUsingSearch: forceUsingSearch,
                    exists: (uri) => this._fileService.exists(uri),
                    checkExists: (folders, includes, token) => this._instantiationService.invokeFunction((accessor) => (0, workspaceContains_1.checkGlobFileExists)(accessor, folders, includes, token))
                };
                const result = await (0, workspaceContains_1.checkActivateWorkspaceContainsExtension)(host, extensionDescription);
                if (!result) {
                    return;
                }
                await Promise.all(this._extensionHostManagers.map(extHostManager => extHostManager.activate(extensionDescription.identifier, { startup: false, extensionId: extensionDescription.identifier, activationEvent: result.activationEvent }))).then(() => { });
            }
        }
        //#endregion
        async _initialize() {
            perf.mark('code/willLoadExtensions');
            this._startExtensionHostsIfNecessary(true, []);
            const lock = await this._registry.acquireLock('_initialize');
            try {
                const resolvedExtensions = await this._resolveExtensions();
                this._processExtensions(lock, resolvedExtensions);
                // Start extension hosts which are not automatically started
                const snapshot = this._registry.getSnapshot();
                for (const extHostManager of this._extensionHostManagers) {
                    if (extHostManager.startup !== 1 /* ExtensionHostStartup.EagerAutoStart */) {
                        const extensions = this._runningLocations.filterByExtensionHostManager(snapshot.extensions, extHostManager);
                        extHostManager.start(snapshot.versionId, snapshot.extensions, extensions.map(extension => extension.identifier));
                    }
                }
            }
            finally {
                lock.dispose();
            }
            this._releaseBarrier();
            perf.mark('code/didLoadExtensions');
            await this._handleExtensionTests();
        }
        _processExtensions(lock, resolvedExtensions) {
            const { allowRemoteExtensionsInLocalWebWorker, hasLocalProcess } = resolvedExtensions;
            const localExtensions = checkEnabledAndProposedAPI(this._logService, this._extensionEnablementService, this._extensionsProposedApi, resolvedExtensions.local, false);
            let remoteExtensions = checkEnabledAndProposedAPI(this._logService, this._extensionEnablementService, this._extensionsProposedApi, resolvedExtensions.remote, false);
            // `initializeRunningLocation` will look at the complete picture (e.g. an extension installed on both sides),
            // takes care of duplicates and picks a running location for each extension
            this._runningLocations.initializeRunningLocation(localExtensions, remoteExtensions);
            this._startExtensionHostsIfNecessary(true, []);
            // Some remote extensions could run locally in the web worker, so store them
            const remoteExtensionsThatNeedToRunLocally = (allowRemoteExtensionsInLocalWebWorker ? this._runningLocations.filterByExtensionHostKind(remoteExtensions, 2 /* ExtensionHostKind.LocalWebWorker */) : []);
            const localProcessExtensions = (hasLocalProcess ? this._runningLocations.filterByExtensionHostKind(localExtensions, 1 /* ExtensionHostKind.LocalProcess */) : []);
            const localWebWorkerExtensions = this._runningLocations.filterByExtensionHostKind(localExtensions, 2 /* ExtensionHostKind.LocalWebWorker */);
            remoteExtensions = this._runningLocations.filterByExtensionHostKind(remoteExtensions, 3 /* ExtensionHostKind.Remote */);
            // Add locally the remote extensions that need to run locally in the web worker
            for (const ext of remoteExtensionsThatNeedToRunLocally) {
                if (!includes(localWebWorkerExtensions, ext.identifier)) {
                    localWebWorkerExtensions.push(ext);
                }
            }
            const allExtensions = remoteExtensions.concat(localProcessExtensions).concat(localWebWorkerExtensions);
            const result = this._registry.deltaExtensions(lock, allExtensions, []);
            if (result.removedDueToLooping.length > 0) {
                this._notificationService.notify({
                    severity: notification_1.Severity.Error,
                    message: nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', '))
                });
            }
            this._doHandleExtensionPoints(this._registry.getAllExtensionDescriptions());
        }
        async _handleExtensionTests() {
            if (!this._environmentService.isExtensionDevelopment || !this._environmentService.extensionTestsLocationURI) {
                return;
            }
            const extensionHostManager = this.findTestExtensionHost(this._environmentService.extensionTestsLocationURI);
            if (!extensionHostManager) {
                const msg = nls.localize('extensionTestError', "No extension host found that can launch the test runner at {0}.", this._environmentService.extensionTestsLocationURI.toString());
                console.error(msg);
                this._notificationService.error(msg);
                return;
            }
            let exitCode;
            try {
                exitCode = await extensionHostManager.extensionTestsExecute();
                if (platform_1.isCI) {
                    this._logService.info(`Extension host test runner exit code: ${exitCode}`);
                }
            }
            catch (err) {
                if (platform_1.isCI) {
                    this._logService.error(`Extension host test runner error`, err);
                }
                console.error(err);
                exitCode = 1 /* ERROR */;
            }
            this._onExtensionHostExit(exitCode);
        }
        findTestExtensionHost(testLocation) {
            let runningLocation = null;
            for (const extension of this._registry.getAllExtensionDescriptions()) {
                if ((0, resources_1.isEqualOrParent)(testLocation, extension.extensionLocation)) {
                    runningLocation = this._runningLocations.getRunningLocation(extension.identifier);
                    break;
                }
            }
            if (runningLocation === null) {
                // not sure if we should support that, but it was possible to have an test outside an extension
                if (testLocation.scheme === network_1.Schemas.vscodeRemote) {
                    runningLocation = new extensionRunningLocation_1.RemoteRunningLocation();
                }
                else {
                    // When a debugger attaches to the extension host, it will surface all console.log messages from the extension host,
                    // but not necessarily from the window. So it would be best if any errors get printed to the console of the extension host.
                    // That is why here we use the local process extension host even for non-file URIs
                    runningLocation = new extensionRunningLocation_1.LocalProcessRunningLocation(0);
                }
            }
            if (runningLocation !== null) {
                return this._getExtensionHostManagerByRunningLocation(runningLocation);
            }
            return null;
        }
        _releaseBarrier() {
            this._installedExtensionsReady.open();
            this._onDidRegisterExtensions.fire(undefined);
            this._onDidChangeExtensionsStatus.fire(this._registry.getAllExtensionDescriptions().map(e => e.identifier));
        }
        //#region remote authority resolving
        async _resolveAuthorityInitial(remoteAuthority) {
            const MAX_ATTEMPTS = 5;
            for (let attempt = 1;; attempt++) {
                try {
                    return this._resolveAuthorityWithLogging(remoteAuthority);
                }
                catch (err) {
                    if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isNoResolverFound(err)) {
                        // There is no point in retrying if there is no resolver found
                        throw err;
                    }
                    if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isNotAvailable(err)) {
                        // The resolver is not available and asked us to not retry
                        throw err;
                    }
                    if (attempt >= MAX_ATTEMPTS) {
                        // Too many failed attempts, give up
                        throw err;
                    }
                }
            }
        }
        async _resolveAuthorityAgain() {
            const remoteAuthority = this._environmentService.remoteAuthority;
            if (!remoteAuthority) {
                return;
            }
            this._remoteAuthorityResolverService._clearResolvedAuthority(remoteAuthority);
            try {
                const result = await this._resolveAuthorityWithLogging(remoteAuthority);
                this._remoteAuthorityResolverService._setResolvedAuthority(result.authority, result.options);
            }
            catch (err) {
                this._remoteAuthorityResolverService._setResolvedAuthorityError(remoteAuthority, err);
            }
        }
        async _resolveAuthorityWithLogging(remoteAuthority) {
            const authorityPrefix = (0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority);
            const sw = stopwatch_1.StopWatch.create(false);
            this._logService.info(`Invoking resolveAuthority(${authorityPrefix})...`);
            try {
                perf.mark(`code/willResolveAuthority/${authorityPrefix}`);
                const result = await this._resolveAuthority(remoteAuthority);
                perf.mark(`code/didResolveAuthorityOK/${authorityPrefix}`);
                this._logService.info(`resolveAuthority(${authorityPrefix}) returned '${result.authority.connectTo}' after ${sw.elapsed()} ms`);
                return result;
            }
            catch (err) {
                perf.mark(`code/didResolveAuthorityError/${authorityPrefix}`);
                this._logService.error(`resolveAuthority(${authorityPrefix}) returned an error after ${sw.elapsed()} ms`, err);
                throw err;
            }
        }
        async _resolveAuthorityOnExtensionHosts(kind, remoteAuthority) {
            const extensionHosts = this._getExtensionHostManagers(kind);
            if (extensionHosts.length === 0) {
                // no local process extension hosts
                throw new Error(`Cannot resolve authority`);
            }
            this._resolveAuthorityAttempt++;
            const results = await Promise.all(extensionHosts.map(extHost => extHost.resolveAuthority(remoteAuthority, this._resolveAuthorityAttempt)));
            let bestErrorResult = null;
            for (const result of results) {
                if (result.type === 'ok') {
                    return result.value;
                }
                if (!bestErrorResult) {
                    bestErrorResult = result;
                    continue;
                }
                const bestErrorIsUnknown = (bestErrorResult.error.code === remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown);
                const errorIsUnknown = (result.error.code === remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown);
                if (bestErrorIsUnknown && !errorIsUnknown) {
                    bestErrorResult = result;
                }
            }
            // we can only reach this if there is an error
            throw new remoteAuthorityResolver_1.RemoteAuthorityResolverError(bestErrorResult.error.message, bestErrorResult.error.code, bestErrorResult.error.detail);
        }
        //#endregion
        //#region Stopping / Starting / Restarting
        stopExtensionHosts(reason) {
            return this._doStopExtensionHostsWithVeto(reason);
        }
        _doStopExtensionHosts() {
            const previouslyActivatedExtensionIds = [];
            for (const extensionStatus of this._extensionStatus.values()) {
                if (extensionStatus.activationStarted) {
                    previouslyActivatedExtensionIds.push(extensionStatus.id);
                }
            }
            // See https://github.com/microsoft/vscode/issues/152204
            // Dispose extension hosts in reverse creation order because the local extension host
            // might be critical in sustaining a connection to the remote extension host
            for (let i = this._extensionHostManagers.length - 1; i >= 0; i--) {
                this._extensionHostManagers[i].dispose();
            }
            this._extensionHostManagers = [];
            for (const extensionStatus of this._extensionStatus.values()) {
                extensionStatus.clearRuntimeStatus();
            }
            if (previouslyActivatedExtensionIds.length > 0) {
                this._onDidChangeExtensionsStatus.fire(previouslyActivatedExtensionIds);
            }
        }
        async _doStopExtensionHostsWithVeto(reason) {
            const vetos = [];
            const vetoReasons = new Set();
            this._onWillStop.fire({
                reason,
                veto(value, reason) {
                    vetos.push(value);
                    if (typeof value === 'boolean') {
                        if (value === true) {
                            vetoReasons.add(reason);
                        }
                    }
                    else {
                        value.then(value => {
                            if (value) {
                                vetoReasons.add(reason);
                            }
                        }).catch(error => {
                            vetoReasons.add(nls.localize('extensionStopVetoError', "{0} (Error: {1})", reason, (0, errorMessage_1.toErrorMessage)(error)));
                        });
                    }
                }
            });
            const veto = await (0, lifecycle_2.handleVetos)(vetos, error => this._logService.error(error));
            if (!veto) {
                this._doStopExtensionHosts();
            }
            else {
                const vetoReasonsArray = Array.from(vetoReasons);
                this._logService.warn(`Extension host was not stopped because of veto (stop reason: ${reason}, veto reason: ${vetoReasonsArray.join(', ')})`);
                await this._dialogService.warn(nls.localize('extensionStopVetoMessage', "The following operation was blocked: {0}", reason), vetoReasonsArray.length === 1 ?
                    nls.localize('extensionStopVetoDetailsOne', "The reason for blocking the operation: {0}", vetoReasonsArray[0]) :
                    nls.localize('extensionStopVetoDetailsMany', "The reasons for blocking the operation:\n- {0}", vetoReasonsArray.join('\n -')));
            }
            return !veto;
        }
        _startExtensionHostsIfNecessary(isInitialStart, initialActivationEvents) {
            const locations = [];
            for (let affinity = 0; affinity <= this._runningLocations.maxLocalProcessAffinity; affinity++) {
                locations.push(new extensionRunningLocation_1.LocalProcessRunningLocation(affinity));
            }
            for (let affinity = 0; affinity <= this._runningLocations.maxLocalWebWorkerAffinity; affinity++) {
                locations.push(new extensionRunningLocation_1.LocalWebWorkerRunningLocation(affinity));
            }
            locations.push(new extensionRunningLocation_1.RemoteRunningLocation());
            for (const location of locations) {
                if (this._getExtensionHostManagerByRunningLocation(location)) {
                    // already running
                    continue;
                }
                const extHostManager = this._createExtensionHostManager(location, isInitialStart, initialActivationEvents);
                if (extHostManager) {
                    this._extensionHostManagers.push(extHostManager);
                }
            }
        }
        _createExtensionHostManager(runningLocation, isInitialStart, initialActivationEvents) {
            const extensionHost = this._extensionHostFactory.createExtensionHost(this._runningLocations, runningLocation, isInitialStart);
            if (!extensionHost) {
                return null;
            }
            const processManager = this._doCreateExtensionHostManager(extensionHost, initialActivationEvents);
            processManager.onDidExit(([code, signal]) => this._onExtensionHostCrashOrExit(processManager, code, signal));
            processManager.onDidChangeResponsiveState((responsiveState) => {
                this._logService.info(`Extension host (${processManager.friendyName}) is ${responsiveState === 0 /* ResponsiveState.Responsive */ ? 'responsive' : 'unresponsive'}.`);
                this._onDidChangeResponsiveChange.fire({
                    extensionHostKind: processManager.kind,
                    isResponsive: responsiveState === 0 /* ResponsiveState.Responsive */,
                    getInspectListener: (tryEnableInspector) => {
                        return processManager.getInspectPort(tryEnableInspector);
                    }
                });
            });
            return processManager;
        }
        _doCreateExtensionHostManager(extensionHost, initialActivationEvents) {
            const internalExtensionService = this._acquireInternalAPI(extensionHost);
            if (extensionHost.startup === 3 /* ExtensionHostStartup.Lazy */ && initialActivationEvents.length === 0) {
                return this._instantiationService.createInstance(lazyCreateExtensionHostManager_1.LazyCreateExtensionHostManager, extensionHost, internalExtensionService);
            }
            return this._instantiationService.createInstance(extensionHostManager_1.ExtensionHostManager, extensionHost, initialActivationEvents, internalExtensionService);
        }
        _onExtensionHostCrashOrExit(extensionHost, code, signal) {
            // Unexpected termination
            const isExtensionDevHost = (0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService).isExtensionDevHost;
            if (!isExtensionDevHost) {
                this._onExtensionHostCrashed(extensionHost, code, signal);
                return;
            }
            this._onExtensionHostExit(code);
        }
        _onExtensionHostCrashed(extensionHost, code, signal) {
            console.error(`Extension host (${extensionHost.friendyName}) terminated unexpectedly. Code: ${code}, Signal: ${signal}`);
            if (extensionHost.kind === 1 /* ExtensionHostKind.LocalProcess */) {
                this._doStopExtensionHosts();
            }
            else if (extensionHost.kind === 3 /* ExtensionHostKind.Remote */) {
                if (signal) {
                    this._onRemoteExtensionHostCrashed(extensionHost, signal);
                }
                for (let i = 0; i < this._extensionHostManagers.length; i++) {
                    if (this._extensionHostManagers[i] === extensionHost) {
                        this._extensionHostManagers[i].dispose();
                        this._extensionHostManagers.splice(i, 1);
                        break;
                    }
                }
            }
        }
        _getExtensionHostExitInfoWithTimeout(reconnectionToken) {
            return new Promise((resolve, reject) => {
                const timeoutHandle = setTimeout(() => {
                    reject(new Error('getExtensionHostExitInfo timed out'));
                }, 2000);
                this._remoteAgentService.getExtensionHostExitInfo(reconnectionToken).then((r) => {
                    clearTimeout(timeoutHandle);
                    resolve(r);
                }, reject);
            });
        }
        async _onRemoteExtensionHostCrashed(extensionHost, reconnectionToken) {
            try {
                const info = await this._getExtensionHostExitInfoWithTimeout(reconnectionToken);
                if (info) {
                    this._logService.error(`Extension host (${extensionHost.friendyName}) terminated unexpectedly with code ${info.code}.`);
                }
                this._logExtensionHostCrash(extensionHost);
                this._remoteCrashTracker.registerCrash();
                if (this._remoteCrashTracker.shouldAutomaticallyRestart()) {
                    this._logService.info(`Automatically restarting the remote extension host.`);
                    this._notificationService.status(nls.localize('extensionService.autoRestart', "The remote extension host terminated unexpectedly. Restarting..."), { hideAfter: 5000 });
                    this._startExtensionHostsIfNecessary(false, Array.from(this._allRequestedActivateEvents.keys()));
                }
                else {
                    this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.crash', "Remote Extension host terminated unexpectedly 3 times within the last 5 minutes."), [{
                            label: nls.localize('restart', "Restart Remote Extension Host"),
                            run: () => {
                                this._startExtensionHostsIfNecessary(false, Array.from(this._allRequestedActivateEvents.keys()));
                            }
                        }]);
                }
            }
            catch (err) {
                // maybe this wasn't an extension host crash and it was a permanent disconnection
            }
        }
        _logExtensionHostCrash(extensionHost) {
            const activatedExtensions = [];
            for (const extensionStatus of this._extensionStatus.values()) {
                if (extensionStatus.activationStarted && extensionHost.containsExtension(extensionStatus.id)) {
                    activatedExtensions.push(extensionStatus.id);
                }
            }
            if (activatedExtensions.length > 0) {
                this._logService.error(`Extension host (${extensionHost.friendyName}) terminated unexpectedly. The following extensions were running: ${activatedExtensions.map(id => id.value).join(', ')}`);
            }
            else {
                this._logService.error(`Extension host (${extensionHost.friendyName}) terminated unexpectedly. No extensions were activated.`);
            }
        }
        async startExtensionHosts(updates) {
            this._doStopExtensionHosts();
            if (updates) {
                await this._handleDeltaExtensions(new DeltaExtensionsQueueItem(updates.toAdd, updates.toRemove));
            }
            const lock = await this._registry.acquireLock('startExtensionHosts');
            try {
                this._startExtensionHostsIfNecessary(false, Array.from(this._allRequestedActivateEvents.keys()));
                const localProcessExtensionHosts = this._getExtensionHostManagers(1 /* ExtensionHostKind.LocalProcess */);
                await Promise.all(localProcessExtensionHosts.map(extHost => extHost.ready()));
            }
            finally {
                lock.dispose();
            }
        }
        //#endregion
        //#region IExtensionService
        activateByEvent(activationEvent, activationKind = 0 /* ActivationKind.Normal */) {
            if (this._installedExtensionsReady.isOpen()) {
                // Extensions have been scanned and interpreted
                // Record the fact that this activationEvent was requested (in case of a restart)
                this._allRequestedActivateEvents.add(activationEvent);
                if (!this._registry.containsActivationEvent(activationEvent)) {
                    // There is no extension that is interested in this activation event
                    return NO_OP_VOID_PROMISE;
                }
                return this._activateByEvent(activationEvent, activationKind);
            }
            else {
                // Extensions have not been scanned yet.
                // Record the fact that this activationEvent was requested (in case of a restart)
                this._allRequestedActivateEvents.add(activationEvent);
                if (activationKind === 1 /* ActivationKind.Immediate */) {
                    // Do not wait for the normal start-up of the extension host(s)
                    return this._activateByEvent(activationEvent, activationKind);
                }
                return this._installedExtensionsReady.wait().then(() => this._activateByEvent(activationEvent, activationKind));
            }
        }
        _activateByEvent(activationEvent, activationKind) {
            const result = Promise.all(this._extensionHostManagers.map(extHostManager => extHostManager.activateByEvent(activationEvent, activationKind))).then(() => { });
            this._onWillActivateByEvent.fire({
                event: activationEvent,
                activation: result
            });
            return result;
        }
        activateById(extensionId, reason) {
            return this._activateById(extensionId, reason);
        }
        activationEventIsDone(activationEvent) {
            if (!this._installedExtensionsReady.isOpen()) {
                return false;
            }
            if (!this._registry.containsActivationEvent(activationEvent)) {
                // There is no extension that is interested in this activation event
                return true;
            }
            return this._extensionHostManagers.every(manager => manager.activationEventIsDone(activationEvent));
        }
        whenInstalledExtensionsRegistered() {
            return this._installedExtensionsReady.wait();
        }
        get extensions() {
            return this._registry.getAllExtensionDescriptions();
        }
        _getExtensionRegistrySnapshotWhenReady() {
            return this._installedExtensionsReady.wait().then(() => this._registry.getSnapshot());
        }
        getExtension(id) {
            return this._installedExtensionsReady.wait().then(() => {
                return this._registry.getExtensionDescription(id);
            });
        }
        readExtensionPointContributions(extPoint) {
            return this._installedExtensionsReady.wait().then(() => {
                const availableExtensions = this._registry.getAllExtensionDescriptions();
                const result = [];
                for (const desc of availableExtensions) {
                    if (desc.contributes && hasOwnProperty.call(desc.contributes, extPoint.name)) {
                        result.push(new extensions_2.ExtensionPointContribution(desc, desc.contributes[extPoint.name]));
                    }
                }
                return result;
            });
        }
        getExtensionsStatus() {
            const result = Object.create(null);
            if (this._registry) {
                const extensions = this._registry.getAllExtensionDescriptions();
                for (const extension of extensions) {
                    const extensionStatus = this._extensionStatus.get(extension.identifier);
                    result[extension.identifier.value] = {
                        id: extension.identifier,
                        messages: extensionStatus?.messages ?? [],
                        activationStarted: extensionStatus?.activationStarted ?? false,
                        activationTimes: extensionStatus?.activationTimes ?? undefined,
                        runtimeErrors: extensionStatus?.runtimeErrors ?? [],
                        runningLocation: this._runningLocations.getRunningLocation(extension.identifier),
                    };
                }
            }
            return result;
        }
        async getInspectPorts(extensionHostKind, tryEnableInspector) {
            const result = await Promise.all(this._getExtensionHostManagers(extensionHostKind).map(extHost => extHost.getInspectPort(tryEnableInspector)));
            // remove 0s:
            return result.filter(types_1.isDefined);
        }
        async setRemoteEnvironment(env) {
            await this._extensionHostManagers
                .map(manager => manager.setRemoteEnvironment(env));
        }
        //#endregion
        // --- impl
        _safeInvokeIsEnabled(extension) {
            try {
                return this._extensionEnablementService.isEnabled(extension);
            }
            catch (err) {
                return false;
            }
        }
        _doHandleExtensionPoints(affectedExtensions) {
            const affectedExtensionPoints = Object.create(null);
            for (const extensionDescription of affectedExtensions) {
                if (extensionDescription.contributes) {
                    for (const extPointName in extensionDescription.contributes) {
                        if (hasOwnProperty.call(extensionDescription.contributes, extPointName)) {
                            affectedExtensionPoints[extPointName] = true;
                        }
                    }
                }
            }
            const messageHandler = (msg) => this._handleExtensionPointMessage(msg);
            const availableExtensions = this._registry.getAllExtensionDescriptions();
            const extensionPoints = extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints();
            perf.mark('code/willHandleExtensionPoints');
            for (const extensionPoint of extensionPoints) {
                if (affectedExtensionPoints[extensionPoint.name]) {
                    perf.mark(`code/willHandleExtensionPoint/${extensionPoint.name}`);
                    AbstractExtensionService_1._handleExtensionPoint(extensionPoint, availableExtensions, messageHandler);
                    perf.mark(`code/didHandleExtensionPoint/${extensionPoint.name}`);
                }
            }
            perf.mark('code/didHandleExtensionPoints');
        }
        _getOrCreateExtensionStatus(extensionId) {
            if (!this._extensionStatus.has(extensionId)) {
                this._extensionStatus.set(extensionId, new ExtensionStatus(extensionId));
            }
            return this._extensionStatus.get(extensionId);
        }
        _handleExtensionPointMessage(msg) {
            const extensionStatus = this._getOrCreateExtensionStatus(msg.extensionId);
            extensionStatus.addMessage(msg);
            const extension = this._registry.getExtensionDescription(msg.extensionId);
            const strMsg = `[${msg.extensionId.value}]: ${msg.message}`;
            if (msg.type === notification_1.Severity.Error) {
                if (extension && extension.isUnderDevelopment) {
                    // This message is about the extension currently being developed
                    this._notificationService.notify({ severity: notification_1.Severity.Error, message: strMsg });
                }
                this._logService.error(strMsg);
            }
            else if (msg.type === notification_1.Severity.Warning) {
                if (extension && extension.isUnderDevelopment) {
                    // This message is about the extension currently being developed
                    this._notificationService.notify({ severity: notification_1.Severity.Warning, message: strMsg });
                }
                this._logService.warn(strMsg);
            }
            else {
                this._logService.info(strMsg);
            }
            if (msg.extensionId && this._environmentService.isBuilt && !this._environmentService.isExtensionDevelopment) {
                const { type, extensionId, extensionPointId, message } = msg;
                this._telemetryService.publicLog2('extensionsMessage', {
                    type, extensionId: extensionId.value, extensionPointId, message
                });
            }
        }
        static _handleExtensionPoint(extensionPoint, availableExtensions, messageHandler) {
            const users = [];
            for (const desc of availableExtensions) {
                if (desc.contributes && hasOwnProperty.call(desc.contributes, extensionPoint.name)) {
                    users.push({
                        description: desc,
                        value: desc.contributes[extensionPoint.name],
                        collector: new extensionsRegistry_1.ExtensionMessageCollector(messageHandler, desc, extensionPoint.name)
                    });
                }
            }
            extensionPoint.acceptUsers(users);
        }
        //#region Called by extension host
        _acquireInternalAPI(extensionHost) {
            return {
                _activateById: (extensionId, reason) => {
                    return this._activateById(extensionId, reason);
                },
                _onWillActivateExtension: (extensionId) => {
                    return this._onWillActivateExtension(extensionId, extensionHost.runningLocation);
                },
                _onDidActivateExtension: (extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) => {
                    return this._onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason);
                },
                _onDidActivateExtensionError: (extensionId, error) => {
                    return this._onDidActivateExtensionError(extensionId, error);
                },
                _onExtensionRuntimeError: (extensionId, err) => {
                    return this._onExtensionRuntimeError(extensionId, err);
                }
            };
        }
        async _activateById(extensionId, reason) {
            const results = await Promise.all(this._extensionHostManagers.map(manager => manager.activate(extensionId, reason)));
            const activated = results.some(e => e);
            if (!activated) {
                throw new Error(`Unknown extension ${extensionId.value}`);
            }
        }
        _onWillActivateExtension(extensionId, runningLocation) {
            this._runningLocations.set(extensionId, runningLocation);
            const extensionStatus = this._getOrCreateExtensionStatus(extensionId);
            extensionStatus.onWillActivate();
        }
        _onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) {
            const extensionStatus = this._getOrCreateExtensionStatus(extensionId);
            extensionStatus.setActivationTimes(new extensions_2.ActivationTimes(codeLoadingTime, activateCallTime, activateResolvedTime, activationReason));
            this._onDidChangeExtensionsStatus.fire([extensionId]);
        }
        _onDidActivateExtensionError(extensionId, error) {
            this._telemetryService.publicLog2('extensionActivationError', {
                extensionId: extensionId.value,
                error: error.message
            });
        }
        _onExtensionRuntimeError(extensionId, err) {
            const extensionStatus = this._getOrCreateExtensionStatus(extensionId);
            extensionStatus.addRuntimeError(err);
            this._onDidChangeExtensionsStatus.fire([extensionId]);
        }
    };
    exports.AbstractExtensionService = AbstractExtensionService;
    exports.AbstractExtensionService = AbstractExtensionService = AbstractExtensionService_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, notification_1.INotificationService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(8, files_1.IFileService),
        __param(9, productService_1.IProductService),
        __param(10, extensionManagement_1.IWorkbenchExtensionManagementService),
        __param(11, workspace_1.IWorkspaceContextService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(14, log_1.ILogService),
        __param(15, remoteAgentService_1.IRemoteAgentService),
        __param(16, remoteExtensionsScanner_1.IRemoteExtensionsScannerService),
        __param(17, lifecycle_3.ILifecycleService),
        __param(18, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(19, dialogs_1.IDialogService)
    ], AbstractExtensionService);
    class ResolvedExtensions {
        constructor(local, remote, hasLocalProcess, allowRemoteExtensionsInLocalWebWorker) {
            this.local = local;
            this.remote = remote;
            this.hasLocalProcess = hasLocalProcess;
            this.allowRemoteExtensionsInLocalWebWorker = allowRemoteExtensionsInLocalWebWorker;
        }
    }
    exports.ResolvedExtensions = ResolvedExtensions;
    class DeltaExtensionsQueueItem {
        constructor(toAdd, toRemove) {
            this.toAdd = toAdd;
            this.toRemove = toRemove;
        }
    }
    /**
     * @argument extensions The extensions to be checked.
     * @argument ignoreWorkspaceTrust Do not take workspace trust into account.
     */
    function checkEnabledAndProposedAPI(logService, extensionEnablementService, extensionsProposedApi, extensions, ignoreWorkspaceTrust) {
        // enable or disable proposed API per extension
        extensionsProposedApi.updateEnabledApiProposals(extensions);
        // keep only enabled extensions
        return filterEnabledExtensions(logService, extensionEnablementService, extensions, ignoreWorkspaceTrust);
    }
    /**
     * Return the subset of extensions that are enabled.
     * @argument ignoreWorkspaceTrust Do not take workspace trust into account.
     */
    function filterEnabledExtensions(logService, extensionEnablementService, extensions, ignoreWorkspaceTrust) {
        const enabledExtensions = [], extensionsToCheck = [], mappedExtensions = [];
        for (const extension of extensions) {
            if (extension.isUnderDevelopment) {
                // Never disable extensions under development
                enabledExtensions.push(extension);
            }
            else {
                extensionsToCheck.push(extension);
                mappedExtensions.push((0, extensions_2.toExtension)(extension));
            }
        }
        const enablementStates = extensionEnablementService.getEnablementStates(mappedExtensions, ignoreWorkspaceTrust ? { trusted: true } : undefined);
        for (let index = 0; index < enablementStates.length; index++) {
            if (extensionEnablementService.isEnabledEnablementState(enablementStates[index])) {
                enabledExtensions.push(extensionsToCheck[index]);
            }
            else {
                if (platform_1.isCI) {
                    logService.info(`filterEnabledExtensions: extension '${extensionsToCheck[index].identifier.value}' is disabled`);
                }
            }
        }
        return enabledExtensions;
    }
    /**
     * @argument extension The extension to be checked.
     * @argument ignoreWorkspaceTrust Do not take workspace trust into account.
     */
    function extensionIsEnabled(logService, extensionEnablementService, extension, ignoreWorkspaceTrust) {
        return filterEnabledExtensions(logService, extensionEnablementService, [extension], ignoreWorkspaceTrust).includes(extension);
    }
    function includes(extensions, identifier) {
        for (const extension of extensions) {
            if (extensions_1.ExtensionIdentifier.equals(extension.identifier, identifier)) {
                return true;
            }
        }
        return false;
    }
    class ExtensionStatus {
        get messages() {
            return this._messages;
        }
        get activationTimes() {
            return this._activationTimes;
        }
        get runtimeErrors() {
            return this._runtimeErrors;
        }
        get activationStarted() {
            return this._activationStarted;
        }
        constructor(id) {
            this.id = id;
            this._messages = [];
            this._activationTimes = null;
            this._runtimeErrors = [];
            this._activationStarted = false;
        }
        clearRuntimeStatus() {
            this._activationStarted = false;
            this._activationTimes = null;
            this._runtimeErrors = [];
        }
        addMessage(msg) {
            this._messages.push(msg);
        }
        setActivationTimes(activationTimes) {
            this._activationTimes = activationTimes;
        }
        addRuntimeError(err) {
            this._runtimeErrors.push(err);
        }
        onWillActivate() {
            this._activationStarted = true;
        }
    }
    exports.ExtensionStatus = ExtensionStatus;
    class ExtensionHostCrashTracker {
        constructor() {
            this._recentCrashes = [];
        }
        static { this._TIME_LIMIT = 5 * 60 * 1000; } // 5 minutes
        static { this._CRASH_LIMIT = 3; }
        _removeOldCrashes() {
            const limit = Date.now() - ExtensionHostCrashTracker._TIME_LIMIT;
            while (this._recentCrashes.length > 0 && this._recentCrashes[0].timestamp < limit) {
                this._recentCrashes.shift();
            }
        }
        registerCrash() {
            this._removeOldCrashes();
            this._recentCrashes.push({ timestamp: Date.now() });
        }
        shouldAutomaticallyRestart() {
            this._removeOldCrashes();
            return (this._recentCrashes.length < ExtensionHostCrashTracker._CRASH_LIMIT);
        }
    }
    exports.ExtensionHostCrashTracker = ExtensionHostCrashTracker;
    /**
     * This can run correctly only on the renderer process because that is the only place
     * where all extension points and all implicit activation events generators are known.
     */
    class ImplicitActivationAwareReader {
        readActivationEvents(extensionDescription) {
            return implicitActivationEvents_1.ImplicitActivationEvents.readActivationEvents(extensionDescription);
        }
    }
    exports.ImplicitActivationAwareReader = ImplicitActivationAwareReader;
    class ActivationFeatureMarkdowneRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'markdown';
        }
        shouldRender(manifest) {
            return !!manifest.activationEvents;
        }
        render(manifest) {
            const activationEvents = manifest.activationEvents || [];
            const data = new htmlContent_1.MarkdownString();
            if (activationEvents.length) {
                for (const activationEvent of activationEvents) {
                    data.appendMarkdown(`- \`${activationEvent}\`\n`);
                }
            }
            return {
                data,
                dispose: () => { }
            };
        }
    }
    platform_2.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'activationEvents',
        label: nls.localize('activation', "Activation Events"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(ActivationFeatureMarkdowneRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RFeHRlbnNpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2Fic3RyYWN0RXh0ZW5zaW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaXNDaEcsZ0VBTUM7SUFNRCwwREF3QkM7SUFNRCxnREFFQztJQXhyQ0QsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQztJQUM3QyxNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQU8sU0FBUyxDQUFDLENBQUM7SUFFckQsSUFBZSx3QkFBd0IsZ0NBQXZDLE1BQWUsd0JBQXlCLFNBQVEsc0JBQVU7UUFxQ2hFLFlBQ2tCLHNCQUE2QyxFQUM3QyxxQkFBNEMsRUFDNUMsd0JBQWtELEVBQzVDLHFCQUErRCxFQUNoRSxvQkFBNkQsRUFDckQsbUJBQW9FLEVBQy9FLGlCQUF1RCxFQUNwQywyQkFBb0YsRUFDNUcsWUFBNkMsRUFDMUMsZUFBbUQsRUFDOUIsMkJBQW9GLEVBQ2hHLGVBQTBELEVBQzdELHFCQUE2RCxFQUMvQyxtQ0FBeUYsRUFDakgsV0FBMkMsRUFDbkMsbUJBQTJELEVBQy9DLCtCQUFtRixFQUNqRyxpQkFBcUQsRUFDdkMsK0JBQW1GLEVBQ3BHLGNBQStDO1lBRS9ELEtBQUssRUFBRSxDQUFDO1lBckJTLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBdUI7WUFDN0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1Qyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3pCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDN0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUNsQyx3QkFBbUIs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