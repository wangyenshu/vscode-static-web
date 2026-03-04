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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/actions/common/actions", "vs/nls", "vs/workbench/contrib/editSessions/common/editSessions", "vs/workbench/contrib/scm/common/scm", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/buffer", "vs/platform/configuration/common/configuration", "vs/platform/progress/common/progress", "vs/workbench/contrib/editSessions/browser/editSessionsStorageService", "vs/platform/instantiation/common/extensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/telemetry/common/telemetry", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/productService", "vs/platform/opener/common/opener", "vs/platform/environment/common/environment", "vs/workbench/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/workspace/common/virtualWorkspace", "vs/base/common/network", "vs/platform/contextkey/common/contextkeys", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/editSessions/common/editSessionsLogService", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/editSessions/browser/editSessionsViews", "vs/workbench/contrib/editSessions/browser/editSessionsFileSystemProvider", "vs/base/common/platform", "vs/workbench/common/contextkeys", "vs/base/common/cancellation", "vs/base/common/objects", "vs/platform/workspace/common/editSessions", "vs/base/common/themables", "vs/workbench/services/output/common/output", "vs/base/browser/hash", "vs/platform/storage/common/storage", "vs/workbench/services/activity/common/activity", "vs/workbench/services/editor/common/editorService", "vs/base/common/codicons", "vs/base/common/errors", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/editSessions/common/workspaceStateSync", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/request/common/request", "vs/workbench/contrib/editSessions/common/editSessionsStorageClient", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workspaces/common/workspaceIdentityService"], function (require, exports, lifecycle_1, contributions_1, platform_1, lifecycle_2, actions_1, nls_1, editSessions_1, scm_1, files_1, workspace_1, uri_1, resources_1, buffer_1, configuration_1, progress_1, editSessionsStorageService_1, extensions_1, userDataSync_1, telemetry_1, notification_1, dialogs_1, productService_1, opener_1, environment_1, configuration_2, configurationRegistry_1, quickInput_1, extensionsRegistry_1, contextkey_1, commands_1, virtualWorkspace_1, network_1, contextkeys_1, extensions_2, editSessionsLogService_1, views_1, viewsService_1, descriptors_1, viewPaneContainer_1, instantiation_1, editSessionsViews_1, editSessionsFileSystemProvider_1, platform_2, contextkeys_2, cancellation_1, objects_1, editSessions_2, themables_1, output_1, hash_1, storage_1, activity_1, editorService_1, codicons_1, errors_1, remoteAgentService_1, extensions_3, panecomposite_1, workspaceStateSync_1, userDataProfile_1, request_1, editSessionsStorageClient_1, uriIdentity_1, workspaceIdentityService_1) {
    "use strict";
    var EditSessionsContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionsContribution = void 0;
    (0, extensions_1.registerSingleton)(editSessions_1.IEditSessionsLogService, editSessionsLogService_1.EditSessionsLogService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(editSessions_1.IEditSessionsStorageService, editSessionsStorageService_1.EditSessionsWorkbenchService, 1 /* InstantiationType.Delayed */);
    const continueWorkingOnCommand = {
        id: '_workbench.editSessions.actions.continueEditSession',
        title: (0, nls_1.localize2)('continue working on', 'Continue Working On...'),
        precondition: contextkeys_2.WorkspaceFolderCountContext.notEqualsTo('0'),
        f1: true
    };
    const openLocalFolderCommand = {
        id: '_workbench.editSessions.actions.continueEditSession.openLocalFolder',
        title: (0, nls_1.localize2)('continue edit session in local folder', 'Open In Local Folder'),
        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
        precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsWebContext.toNegated(), contextkeys_2.VirtualWorkspaceContext)
    };
    const showOutputChannelCommand = {
        id: 'workbench.editSessions.actions.showOutputChannel',
        title: (0, nls_1.localize2)('show log', "Show Log"),
        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY
    };
    const installAdditionalContinueOnOptionsCommand = {
        id: 'workbench.action.continueOn.extensions',
        title: (0, nls_1.localize)('continueOn.installAdditional', 'Install additional development environment options'),
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({ ...installAdditionalContinueOnOptionsCommand, f1: false });
        }
        async run(accessor) {
            const paneCompositePartService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = await paneCompositePartService.openPaneComposite(extensions_3.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const view = viewlet?.getViewPaneContainer();
            view?.search('@tag:continueOn');
        }
    });
    const resumeProgressOptionsTitle = `[${(0, nls_1.localize)('resuming working changes window', 'Resuming working changes...')}](command:${showOutputChannelCommand.id})`;
    const resumeProgressOptions = {
        location: 10 /* ProgressLocation.Window */,
        type: 'syncing',
    };
    const queryParamName = 'editSessionId';
    const useEditSessionsWithContinueOn = 'workbench.editSessions.continueOn';
    let EditSessionsContribution = class EditSessionsContribution extends lifecycle_1.Disposable {
        static { EditSessionsContribution_1 = this; }
        static { this.APPLICATION_LAUNCHED_VIA_CONTINUE_ON_STORAGE_KEY = 'applicationLaunchedViaContinueOn'; }
        constructor(editSessionsStorageService, fileService, progressService, openerService, telemetryService, scmService, notificationService, dialogService, logService, environmentService, instantiationService, productService, configurationService, contextService, editSessionIdentityService, quickInputService, commandService, contextKeyService, fileDialogService, lifecycleService, storageService, activityService, editorService, remoteAgentService, extensionService, requestService, userDataProfilesService, uriIdentityService, workspaceIdentityService) {
            super();
            this.editSessionsStorageService = editSessionsStorageService;
            this.fileService = fileService;
            this.progressService = progressService;
            this.openerService = openerService;
            this.telemetryService = telemetryService;
            this.scmService = scmService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.productService = productService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.editSessionIdentityService = editSessionIdentityService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.contextKeyService = contextKeyService;
            this.fileDialogService = fileDialogService;
            this.lifecycleService = lifecycleService;
            this.storageService = storageService;
            this.activityService = activityService;
            this.editorService = editorService;
            this.remoteAgentService = remoteAgentService;
            this.extensionService = extensionService;
            this.requestService = requestService;
            this.userDataProfilesService = userDataProfilesService;
            this.uriIdentityService = uriIdentityService;
            this.workspaceIdentityService = workspaceIdentityService;
            this.continueEditSessionOptions = [];
            this.accountsMenuBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.registeredCommands = new Set();
            this.shouldShowViewsContext = editSessions_1.EDIT_SESSIONS_SHOW_VIEW.bindTo(this.contextKeyService);
            this.pendingEditSessionsContext = editSessions_1.EDIT_SESSIONS_PENDING.bindTo(this.contextKeyService);
            this.pendingEditSessionsContext.set(false);
            if (!this.productService['editSessions.store']?.url) {
                return;
            }
            this.editSessionsStorageClient = new editSessionsStorageClient_1.EditSessionsStoreClient(uri_1.URI.parse(this.productService['editSessions.store'].url), this.productService, this.requestService, this.logService, this.environmentService, this.fileService, this.storageService);
            this.editSessionsStorageService.storeClient = this.editSessionsStorageClient;
            this.workspaceStateSynchronizer = new workspaceStateSync_1.WorkspaceStateSynchroniser(this.userDataProfilesService.defaultProfile, undefined, this.editSessionsStorageClient, this.logService, this.fileService, this.environmentService, this.telemetryService, this.configurationService, this.storageService, this.uriIdentityService, this.workspaceIdentityService, this.editSessionsStorageService);
            this.autoResumeEditSession();
            this.registerActions();
            this.registerViews();
            this.registerContributedEditSessionOptions();
            this._register(this.fileService.registerProvider(editSessionsFileSystemProvider_1.EditSessionsFileSystemProvider.SCHEMA, new editSessionsFileSystemProvider_1.EditSessionsFileSystemProvider(this.editSessionsStorageService)));
            this.lifecycleService.onWillShutdown((e) => {
                if (e.reason !== 3 /* ShutdownReason.RELOAD */ && this.editSessionsStorageService.isSignedIn && this.configurationService.getValue('workbench.experimental.cloudChanges.autoStore') === 'onShutdown' && !platform_2.isWeb) {
                    e.join(this.autoStoreEditSession(), { id: 'autoStoreWorkingChanges', label: (0, nls_1.localize)('autoStoreWorkingChanges', 'Storing current working changes...') });
                }
            });
            this._register(this.editSessionsStorageService.onDidSignIn(() => this.updateAccountsMenuBadge()));
            this._register(this.editSessionsStorageService.onDidSignOut(() => this.updateAccountsMenuBadge()));
        }
        async autoResumeEditSession() {
            const shouldAutoResumeOnReload = this.configurationService.getValue('workbench.cloudChanges.autoResume') === 'onReload';
            if (this.environmentService.editSessionId !== undefined) {
                this.logService.info(`Resuming cloud changes, reason: found editSessionId ${this.environmentService.editSessionId} in environment service...`);
                await this.progressService.withProgress(resumeProgressOptions, async (progress) => await this.resumeEditSession(this.environmentService.editSessionId, undefined, undefined, undefined, progress).finally(() => this.environmentService.editSessionId = undefined));
            }
            else if (shouldAutoResumeOnReload && this.editSessionsStorageService.isSignedIn) {
                this.logService.info('Resuming cloud changes, reason: cloud changes enabled...');
                // Attempt to resume edit session based on edit workspace identifier
                // Note: at this point if the user is not signed into edit sessions,
                // we don't want them to be prompted to sign in and should just return early
                await this.progressService.withProgress(resumeProgressOptions, async (progress) => await this.resumeEditSession(undefined, true, undefined, undefined, progress));
            }
            else if (shouldAutoResumeOnReload) {
                // The application has previously launched via a protocol URL Continue On flow
                const hasApplicationLaunchedFromContinueOnFlow = this.storageService.getBoolean(EditSessionsContribution_1.APPLICATION_LAUNCHED_VIA_CONTINUE_ON_STORAGE_KEY, -1 /* StorageScope.APPLICATION */, false);
                this.logService.info(`Prompting to enable cloud changes, has application previously launched from Continue On flow: ${hasApplicationLaunchedFromContinueOnFlow}`);
                const handlePendingEditSessions = () => {
                    // display a badge in the accounts menu but do not prompt the user to sign in again
                    this.logService.info('Showing badge to enable cloud changes in accounts menu...');
                    this.updateAccountsMenuBadge();
                    this.pendingEditSessionsContext.set(true);
                    // attempt a resume if we are in a pending state and the user just signed in
                    const disposable = this.editSessionsStorageService.onDidSignIn(async () => {
                        disposable.dispose();
                        this.logService.info('Showing badge to enable cloud changes in accounts menu succeeded, resuming cloud changes...');
                        await this.progressService.withProgress(resumeProgressOptions, async (progress) => await this.resumeEditSession(undefined, true, undefined, undefined, progress));
                        this.storageService.remove(EditSessionsContribution_1.APPLICATION_LAUNCHED_VIA_CONTINUE_ON_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
                        this.environmentService.continueOn = undefined;
                    });
                };
                if ((this.environmentService.continueOn !== undefined) &&
                    !this.editSessionsStorageService.isSignedIn &&
                    // and user has not yet been prompted to sign in on this machine
                    hasApplicationLaunchedFromContinueOnFlow === false) {
                    // store the fact that we prompted the user
                    this.storageService.store(EditSessionsContribution_1.APPLICATION_LAUNCHED_VIA_CONTINUE_ON_STORAGE_KEY, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                    this.logService.info('Prompting to enable cloud changes...');
                    await this.editSessionsStorageService.initialize('read');
                    if (this.editSessionsStorageService.isSignedIn) {
                        this.logService.info('Prompting to enable cloud changes succeeded, resuming cloud changes...');
                        await this.progressService.withProgress(resumeProgressOptions, async (progress) => await this.resumeEditSession(undefined, true, undefined, undefined, progress));
                    }
                    else {
                        handlePendingEditSessions();
                    }
                }
                else if (!this.editSessionsStorageService.isSignedIn &&
                    // and user has been prompted to sign in on this machine
                    hasApplicationLaunchedFromContinueOnFlow === true) {
                    handlePendingEditSessions();
                }
            }
            else {
                this.logService.debug('Auto resuming cloud changes disabled.');
            }
        }
        updateAccountsMenuBadge() {
            if (this.editSessionsStorageService.isSignedIn) {
                return this.accountsMenuBadgeDisposable.clear();
            }
            const badge = new activity_1.NumberBadge(1, () => (0, nls_1.localize)('check for pending cloud changes', 'Check for pending cloud changes'));
            this.accountsMenuBadgeDisposable.value = this.activityService.showAccountsActivity({ badge });
        }
        async autoStoreEditSession() {
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            await this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                type: 'syncing',
                title: (0, nls_1.localize)('store working changes', 'Storing working changes...')
            }, async () => this.storeEditSession(false, cancellationTokenSource.token), () => {
                cancellationTokenSource.cancel();
                cancellationTokenSource.dispose();
            });
        }
        registerViews() {
            const container = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: editSessions_1.EDIT_SESSIONS_CONTAINER_ID,
                title: editSessions_1.EDIT_SESSIONS_TITLE,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [editSessions_1.EDIT_SESSIONS_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
                icon: editSessions_1.EDIT_SESSIONS_VIEW_ICON,
                hideIfEmpty: true
            }, 0 /* ViewContainerLocation.Sidebar */, { doNotRegisterOpenCommand: true });
            this._register(this.instantiationService.createInstance(editSessionsViews_1.EditSessionsDataViews, container));
        }
        registerActions() {
            this.registerContinueEditSessionAction();
            this.registerResumeLatestEditSessionAction();
            this.registerStoreLatestEditSessionAction();
            this.registerContinueInLocalFolderAction();
            this.registerShowEditSessionViewAction();
            this.registerShowEditSessionOutputChannelAction();
        }
        registerShowEditSessionOutputChannelAction() {
            this._register((0, actions_1.registerAction2)(class ShowEditSessionOutput extends actions_1.Action2 {
                constructor() {
                    super(showOutputChannelCommand);
                }
                run(accessor, ...args) {
                    const outputChannel = accessor.get(output_1.IOutputService);
                    void outputChannel.showChannel(editSessions_1.editSessionsLogId);
                }
            }));
        }
        registerShowEditSessionViewAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ShowEditSessionView extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.showEditSessions',
                        title: (0, nls_1.localize2)('show cloud changes', 'Show Cloud Changes'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        f1: true
                    });
                }
                async run(accessor) {
                    that.shouldShowViewsContext.set(true);
                    const viewsService = accessor.get(viewsService_1.IViewsService);
                    await viewsService.openView(editSessions_1.EDIT_SESSIONS_DATA_VIEW_ID);
                }
            }));
        }
        registerContinueEditSessionAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ContinueEditSessionAction extends actions_1.Action2 {
                constructor() {
                    super(continueWorkingOnCommand);
                }
                async run(accessor, workspaceUri, destination) {
                    // First ask the user to pick a destination, if necessary
                    let uri = workspaceUri;
                    if (!destination && !uri) {
                        destination = await that.pickContinueEditSessionDestination();
                        if (!destination) {
                            that.telemetryService.publicLog2('continueOn.editSessions.pick.outcome', { outcome: 'noSelection' });
                            return;
                        }
                    }
                    // Determine if we need to store an edit session, asking for edit session auth if necessary
                    const shouldStoreEditSession = await that.shouldContinueOnWithEditSession();
                    // Run the store action to get back a ref
                    let ref;
                    if (shouldStoreEditSession) {
                        that.telemetryService.publicLog2('continueOn.editSessions.store');
                        const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                        try {
                            ref = await that.progressService.withProgress({
                                location: 15 /* ProgressLocation.Notification */,
                                cancellable: true,
                                type: 'syncing',
                                title: (0, nls_1.localize)('store your working changes', 'Storing your working changes...')
                            }, async () => {
                                const ref = await that.storeEditSession(false, cancellationTokenSource.token);
                                if (ref !== undefined) {
                                    that.telemetryService.publicLog2('continueOn.editSessions.store.outcome', { outcome: 'storeSucceeded', hashedId: (0, editSessions_1.hashedEditSessionId)(ref) });
                                }
                                else {
                                    that.telemetryService.publicLog2('continueOn.editSessions.store.outcome', { outcome: 'storeSkipped' });
                                }
                                return ref;
                            }, () => {
                                cancellationTokenSource.cancel();
                                cancellationTokenSource.dispose();
                                that.telemetryService.publicLog2('continueOn.editSessions.store.outcome', { outcome: 'storeCancelledByUser' });
                            });
                        }
                        catch (ex) {
                            that.telemetryService.publicLog2('continueOn.editSessions.store.outcome', { outcome: 'storeFailed' });
                            throw ex;
                        }
                    }
                    // Append the ref to the URI
                    uri = destination ? await that.resolveDestination(destination) : uri;
                    if (uri === undefined) {
                        return;
                    }
                    if (ref !== undefined && uri !== 'noDestinationUri') {
                        const encodedRef = encodeURIComponent(ref);
                        uri = uri.with({
                            query: uri.query.length > 0 ? (uri.query + `&${queryParamName}=${encodedRef}&continueOn=1`) : `${queryParamName}=${encodedRef}&continueOn=1`
                        });
                        // Open the URI
                        that.logService.info(`Opening ${uri.toString()}`);
                        await that.openerService.open(uri, { openExternal: true });
                    }
                    else if (!shouldStoreEditSession && uri !== 'noDestinationUri') {
                        // Open the URI without an edit session ref
                        that.logService.info(`Opening ${uri.toString()}`);
                        await that.openerService.open(uri, { openExternal: true });
                    }
                    else if (ref === undefined && shouldStoreEditSession) {
                        that.logService.warn(`Failed to store working changes when invoking ${continueWorkingOnCommand.id}.`);
                    }
                }
            }));
        }
        registerResumeLatestEditSessionAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ResumeLatestEditSessionAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.resumeLatest',
                        title: (0, nls_1.localize2)('resume latest cloud changes', 'Resume Latest Changes from Cloud'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        f1: true,
                    });
                }
                async run(accessor, editSessionId, forceApplyUnrelatedChange) {
                    await that.progressService.withProgress({ ...resumeProgressOptions, title: resumeProgressOptionsTitle }, async () => await that.resumeEditSession(editSessionId, undefined, forceApplyUnrelatedChange));
                }
            }));
            this._register((0, actions_1.registerAction2)(class ResumeLatestEditSessionAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.resumeFromSerializedPayload',
                        title: (0, nls_1.localize2)('resume cloud changes', 'Resume Changes from Serialized Data'),
                        category: 'Developer',
                        f1: true,
                    });
                }
                async run(accessor, editSessionId) {
                    const data = await that.quickInputService.input({ prompt: 'Enter serialized data' });
                    if (data) {
                        that.editSessionsStorageService.lastReadResources.set('editSessions', { content: data, ref: '' });
                    }
                    await that.progressService.withProgress({ ...resumeProgressOptions, title: resumeProgressOptionsTitle }, async () => await that.resumeEditSession(editSessionId, undefined, undefined, undefined, undefined, data));
                }
            }));
        }
        registerStoreLatestEditSessionAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class StoreLatestEditSessionAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.storeCurrent',
                        title: (0, nls_1.localize2)('store working changes in cloud', 'Store Working Changes in Cloud'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        f1: true,
                    });
                }
                async run(accessor) {
                    const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                    await that.progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: (0, nls_1.localize)('storing working changes', 'Storing working changes...')
                    }, async () => {
                        that.telemetryService.publicLog2('editSessions.store');
                        await that.storeEditSession(true, cancellationTokenSource.token);
                    }, () => {
                        cancellationTokenSource.cancel();
                        cancellationTokenSource.dispose();
                    });
                }
            }));
        }
        async resumeEditSession(ref, silent, forceApplyUnrelatedChange, applyPartialMatch, progress, serializedData) {
            // Wait for the remote environment to become available, if any
            await this.remoteAgentService.getEnvironment();
            // Edit sessions are not currently supported in empty workspaces
            // https://github.com/microsoft/vscode/issues/159220
            if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return;
            }
            this.logService.info(ref !== undefined ? `Resuming changes from cloud with ref ${ref}...` : 'Checking for pending cloud changes...');
            if (silent && !(await this.editSessionsStorageService.initialize('read', true))) {
                return;
            }
            this.telemetryService.publicLog2('editSessions.resume');
            performance.mark('code/willResumeEditSessionFromIdentifier');
            progress?.report({ message: (0, nls_1.localize)('checkingForWorkingChanges', 'Checking for pending cloud changes...') });
            const data = serializedData ? { content: serializedData, ref: '' } : await this.editSessionsStorageService.read('editSessions', ref);
            if (!data) {
                if (ref === undefined && !silent) {
                    this.notificationService.info((0, nls_1.localize)('no cloud changes', 'There are no changes to resume from the cloud.'));
                }
                else if (ref !== undefined) {
                    this.notificationService.warn((0, nls_1.localize)('no cloud changes for ref', 'Could not resume changes from the cloud for ID {0}.', ref));
                }
                this.logService.info(ref !== undefined ? `Aborting resuming changes from cloud as no edit session content is available to be applied from ref ${ref}.` : `Aborting resuming edit session as no edit session content is available to be applied`);
                return;
            }
            progress?.report({ message: resumeProgressOptionsTitle });
            const editSession = JSON.parse(data.content);
            ref = data.ref;
            if (editSession.version > editSessions_1.EditSessionSchemaVersion) {
                this.notificationService.error((0, nls_1.localize)('client too old', "Please upgrade to a newer version of {0} to resume your working changes from the cloud.", this.productService.nameLong));
                this.telemetryService.publicLog2('editSessions.resume.outcome', { hashedId: (0, editSessions_1.hashedEditSessionId)(ref), outcome: 'clientUpdateNeeded' });
                return;
            }
            try {
                const { changes, conflictingChanges } = await this.generateChanges(editSession, ref, forceApplyUnrelatedChange, applyPartialMatch);
                if (changes.length === 0) {
                    return;
                }
                // TODO@joyceerhl Provide the option to diff files which would be overwritten by edit session contents
                if (conflictingChanges.length > 0) {
                    // Allow to show edit sessions
                    const { confirmed } = await this.dialogService.confirm({
                        type: notification_1.Severity.Warning,
                        message: conflictingChanges.length > 1 ?
                            (0, nls_1.localize)('resume edit session warning many', 'Resuming your working changes from the cloud will overwrite the following {0} files. Do you want to proceed?', conflictingChanges.length) :
                            (0, nls_1.localize)('resume edit session warning 1', 'Resuming your working changes from the cloud will overwrite {0}. Do you want to proceed?', (0, resources_1.basename)(conflictingChanges[0].uri)),
                        detail: conflictingChanges.length > 1 ? (0, dialogs_1.getFileNamesMessage)(conflictingChanges.map((c) => c.uri)) : undefined
                    });
                    if (!confirmed) {
                        return;
                    }
                }
                for (const { uri, type, contents } of changes) {
                    if (type === editSessions_1.ChangeType.Addition) {
                        await this.fileService.writeFile(uri, (0, editSessions_1.decodeEditSessionFileContent)(editSession.version, contents));
                    }
                    else if (type === editSessions_1.ChangeType.Deletion && await this.fileService.exists(uri)) {
                        await this.fileService.del(uri);
                    }
                }
                await this.workspaceStateSynchronizer?.apply(false, {});
                this.logService.info(`Deleting edit session with ref ${ref} after successfully applying it to current workspace...`);
                await this.editSessionsStorageService.delete('editSessions', ref);
                this.logService.info(`Deleted edit session with ref ${ref}.`);
                this.telemetryService.publicLog2('editSessions.resume.outcome', { hashedId: (0, editSessions_1.hashedEditSessionId)(ref), outcome: 'resumeSucceeded' });
            }
            catch (ex) {
                this.logService.error('Failed to resume edit session, reason: ', ex.toString());
                this.notificationService.error((0, nls_1.localize)('resume failed', "Failed to resume your working changes from the cloud."));
            }
            performance.mark('code/didResumeEditSessionFromIdentifier');
        }
        async generateChanges(editSession, ref, forceApplyUnrelatedChange = false, applyPartialMatch = false) {
            const changes = [];
            const conflictingChanges = [];
            const workspaceFolders = this.contextService.getWorkspace().folders;
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            for (const folder of editSession.folders) {
                let folderRoot;
                if (folder.canonicalIdentity) {
                    // Look for an edit session identifier that we can use
                    for (const f of workspaceFolders) {
                        const identity = await this.editSessionIdentityService.getEditSessionIdentifier(f, cancellationTokenSource.token);
                        this.logService.info(`Matching identity ${identity} against edit session folder identity ${folder.canonicalIdentity}...`);
                        if ((0, objects_1.equals)(identity, folder.canonicalIdentity) || forceApplyUnrelatedChange) {
                            folderRoot = f;
                            break;
                        }
                        if (identity !== undefined) {
                            const match = await this.editSessionIdentityService.provideEditSessionIdentityMatch(f, identity, folder.canonicalIdentity, cancellationTokenSource.token);
                            if (match === editSessions_2.EditSessionIdentityMatch.Complete) {
                                folderRoot = f;
                                break;
                            }
                            else if (match === editSessions_2.EditSessionIdentityMatch.Partial &&
                                this.configurationService.getValue('workbench.experimental.cloudChanges.partialMatches.enabled') === true) {
                                if (!applyPartialMatch) {
                                    // Surface partially matching edit session
                                    this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('editSessionPartialMatch', 'You have pending working changes in the cloud for this workspace. Would you like to resume them?'), [{ label: (0, nls_1.localize)('resume', 'Resume'), run: () => this.resumeEditSession(ref, false, undefined, true) }]);
                                }
                                else {
                                    folderRoot = f;
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    folderRoot = workspaceFolders.find((f) => f.name === folder.name);
                }
                if (!folderRoot) {
                    this.logService.info(`Skipping applying ${folder.workingChanges.length} changes from edit session with ref ${ref} as no matching workspace folder was found.`);
                    return { changes: [], conflictingChanges: [], contributedStateHandlers: [] };
                }
                const localChanges = new Set();
                for (const repository of this.scmService.repositories) {
                    if (repository.provider.rootUri !== undefined &&
                        this.contextService.getWorkspaceFolder(repository.provider.rootUri)?.name === folder.name) {
                        const repositoryChanges = this.getChangedResources(repository);
                        repositoryChanges.forEach((change) => localChanges.add(change.toString()));
                    }
                }
                for (const change of folder.workingChanges) {
                    const uri = (0, resources_1.joinPath)(folderRoot.uri, change.relativeFilePath);
                    changes.push({ uri, type: change.type, contents: change.contents });
                    if (await this.willChangeLocalContents(localChanges, uri, change)) {
                        conflictingChanges.push({ uri, type: change.type, contents: change.contents });
                    }
                }
            }
            return { changes, conflictingChanges };
        }
        async willChangeLocalContents(localChanges, uriWithIncomingChanges, incomingChange) {
            if (!localChanges.has(uriWithIncomingChanges.toString())) {
                return false;
            }
            const { contents, type } = incomingChange;
            switch (type) {
                case (editSessions_1.ChangeType.Addition): {
                    const [originalContents, incomingContents] = await Promise.all([(0, hash_1.sha1Hex)(contents), (0, hash_1.sha1Hex)((0, buffer_1.encodeBase64)((await this.fileService.readFile(uriWithIncomingChanges)).value))]);
                    return originalContents !== incomingContents;
                }
                case (editSessions_1.ChangeType.Deletion): {
                    return await this.fileService.exists(uriWithIncomingChanges);
                }
                default:
                    throw new Error('Unhandled change type.');
            }
        }
        async storeEditSession(fromStoreCommand, cancellationToken) {
            const folders = [];
            let editSessionSize = 0;
            let hasEdits = false;
            // Save all saveable editors before building edit session contents
            await this.editorService.saveAll();
            for (const repository of this.scmService.repositories) {
                // Look through all resource groups and compute which files were added/modified/deleted
                const trackedUris = this.getChangedResources(repository); // A URI might appear in more than one resource group
                const workingChanges = [];
                const { rootUri } = repository.provider;
                const workspaceFolder = rootUri ? this.contextService.getWorkspaceFolder(rootUri) : undefined;
                let name = workspaceFolder?.name;
                for (const uri of trackedUris) {
                    const workspaceFolder = this.contextService.getWorkspaceFolder(uri);
                    if (!workspaceFolder) {
                        this.logService.info(`Skipping working change ${uri.toString()} as no associated workspace folder was found.`);
                        continue;
                    }
                    await this.editSessionIdentityService.onWillCreateEditSessionIdentity(workspaceFolder, cancellationToken);
                    name = name ?? workspaceFolder.name;
                    const relativeFilePath = (0, resources_1.relativePath)(workspaceFolder.uri, uri) ?? uri.path;
                    // Only deal with file contents for now
                    try {
                        if (!(await this.fileService.stat(uri)).isFile) {
                            continue;
                        }
                    }
                    catch { }
                    hasEdits = true;
                    if (await this.fileService.exists(uri)) {
                        const contents = (0, buffer_1.encodeBase64)((await this.fileService.readFile(uri)).value);
                        editSessionSize += contents.length;
                        if (editSessionSize > this.editSessionsStorageService.SIZE_LIMIT) {
                            this.notificationService.error((0, nls_1.localize)('payload too large', 'Your working changes exceed the size limit and cannot be stored.'));
                            return undefined;
                        }
                        workingChanges.push({ type: editSessions_1.ChangeType.Addition, fileType: editSessions_1.FileType.File, contents: contents, relativeFilePath: relativeFilePath });
                    }
                    else {
                        // Assume it's a deletion
                        workingChanges.push({ type: editSessions_1.ChangeType.Deletion, fileType: editSessions_1.FileType.File, contents: undefined, relativeFilePath: relativeFilePath });
                    }
                }
                let canonicalIdentity = undefined;
                if (workspaceFolder !== null && workspaceFolder !== undefined) {
                    canonicalIdentity = await this.editSessionIdentityService.getEditSessionIdentifier(workspaceFolder, cancellationToken);
                }
                // TODO@joyceerhl debt: don't store working changes as a child of the folder
                folders.push({ workingChanges, name: name ?? '', canonicalIdentity: canonicalIdentity ?? undefined, absoluteUri: workspaceFolder?.uri.toString() });
            }
            // Store contributed workspace state
            await this.workspaceStateSynchronizer?.sync(null, {});
            if (!hasEdits) {
                this.logService.info('Skipped storing working changes in the cloud as there are no edits to store.');
                if (fromStoreCommand) {
                    this.notificationService.info((0, nls_1.localize)('no working changes to store', 'Skipped storing working changes in the cloud as there are no edits to store.'));
                }
                return undefined;
            }
            const data = { folders, version: 2, workspaceStateId: this.editSessionsStorageService.lastWrittenResources.get('workspaceState')?.ref };
            try {
                this.logService.info(`Storing edit session...`);
                const ref = await this.editSessionsStorageService.write('editSessions', data);
                this.logService.info(`Stored edit session with ref ${ref}.`);
                return ref;
            }
            catch (ex) {
                this.logService.error(`Failed to store edit session, reason: `, ex.toString());
                if (ex instanceof userDataSync_1.UserDataSyncStoreError) {
                    switch (ex.code) {
                        case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                            // Uploading a payload can fail due to server size limits
                            this.telemetryService.publicLog2('editSessions.upload.failed', { reason: 'TooLarge' });
                            this.notificationService.error((0, nls_1.localize)('payload too large', 'Your working changes exceed the size limit and cannot be stored.'));
                            break;
                        default:
                            this.telemetryService.publicLog2('editSessions.upload.failed', { reason: 'unknown' });
                            this.notificationService.error((0, nls_1.localize)('payload failed', 'Your working changes cannot be stored.'));
                            break;
                    }
                }
            }
            return undefined;
        }
        getChangedResources(repository) {
            return repository.provider.groups.reduce((resources, resourceGroups) => {
                resourceGroups.resources.forEach((resource) => resources.add(resource.sourceUri));
                return resources;
            }, new Set()); // A URI might appear in more than one resource group
        }
        hasEditSession() {
            for (const repository of this.scmService.repositories) {
                if (this.getChangedResources(repository).size > 0) {
                    return true;
                }
            }
            return false;
        }
        async shouldContinueOnWithEditSession() {
            // If the user is already signed in, we should store edit session
            if (this.editSessionsStorageService.isSignedIn) {
                return this.hasEditSession();
            }
            // If the user has been asked before and said no, don't use edit sessions
            if (this.configurationService.getValue(useEditSessionsWithContinueOn) === 'off') {
                this.telemetryService.publicLog2('continueOn.editSessions.canStore.outcome', { outcome: 'disabledEditSessionsViaSetting' });
                return false;
            }
            // Prompt the user to use edit sessions if they currently could benefit from using it
            if (this.hasEditSession()) {
                const quickpick = this.quickInputService.createQuickPick();
                quickpick.placeholder = (0, nls_1.localize)('continue with cloud changes', "Select whether to bring your working changes with you");
                quickpick.ok = false;
                quickpick.ignoreFocusOut = true;
                const withCloudChanges = { label: (0, nls_1.localize)('with cloud changes', "Yes, continue with my working changes") };
                const withoutCloudChanges = { label: (0, nls_1.localize)('without cloud changes', "No, continue without my working changes") };
                quickpick.items = [withCloudChanges, withoutCloudChanges];
                const continueWithCloudChanges = await new Promise((resolve, reject) => {
                    quickpick.onDidAccept(() => {
                        resolve(quickpick.selectedItems[0] === withCloudChanges);
                        quickpick.hide();
                    });
                    quickpick.onDidHide(() => {
                        reject(new errors_1.CancellationError());
                        quickpick.hide();
                    });
                    quickpick.show();
                });
                if (!continueWithCloudChanges) {
                    this.telemetryService.publicLog2('continueOn.editSessions.canStore.outcome', { outcome: 'didNotEnableEditSessionsWhenPrompted' });
                    return continueWithCloudChanges;
                }
                const initialized = await this.editSessionsStorageService.initialize('write');
                if (!initialized) {
                    this.telemetryService.publicLog2('continueOn.editSessions.canStore.outcome', { outcome: 'didNotEnableEditSessionsWhenPrompted' });
                }
                return initialized;
            }
            return false;
        }
        //#region Continue Edit Session extension contribution point
        registerContributedEditSessionOptions() {
            continueEditSessionExtPoint.setHandler(extensions => {
                const continueEditSessionOptions = [];
                for (const extension of extensions) {
                    if (!(0, extensions_2.isProposedApiEnabled)(extension.description, 'contribEditSessions')) {
                        continue;
                    }
                    if (!Array.isArray(extension.value)) {
                        continue;
                    }
                    for (const contribution of extension.value) {
                        const command = actions_1.MenuRegistry.getCommand(contribution.command);
                        if (!command) {
                            return;
                        }
                        const icon = command.icon;
                        const title = typeof command.title === 'string' ? command.title : command.title.value;
                        const when = contextkey_1.ContextKeyExpr.deserialize(contribution.when);
                        continueEditSessionOptions.push(new ContinueEditSessionItem(themables_1.ThemeIcon.isThemeIcon(icon) ? `$(${icon.id}) ${title}` : title, command.id, command.source?.title, when, contribution.documentation));
                        if (contribution.qualifiedName) {
                            this.generateStandaloneOptionCommand(command.id, contribution.qualifiedName, contribution.category ?? command.category, when, contribution.remoteGroup);
                        }
                    }
                }
                this.continueEditSessionOptions = continueEditSessionOptions;
            });
        }
        generateStandaloneOptionCommand(commandId, qualifiedName, category, when, remoteGroup) {
            const command = {
                id: `${continueWorkingOnCommand.id}.${commandId}`,
                title: { original: qualifiedName, value: qualifiedName },
                category: typeof category === 'string' ? { original: category, value: category } : category,
                precondition: when,
                f1: true
            };
            if (!this.registeredCommands.has(command.id)) {
                this.registeredCommands.add(command.id);
                this._register((0, actions_1.registerAction2)(class StandaloneContinueOnOption extends actions_1.Action2 {
                    constructor() {
                        super(command);
                    }
                    async run(accessor) {
                        return accessor.get(commands_1.ICommandService).executeCommand(continueWorkingOnCommand.id, undefined, commandId);
                    }
                }));
                if (remoteGroup !== undefined) {
                    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.StatusBarRemoteIndicatorMenu, {
                        group: remoteGroup,
                        command: command,
                        when: command.precondition
                    });
                }
            }
        }
        registerContinueInLocalFolderAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ContinueInLocalFolderAction extends actions_1.Action2 {
                constructor() {
                    super(openLocalFolderCommand);
                }
                async run(accessor) {
                    const selection = await that.fileDialogService.showOpenDialog({
                        title: (0, nls_1.localize)('continueEditSession.openLocalFolder.title.v2', 'Select a local folder to continue working in'),
                        canSelectFolders: true,
                        canSelectMany: false,
                        canSelectFiles: false,
                        availableFileSystems: [network_1.Schemas.file]
                    });
                    return selection?.length !== 1 ? undefined : uri_1.URI.from({
                        scheme: that.productService.urlProtocol,
                        authority: network_1.Schemas.file,
                        path: selection[0].path
                    });
                }
            }));
            if ((0, virtualWorkspace_1.getVirtualWorkspaceLocation)(this.contextService.getWorkspace()) !== undefined && platform_2.isNative) {
                this.generateStandaloneOptionCommand(openLocalFolderCommand.id, (0, nls_1.localize)('continueWorkingOn.existingLocalFolder', 'Continue Working in Existing Local Folder'), undefined, openLocalFolderCommand.precondition, undefined);
            }
        }
        async pickContinueEditSessionDestination() {
            const quickPick = this.quickInputService.createQuickPick();
            const workspaceContext = this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */
                ? this.contextService.getWorkspace().folders[0].name
                : this.contextService.getWorkspace().folders.map((folder) => folder.name).join(', ');
            quickPick.placeholder = (0, nls_1.localize)('continueEditSessionPick.title.v2', "Select a development environment to continue working on {0} in", `'${workspaceContext}'`);
            quickPick.items = this.createPickItems();
            this.extensionService.onDidChangeExtensions(() => {
                quickPick.items = this.createPickItems();
            });
            const command = await new Promise((resolve, reject) => {
                quickPick.onDidHide(() => resolve(undefined));
                quickPick.onDidAccept((e) => {
                    const selection = quickPick.activeItems[0].command;
                    if (selection === installAdditionalContinueOnOptionsCommand.id) {
                        void this.commandService.executeCommand(installAdditionalContinueOnOptionsCommand.id);
                    }
                    else {
                        resolve(selection);
                        quickPick.hide();
                    }
                });
                quickPick.show();
                quickPick.onDidTriggerItemButton(async (e) => {
                    if (e.item.documentation !== undefined) {
                        const uri = uri_1.URI.isUri(e.item.documentation) ? uri_1.URI.parse(e.item.documentation) : await this.commandService.executeCommand(e.item.documentation);
                        void this.openerService.open(uri, { openExternal: true });
                    }
                });
            });
            quickPick.dispose();
            return command;
        }
        async resolveDestination(command) {
            try {
                const uri = await this.commandService.executeCommand(command);
                // Some continue on commands do not return a URI
                // to support extensions which want to be in control
                // of how the destination is opened
                if (uri === undefined) {
                    this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'noDestinationUri' });
                    return 'noDestinationUri';
                }
                if (uri_1.URI.isUri(uri)) {
                    this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'resolvedUri' });
                    return uri;
                }
                this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'invalidDestination' });
                return undefined;
            }
            catch (ex) {
                if (ex instanceof errors_1.CancellationError) {
                    this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'cancelled' });
                }
                else {
                    this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'unknownError' });
                }
                return undefined;
            }
        }
        createPickItems() {
            const items = [...this.continueEditSessionOptions].filter((option) => option.when === undefined || this.contextKeyService.contextMatchesRules(option.when));
            if ((0, virtualWorkspace_1.getVirtualWorkspaceLocation)(this.contextService.getWorkspace()) !== undefined && platform_2.isNative) {
                items.push(new ContinueEditSessionItem('$(folder) ' + (0, nls_1.localize)('continueEditSessionItem.openInLocalFolder.v2', 'Open in Local Folder'), openLocalFolderCommand.id, (0, nls_1.localize)('continueEditSessionItem.builtin', 'Built-in')));
            }
            const sortedItems = items.sort((item1, item2) => item1.label.localeCompare(item2.label));
            return sortedItems.concat({ type: 'separator' }, new ContinueEditSessionItem(installAdditionalContinueOnOptionsCommand.title, installAdditionalContinueOnOptionsCommand.id));
        }
    };
    exports.EditSessionsContribution = EditSessionsContribution;
    exports.EditSessionsContribution = EditSessionsContribution = EditSessionsContribution_1 = __decorate([
        __param(0, editSessions_1.IEditSessionsStorageService),
        __param(1, files_1.IFileService),
        __param(2, progress_1.IProgressService),
        __param(3, opener_1.IOpenerService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, scm_1.ISCMService),
        __param(6, notification_1.INotificationService),
        __param(7, dialogs_1.IDialogService),
        __param(8, editSessions_1.IEditSessionsLogService),
        __param(9, environment_1.IEnvironmentService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, productService_1.IProductService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, workspace_1.IWorkspaceContextService),
        __param(14, editSessions_2.IEditSessionIdentityService),
        __param(15, quickInput_1.IQuickInputService),
        __param(16, commands_1.ICommandService),
        __param(17, contextkey_1.IContextKeyService),
        __param(18, dialogs_1.IFileDialogService),
        __param(19, lifecycle_2.ILifecycleService),
        __param(20, storage_1.IStorageService),
        __param(21, activity_1.IActivityService),
        __param(22, editorService_1.IEditorService),
        __param(23, remoteAgentService_1.IRemoteAgentService),
        __param(24, extensions_2.IExtensionService),
        __param(25, request_1.IRequestService),
        __param(26, userDataProfile_1.IUserDataProfilesService),
        __param(27, uriIdentity_1.IUriIdentityService),
        __param(28, workspaceIdentityService_1.IWorkspaceIdentityService)
    ], EditSessionsContribution);
    const infoButtonClass = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info);
    class ContinueEditSessionItem {
        constructor(label, command, description, when, documentation) {
            this.label = label;
            this.command = command;
            this.description = description;
            this.when = when;
            this.documentation = documentation;
            if (documentation !== undefined) {
                this.buttons = [{
                        iconClass: infoButtonClass,
                        tooltip: (0, nls_1.localize)('learnMoreTooltip', 'Learn More'),
                    }];
            }
        }
    }
    const continueEditSessionExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'continueEditSession',
        jsonSchema: {
            description: (0, nls_1.localize)('continueEditSessionExtPoint', 'Contributes options for continuing the current edit session in a different environment'),
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    command: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.command', 'Identifier of the command to execute. The command must be declared in the \'commands\'-section and return a URI representing a different environment where the current edit session can be continued.'),
                        type: 'string'
                    },
                    group: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.group', 'Group into which this item belongs.'),
                        type: 'string'
                    },
                    qualifiedName: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.qualifiedName', 'A fully qualified name for this item which is used for display in menus.'),
                        type: 'string'
                    },
                    description: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.description', "The url, or a command that returns the url, to the option's documentation page."),
                        type: 'string'
                    },
                    remoteGroup: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.remoteGroup', 'Group into which this item belongs in the remote indicator.'),
                        type: 'string'
                    },
                    when: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.when', 'Condition which must be true to show this item.'),
                        type: 'string'
                    }
                },
                required: ['command']
            }
        }
    });
    //#endregion
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(EditSessionsContribution, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...configuration_2.workbenchConfigurationNodeBase,
        'properties': {
            'workbench.experimental.cloudChanges.autoStore': {
                enum: ['onShutdown', 'off'],
                enumDescriptions: [
                    (0, nls_1.localize)('autoStoreWorkingChanges.onShutdown', "Automatically store current working changes in the cloud on window close."),
                    (0, nls_1.localize)('autoStoreWorkingChanges.off', "Never attempt to automatically store working changes in the cloud.")
                ],
                'type': 'string',
                'tags': ['experimental', 'usesOnlineServices'],
                'default': 'off',
                'markdownDescription': (0, nls_1.localize)('autoStoreWorkingChangesDescription', "Controls whether to automatically store available working changes in the cloud for the current workspace. This setting has no effect in the web."),
            },
            'workbench.cloudChanges.autoResume': {
                enum: ['onReload', 'off'],
                enumDescriptions: [
                    (0, nls_1.localize)('autoResumeWorkingChanges.onReload', "Automatically resume available working changes from the cloud on window reload."),
                    (0, nls_1.localize)('autoResumeWorkingChanges.off', "Never attempt to resume working changes from the cloud.")
                ],
                'type': 'string',
                'tags': ['usesOnlineServices'],
                'default': 'onReload',
                'markdownDescription': (0, nls_1.localize)('autoResumeWorkingChanges', "Controls whether to automatically resume available working changes stored in the cloud for the current workspace."),
            },
            'workbench.cloudChanges.continueOn': {
                enum: ['prompt', 'off'],
                enumDescriptions: [
                    (0, nls_1.localize)('continueOnCloudChanges.promptForAuth', 'Prompt the user to sign in to store working changes in the cloud with Continue Working On.'),
                    (0, nls_1.localize)('continueOnCloudChanges.off', 'Do not store working changes in the cloud with Continue Working On unless the user has already turned on Cloud Changes.')
                ],
                type: 'string',
                tags: ['usesOnlineServices'],
                default: 'prompt',
                markdownDescription: (0, nls_1.localize)('continueOnCloudChanges', 'Controls whether to prompt the user to store working changes in the cloud when using Continue Working On.')
            },
            'workbench.experimental.cloudChanges.partialMatches.enabled': {
                'type': 'boolean',
                'tags': ['experimental', 'usesOnlineServices'],
                'default': false,
                'markdownDescription': (0, nls_1.localize)('cloudChangesPartialMatchesEnabled', "Controls whether to surface cloud changes which partially match the current session.")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2VkaXRTZXNzaW9ucy9icm93c2VyL2VkaXRTZXNzaW9ucy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFFaEcsSUFBQSw4QkFBaUIsRUFBQyxzQ0FBdUIsRUFBRSwrQ0FBc0Isb0NBQTRCLENBQUM7SUFDOUYsSUFBQSw4QkFBaUIsRUFBQywwQ0FBMkIsRUFBRSx5REFBNEIsb0NBQTRCLENBQUM7SUFHeEcsTUFBTSx3QkFBd0IsR0FBb0I7UUFDakQsRUFBRSxFQUFFLHFEQUFxRDtRQUN6RCxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMscUJBQXFCLEVBQUUsd0JBQXdCLENBQUM7UUFDakUsWUFBWSxFQUFFLHlDQUEyQixDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUM7UUFDMUQsRUFBRSxFQUFFLElBQUk7S0FDUixDQUFDO0lBQ0YsTUFBTSxzQkFBc0IsR0FBb0I7UUFDL0MsRUFBRSxFQUFFLHFFQUFxRTtRQUN6RSxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsdUNBQXVDLEVBQUUsc0JBQXNCLENBQUM7UUFDakYsUUFBUSxFQUFFLHlDQUEwQjtRQUNwQyxZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMEJBQVksQ0FBQyxTQUFTLEVBQUUsRUFBRSxxQ0FBdUIsQ0FBQztLQUNuRixDQUFDO0lBQ0YsTUFBTSx3QkFBd0IsR0FBb0I7UUFDakQsRUFBRSxFQUFFLGtEQUFrRDtRQUN0RCxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztRQUN4QyxRQUFRLEVBQUUseUNBQTBCO0tBQ3BDLENBQUM7SUFDRixN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