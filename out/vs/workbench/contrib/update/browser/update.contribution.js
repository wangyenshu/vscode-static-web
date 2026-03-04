/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/workbench/contrib/update/browser/update", "vs/platform/product/common/product", "vs/platform/update/common/update", "vs/platform/instantiation/common/instantiation", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/base/common/labels", "vs/workbench/contrib/update/common/update", "vs/platform/contextkey/common/contextkeys", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/base/common/uri", "vs/platform/contextkey/common/contextkey", "vs/platform/update/common/update.config.contribution"], function (require, exports, nls_1, platform_1, contributions_1, actionCommonCategories_1, actions_1, update_1, product_1, update_2, instantiation_1, platform_2, dialogs_1, labels_1, update_3, contextkeys_1, opener_1, productService_1, uri_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CheckForUpdateAction = exports.ShowCurrentReleaseNotesFromCurrentFileAction = exports.ShowCurrentReleaseNotesAction = void 0;
    const workbench = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbench.registerWorkbenchContribution(update_1.ProductContribution, 3 /* LifecyclePhase.Restored */);
    workbench.registerWorkbenchContribution(update_1.UpdateContribution, 3 /* LifecyclePhase.Restored */);
    workbench.registerWorkbenchContribution(update_1.SwitchProductQualityContribution, 3 /* LifecyclePhase.Restored */);
    // Release notes
    class ShowCurrentReleaseNotesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: update_3.ShowCurrentReleaseNotesActionId,
                title: {
                    ...(0, nls_1.localize2)('showReleaseNotes', "Show Release Notes"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mshowReleaseNotes', comment: ['&& denotes a mnemonic'] }, "Show &&Release Notes"),
                },
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.RELEASE_NOTES_URL,
                menu: [{
                        id: actions_1.MenuId.MenubarHelpMenu,
                        group: '1_welcome',
                        order: 5,
                        when: update_1.RELEASE_NOTES_URL,
                    }]
            });
        }
        async run(accessor) {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            try {
                await (0, update_1.showReleaseNotesInEditor)(instantiationService, productService.version, false);
            }
            catch (err) {
                if (productService.releaseNotesUrl) {
                    await openerService.open(uri_1.URI.parse(productService.releaseNotesUrl));
                }
                else {
                    throw new Error((0, nls_1.localize)('update.noReleaseNotesOnline', "This version of {0} does not have release notes online", productService.nameLong));
                }
            }
        }
    }
    exports.ShowCurrentReleaseNotesAction = ShowCurrentReleaseNotesAction;
    class ShowCurrentReleaseNotesFromCurrentFileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: update_3.ShowCurrentReleaseNotesFromCurrentFileActionId,
                title: {
                    ...(0, nls_1.localize2)('showReleaseNotesCurrentFile', "Open Current File as Release Notes"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mshowReleaseNotes', comment: ['&& denotes a mnemonic'] }, "Show &&Release Notes"),
                },
                category: (0, nls_1.localize2)('developerCategory', "Developer"),
                f1: true,
                precondition: update_1.RELEASE_NOTES_URL
            });
        }
        async run(accessor) {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const productService = accessor.get(productService_1.IProductService);
            try {
                await (0, update_1.showReleaseNotesInEditor)(instantiationService, productService.version, true);
            }
            catch (err) {
                throw new Error((0, nls_1.localize)('releaseNotesFromFileNone', "Cannot open the current file as Release Notes"));
            }
        }
    }
    exports.ShowCurrentReleaseNotesFromCurrentFileAction = ShowCurrentReleaseNotesFromCurrentFileAction;
    (0, actions_1.registerAction2)(ShowCurrentReleaseNotesAction);
    (0, actions_1.registerAction2)(ShowCurrentReleaseNotesFromCurrentFileAction);
    // Update
    class CheckForUpdateAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'update.checkForUpdate',
                title: (0, nls_1.localize2)('checkForUpdates', 'Check for Updates...'),
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("idle" /* StateType.Idle */),
            });
        }
        async run(accessor) {
            const updateService = accessor.get(update_2.IUpdateService);
            return updateService.checkForUpdates(true);
        }
    }
    exports.CheckForUpdateAction = CheckForUpdateAction;
    class DownloadUpdateAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'update.downloadUpdate',
                title: (0, nls_1.localize2)('downloadUpdate', 'Download Update'),
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("available for download" /* StateType.AvailableForDownload */)
            });
        }
        async run(accessor) {
            await accessor.get(update_2.IUpdateService).downloadUpdate();
        }
    }
    class InstallUpdateAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'update.installUpdate',
                title: (0, nls_1.localize2)('installUpdate', 'Install Update'),
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("downloaded" /* StateType.Downloaded */)
            });
        }
        async run(accessor) {
            await accessor.get(update_2.IUpdateService).applyUpdate();
        }
    }
    class RestartToUpdateAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'update.restartToUpdate',
                title: (0, nls_1.localize2)('restartToUpdate', 'Restart to Update'),
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("ready" /* StateType.Ready */)
            });
        }
        async run(accessor) {
            await accessor.get(update_2.IUpdateService).quitAndInstall();
        }
    }
    class DownloadAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.download'; }
        constructor() {
            super({
                id: DownloadAction.ID,
                title: (0, nls_1.localize2)('openDownloadPage', "Download {0}", product_1.default.nameLong),
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsWebContext, update_1.DOWNLOAD_URL), // Only show when running in a web browser and a download url is available
                f1: true,
                menu: [{
                        id: actions_1.MenuId.StatusBarWindowIndicatorMenu,
                        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsWebContext, update_1.DOWNLOAD_URL)
                    }]
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.downloadUrl) {
                openerService.open(uri_1.URI.parse(productService.downloadUrl));
            }
        }
    }
    (0, actions_1.registerAction2)(DownloadAction);
    (0, actions_1.registerAction2)(CheckForUpdateAction);
    (0, actions_1.registerAction2)(DownloadUpdateAction);
    (0, actions_1.registerAction2)(InstallUpdateAction);
    (0, actions_1.registerAction2)(RestartToUpdateAction);
    if (platform_2.isWindows) {
        class DeveloperApplyUpdateAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: '_update.applyupdate',
                    title: (0, nls_1.localize2)('applyUpdate', 'Apply Update...'),
                    category: actionCommonCategories_1.Categories.Developer,
                    f1: true,
                    precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("idle" /* StateType.Idle */)
                });
            }
            async run(accessor) {
                const updateService = accessor.get(update_2.IUpdateService);
                const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                const updatePath = await fileDialogService.showOpenDialog({
                    title: (0, nls_1.localize)('pickUpdate', "Apply Update"),
                    filters: [{ name: 'Setup', extensions: ['exe'] }],
                    canSelectFiles: true,
                    openLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'updateButton', comment: ['&& denotes a mnemonic'] }, "&&Update"))
                });
                if (!updatePath || !updatePath[0]) {
                    return;
                }
                await updateService._applySpecificUpdate(updatePath[0].fsPath);
            }
        }
        (0, actions_1.registerAction2)(DeveloperApplyUpdateAction);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VwZGF0ZS9icm93c2VyL3VwZGF0ZS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUJoRyxNQUFNLFNBQVMsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFOUYsU0FBUyxDQUFDLDZCQUE2QixDQUFDLDRCQUFtQixrQ0FBMEIsQ0FBQztJQUN0RixTQUFTLENBQUMsNkJBQTZCLENBQUMsMkJBQWtCLGtDQUEwQixDQUFDO0lBQ3JGLFNBQVMsQ0FBQyw2QkFBNkIsQ0FBQyx5Q0FBZ0Msa0NBQTBCLENBQUM7SUFFbkcsZ0JBQWdCO0lBRWhCLE1BQWEsNkJBQThCLFNBQVEsaUJBQU87UUFFekQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHdDQUErQjtnQkFDbkMsS0FBSyxFQUFFO29CQUNOLEdBQUcsSUFBQSxlQUFTLEVBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUM7b0JBQ3RELGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxtQkFBbUIsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsc0JBQXNCLENBQUM7aUJBQ2pIO2dCQUNELFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxpQkFBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsaUJBQU8sQ0FBQyxTQUFTLEVBQUU7Z0JBQ25FLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFlBQVksRUFBRSwwQkFBaUI7Z0JBQy9CLElBQUksRUFBRSxDQUFDO3dCQUNOLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7d0JB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