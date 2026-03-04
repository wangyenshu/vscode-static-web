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
define(["require", "exports", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/product/common/productService", "vs/workbench/services/issue/common/issue", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/extensionManagement/browser/extensionBisect", "vs/platform/notification/common/notification", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/host/browser/host", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/instantiation/common/instantiation", "vs/platform/action/common/actionCommonCategories", "vs/platform/instantiation/common/extensions", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/storage/common/storage", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkeys"], function (require, exports, nls_1, extensionManagement_1, productService_1, issue_1, lifecycle_1, actions_1, userDataProfile_1, dialogs_1, extensionBisect_1, notification_1, extensionManagement_2, host_1, userDataProfile_2, instantiation_1, actionCommonCategories_1, extensions_1, contextkey_1, platform_1, contributions_1, storage_1, opener_1, uri_1, contextkeys_1, contextkeys_2) {
    "use strict";
    var TroubleshootIssueService_1, IssueTroubleshootUi_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const ITroubleshootIssueService = (0, instantiation_1.createDecorator)('ITroubleshootIssueService');
    var TroubleshootStage;
    (function (TroubleshootStage) {
        TroubleshootStage[TroubleshootStage["EXTENSIONS"] = 1] = "EXTENSIONS";
        TroubleshootStage[TroubleshootStage["WORKBENCH"] = 2] = "WORKBENCH";
    })(TroubleshootStage || (TroubleshootStage = {}));
    class TroubleShootState {
        static fromJSON(raw) {
            if (!raw) {
                return undefined;
            }
            try {
                const data = JSON.parse(raw);
                if ((data.stage === TroubleshootStage.EXTENSIONS || data.stage === TroubleshootStage.WORKBENCH)
                    && typeof data.profile === 'string') {
                    return new TroubleShootState(data.stage, data.profile);
                }
            }
            catch { /* ignore */ }
            return undefined;
        }
        constructor(stage, profile) {
            this.stage = stage;
            this.profile = profile;
        }
    }
    let TroubleshootIssueService = class TroubleshootIssueService extends lifecycle_1.Disposable {
        static { TroubleshootIssueService_1 = this; }
        static { this.storageKey = 'issueTroubleshootState'; }
        constructor(userDataProfileService, userDataProfilesService, userDataProfileManagementService, userDataProfileImportExportService, dialogService, extensionBisectService, notificationService, extensionManagementService, extensionEnablementService, issueService, productService, hostService, storageService, openerService) {
            super();
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileManagementService = userDataProfileManagementService;
            this.userDataProfileImportExportService = userDataProfileImportExportService;
            this.dialogService = dialogService;
            this.extensionBisectService = extensionBisectService;
            this.notificationService = notificationService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.issueService = issueService;
            this.productService = productService;
            this.hostService = hostService;
            this.storageService = storageService;
            this.openerService = openerService;
        }
        isActive() {
            return this.state !== undefined;
        }
        async start() {
            if (this.isActive()) {
                throw new Error('invalid state');
            }
            const res = await this.dialogService.confirm({
                message: (0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"),
                detail: (0, nls_1.localize)('detail.start', "Issue troubleshooting is a process to help you identify the cause for an issue. The cause for an issue can be a misconfiguration, due to an extension, or be {0} itself.\n\nDuring the process the window reloads repeatedly. Each time you must confirm if you are still seeing the issue.", this.productService.nameLong),
                primaryButton: (0, nls_1.localize)({ key: 'msg', comment: ['&& denotes a mnemonic'] }, "&&Troubleshoot Issue"),
                custom: true
            });
            if (!res.confirmed) {
                return;
            }
            const originalProfile = this.userDataProfileService.currentProfile;
            await this.userDataProfileImportExportService.createTroubleshootProfile();
            this.state = new TroubleShootState(TroubleshootStage.EXTENSIONS, originalProfile.id);
            await this.resume();
        }
        async resume() {
            if (!this.isActive()) {
                return;
            }
            if (this.state?.stage === TroubleshootStage.EXTENSIONS && !this.extensionBisectService.isActive) {
                await this.reproduceIssueWithExtensionsDisabled();
            }
            if (this.state?.stage === TroubleshootStage.WORKBENCH) {
                await this.reproduceIssueWithEmptyProfile();
            }
            await this.stop();
        }
        async stop() {
            if (!this.isActive()) {
                return;
            }
            if (this.notificationHandle) {
                this.notificationHandle.close();
                this.notificationHandle = undefined;
            }
            if (this.extensionBisectService.isActive) {
                await this.extensionBisectService.reset();
            }
            const profile = this.userDataProfilesService.profiles.find(p => p.id === this.state?.profile) ?? this.userDataProfilesService.defaultProfile;
            this.state = undefined;
            await this.userDataProfileManagementService.switchProfile(profile);
        }
        async reproduceIssueWithExtensionsDisabled() {
            if (!(await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */)).length) {
                this.state = new TroubleShootState(TroubleshootStage.WORKBENCH, this.state.profile);
                return;
            }
            const result = await this.askToReproduceIssue((0, nls_1.localize)('profile.extensions.disabled', "Issue troubleshooting is active and has temporarily disabled all installed extensions. Check if you can still reproduce the problem and proceed by selecting from these options."));
            if (result === 'good') {
                const profile = this.userDataProfilesService.profiles.find(p => p.id === this.state.profile) ?? this.userDataProfilesService.defaultProfile;
                await this.reproduceIssueWithExtensionsBisect(profile);
            }
            if (result === 'bad') {
                this.state = new TroubleShootState(TroubleshootStage.WORKBENCH, this.state.profile);
            }
            if (result === 'stop') {
                await this.stop();
            }
        }
        async reproduceIssueWithEmptyProfile() {
            await this.userDataProfileManagementService.createAndEnterTransientProfile();
            this.updateState(this.state);
            const result = await this.askToReproduceIssue((0, nls_1.localize)('empty.profile', "Issue troubleshooting is active and has temporarily reset your configurations to defaults. Check if you can still reproduce the problem and proceed by selecting from these options."));
            if (result === 'stop') {
                await this.stop();
            }
            if (result === 'good') {
                await this.askToReportIssue((0, nls_1.localize)('issue is with configuration', "Issue troubleshooting has identified that the issue is caused by your configurations. Please report the issue by exporting your configurations using \"Export Profile\" command and share the file in the issue report."));
            }
            if (result === 'bad') {
                await this.askToReportIssue((0, nls_1.localize)('issue is in core', "Issue troubleshooting has identified that the issue is with {0}.", this.productService.nameLong));
            }
        }
        async reproduceIssueWithExtensionsBisect(profile) {
            await this.userDataProfileManagementService.switchProfile(profile);
            const extensions = (await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */)).filter(ext => this.extensionEnablementService.isEnabled(ext));
            await this.extensionBisectService.start(extensions);
            await this.hostService.reload();
        }
        askToReproduceIssue(message) {
            return new Promise((c, e) => {
                const goodPrompt = {
                    label: (0, nls_1.localize)('I cannot reproduce', "I Can't Reproduce"),
                    run: () => c('good')
                };
                const badPrompt = {
                    label: (0, nls_1.localize)('This is Bad', "I Can Reproduce"),
                    run: () => c('bad')
                };
                const stop = {
                    label: (0, nls_1.localize)('Stop', "Stop"),
                    run: () => c('stop')
                };
                this.notificationHandle = this.notificationService.prompt(notification_1.Severity.Info, message, [goodPrompt, badPrompt, stop], { sticky: true, priority: notification_1.NotificationPriority.URGENT });
            });
        }
        async askToReportIssue(message) {
            let isCheckedInInsiders = false;
            if (this.productService.quality === 'stable') {
                const res = await this.askToReproduceIssueWithInsiders();
                if (res === 'good') {
                    await this.dialogService.prompt({
                        type: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"),
                        detail: (0, nls_1.localize)('use insiders', "This likely means that the issue has been addressed already and will be available in an upcoming release. You can safely use {0} insiders until the new stable version is available.", this.productService.nameLong),
                        custom: true
                    });
                    return;
                }
                if (res === 'stop') {
                    await this.stop();
                    return;
                }
                if (res === 'bad') {
                    isCheckedInInsiders = true;
                }
            }
            await this.issueService.openReporter({
                issueBody: `> ${message} ${isCheckedInInsiders ? `It is confirmed that the issue exists in ${this.productService.nameLong} Insiders` : ''}`,
            });
        }
        async askToReproduceIssueWithInsiders() {
            const confirmRes = await this.dialogService.confirm({
                type: 'info',
                message: (0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"),
                primaryButton: (0, nls_1.localize)('download insiders', "Download {0} Insiders", this.productService.nameLong),
                cancelButton: (0, nls_1.localize)('report anyway', "Report Issue Anyway"),
                detail: (0, nls_1.localize)('ask to download insiders', "Please try to download and reproduce the issue in {0} insiders.", this.productService.nameLong),
                custom: {
                    disableCloseAction: true,
                }
            });
            if (!confirmRes.confirmed) {
                return undefined;
            }
            const opened = await this.openerService.open(uri_1.URI.parse('https://aka.ms/vscode-insiders'));
            if (!opened) {
                return undefined;
            }
            const res = await this.dialogService.prompt({
                type: 'info',
                message: (0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"),
                buttons: [{
                        label: (0, nls_1.localize)('good', "I can't reproduce"),
                        run: () => 'good'
                    }, {
                        label: (0, nls_1.localize)('bad', "I can reproduce"),
                        run: () => 'bad'
                    }],
                cancelButton: {
                    label: (0, nls_1.localize)('stop', "Stop"),
                    run: () => 'stop'
                },
                detail: (0, nls_1.localize)('ask to reproduce issue', "Please try to reproduce the issue in {0} insiders and confirm if the issue exists there.", this.productService.nameLong),
                custom: {
                    disableCloseAction: true,
                }
            });
            return res.result;
        }
        get state() {
            if (this._state === undefined) {
                const raw = this.storageService.get(TroubleshootIssueService_1.storageKey, 0 /* StorageScope.PROFILE */);
                this._state = TroubleShootState.fromJSON(raw);
            }
            return this._state || undefined;
        }
        set state(state) {
            this._state = state ?? null;
            this.updateState(state);
        }
        updateState(state) {
            if (state) {
                this.storageService.store(TroubleshootIssueService_1.storageKey, JSON.stringify(state), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(TroubleshootIssueService_1.storageKey, 0 /* StorageScope.PROFILE */);
            }
        }
    };
    TroubleshootIssueService = TroubleshootIssueService_1 = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, userDataProfile_2.IUserDataProfilesService),
        __param(2, userDataProfile_1.IUserDataProfileManagementService),
        __param(3, userDataProfile_1.IUserDataProfileImportExportService),
        __param(4, dialogs_1.IDialogService),
        __param(5, extensionBisect_1.IExtensionBisectService),
        __param(6, notification_1.INotificationService),
        __param(7, extensionManagement_1.IExtensionManagementService),
        __param(8, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(9, issue_1.IWorkbenchIssueService),
        __param(10, productService_1.IProductService),
        __param(11, host_1.IHostService),
        __param(12, storage_1.IStorageService),
        __param(13, opener_1.IOpenerService)
    ], TroubleshootIssueService);
    let IssueTroubleshootUi = class IssueTroubleshootUi extends lifecycle_1.Disposable {
        static { IssueTroubleshootUi_1 = this; }
        static { this.ctxIsTroubleshootActive = new contextkey_1.RawContextKey('isIssueTroubleshootActive', false); }
        constructor(contextKeyService, troubleshootIssueService, storageService) {
            super();
            this.contextKeyService = contextKeyService;
            this.troubleshootIssueService = troubleshootIssueService;
            this.updateContext();
            if (troubleshootIssueService.isActive()) {
                troubleshootIssueService.resume();
            }
            this._register(storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, TroubleshootIssueService.storageKey, this._register(new lifecycle_1.DisposableStore()))(() => {
                this.updateContext();
            }));
        }
        updateContext() {
            IssueTroubleshootUi_1.ctxIsTroubleshootActive.bindTo(this.contextKeyService).set(this.troubleshootIssueService.isActive());
        }
    };
    IssueTroubleshootUi = IssueTroubleshootUi_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, ITroubleshootIssueService),
        __param(2, storage_1.IStorageService)
    ], IssueTroubleshootUi);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(IssueTroubleshootUi, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(class TroubleshootIssueAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.troubleshootIssue.start',
                title: (0, nls_1.localize2)('troubleshootIssue', 'Troubleshoot Issue...'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(IssueTroubleshootUi.ctxIsTroubleshootActive.negate(), contextkeys_1.RemoteNameContext.isEqualTo(''), contextkeys_2.IsWebContext.negate()),
            });
        }
        run(accessor) {
            return accessor.get(ITroubleshootIssueService).start();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.troubleshootIssue.stop',
                title: (0, nls_1.localize2)('title.stop', 'Stop Troubleshoot Issue'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                precondition: IssueTroubleshootUi.ctxIsTroubleshootActive
            });
        }
        async run(accessor) {
            return accessor.get(ITroubleshootIssueService).stop();
        }
    });
    (0, extensions_1.registerSingleton)(ITroubleshootIssueService, TroubleshootIssueService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVUcm91Ymxlc2hvb3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvaXNzdWUvYnJvd3Nlci9pc3N1ZVRyb3VibGVzaG9vdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2QmhHLE1BQU0seUJBQXlCLEdBQUcsSUFBQSwrQkFBZSxFQUE0QiwyQkFBMkIsQ0FBQyxDQUFDO0lBVTFHLElBQUssaUJBR0o7SUFIRCxXQUFLLGlCQUFpQjtRQUNyQixxRUFBYyxDQUFBO1FBQ2QsbUVBQVMsQ0FBQTtJQUNWLENBQUMsRUFISSxpQkFBaUIsS0FBakIsaUJBQWlCLFFBR3JCO0lBSUQsTUFBTSxpQkFBaUI7UUFFdEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUF1QjtZQUN0QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELElBQUksQ0FBQztnQkFFSixNQUFNLElBQUksR0FBUSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQyxJQUNDLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxpQkFBaUIsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7dUJBQ3hGLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxRQUFRLEVBQ2xDLENBQUM7b0JBQ0YsT0FBTyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN4RCxDQUFDO1lBQ0YsQ0FBQztZQUFDLE1BQU0sQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3hCLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7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