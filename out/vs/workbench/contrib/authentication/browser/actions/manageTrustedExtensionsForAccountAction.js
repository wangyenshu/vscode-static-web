/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/date", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/browser/authenticationUsageService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extensions"], function (require, exports, date_1, lifecycle_1, nls_1, actions_1, dialogs_1, productService_1, quickInput_1, authenticationAccessService_1, authenticationUsageService_1, authentication_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManageTrustedExtensionsForAccountAction = void 0;
    class ManageTrustedExtensionsForAccountAction extends actions_1.Action2 {
        constructor() {
            super({
                id: '_manageTrustedExtensionsForAccount',
                title: (0, nls_1.localize2)('manageTrustedExtensionsForAccount', "Manage Trusted Extensions For Account"),
                category: (0, nls_1.localize2)('accounts', "Accounts"),
                f1: true
            });
        }
        async run(accessor, options) {
            const productService = accessor.get(productService_1.IProductService);
            const extensionService = accessor.get(extensions_1.IExtensionService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const authenticationService = accessor.get(authentication_1.IAuthenticationService);
            const authenticationUsageService = accessor.get(authenticationUsageService_1.IAuthenticationUsageService);
            const authenticationAccessService = accessor.get(authenticationAccessService_1.IAuthenticationAccessService);
            let providerId = options?.providerId;
            let accountLabel = options?.accountLabel;
            if (!providerId || !accountLabel) {
                const accounts = new Array();
                for (const id of authenticationService.getProviderIds()) {
                    const providerLabel = authenticationService.getProvider(id).label;
                    const sessions = await authenticationService.getSessions(id);
                    const uniqueAccountLabels = new Set();
                    for (const session of sessions) {
                        if (!uniqueAccountLabels.has(session.account.label)) {
                            uniqueAccountLabels.add(session.account.label);
                            accounts.push({ providerId: id, providerLabel, accountLabel: session.account.label });
                        }
                    }
                }
                const pick = await quickInputService.pick(accounts.map(account => ({
                    providerId: account.providerId,
                    label: account.accountLabel,
                    description: account.providerLabel
                })), {
                    placeHolder: (0, nls_1.localize)('pickAccount', "Pick an account to manage trusted extensions for"),
                    matchOnDescription: true,
                });
                if (pick) {
                    providerId = pick.providerId;
                    accountLabel = pick.label;
                }
                else {
                    return;
                }
            }
            const allowedExtensions = authenticationAccessService.readAllowedExtensions(providerId, accountLabel);
            const trustedExtensionAuthAccess = productService.trustedExtensionAuthAccess;
            const trustedExtensionIds = 
            // Case 1: trustedExtensionAuthAccess is an array
            Array.isArray(trustedExtensionAuthAccess)
                ? trustedExtensionAuthAccess
                // Case 2: trustedExtensionAuthAccess is an object
                : typeof trustedExtensionAuthAccess === 'object'
                    ? trustedExtensionAuthAccess[providerId] ?? []
                    : [];
            for (const extensionId of trustedExtensionIds) {
                const allowedExtension = allowedExtensions.find(ext => ext.id === extensionId);
                if (!allowedExtension) {
                    // Add the extension to the allowedExtensions list
                    const extension = await extensionService.getExtension(extensionId);
                    if (extension) {
                        allowedExtensions.push({
                            id: extensionId,
                            name: extension.displayName || extension.name,
                            allowed: true,
                            trusted: true
                        });
                    }
                }
                else {
                    // Update the extension to be allowed
                    allowedExtension.allowed = true;
                    allowedExtension.trusted = true;
                }
            }
            if (!allowedExtensions.length) {
                dialogService.info((0, nls_1.localize)('noTrustedExtensions', "This account has not been used by any extensions."));
                return;
            }
            const disposableStore = new lifecycle_1.DisposableStore();
            const quickPick = disposableStore.add(quickInputService.createQuickPick());
            quickPick.canSelectMany = true;
            quickPick.customButton = true;
            quickPick.customLabel = (0, nls_1.localize)('manageTrustedExtensions.cancel', 'Cancel');
            const usages = authenticationUsageService.readAccountUsages(providerId, accountLabel);
            const trustedExtensions = [];
            const otherExtensions = [];
            for (const extension of allowedExtensions) {
                const usage = usages.find(usage => extension.id === usage.extensionId);
                extension.lastUsed = usage?.lastUsed;
                if (extension.trusted) {
                    trustedExtensions.push(extension);
                }
                else {
                    otherExtensions.push(extension);
                }
            }
            const sortByLastUsed = (a, b) => (b.lastUsed || 0) - (a.lastUsed || 0);
            const toQuickPickItem = function (extension) {
                const lastUsed = extension.lastUsed;
                const description = lastUsed
                    ? (0, nls_1.localize)({ key: 'accountLastUsedDate', comment: ['The placeholder {0} is a string with time information, such as "3 days ago"'] }, "Last used this account {0}", (0, date_1.fromNow)(lastUsed, true))
                    : (0, nls_1.localize)('notUsed', "Has not used this account");
                let tooltip;
                let disabled;
                if (extension.trusted) {
                    tooltip = (0, nls_1.localize)('trustedExtensionTooltip', "This extension is trusted by Microsoft and\nalways has access to this account");
                    disabled = true;
                }
                return {
                    label: extension.name,
                    extension,
                    description,
                    tooltip,
                    disabled,
                    picked: extension.allowed === undefined || extension.allowed
                };
            };
            const items = [
                ...otherExtensions.sort(sortByLastUsed).map(toQuickPickItem),
                { type: 'separator', label: (0, nls_1.localize)('trustedExtensions', "Trusted by Microsoft") },
                ...trustedExtensions.sort(sortByLastUsed).map(toQuickPickItem)
            ];
            quickPick.items = items;
            quickPick.selectedItems = items.filter((item) => item.type !== 'separator' && (item.extension.allowed === undefined || item.extension.allowed));
            quickPick.title = (0, nls_1.localize)('manageTrustedExtensions', "Manage Trusted Extensions");
            quickPick.placeholder = (0, nls_1.localize)('manageExtensions', "Choose which extensions can access this account");
            disposableStore.add(quickPick.onDidAccept(() => {
                const updatedAllowedList = quickPick.items
                    .filter((item) => item.type !== 'separator')
                    .map(i => i.extension);
                const allowedExtensionsSet = new Set(quickPick.selectedItems.map(i => i.extension));
                updatedAllowedList.forEach(extension => {
                    extension.allowed = allowedExtensionsSet.has(extension);
                });
                authenticationAccessService.updateAllowedExtensions(providerId, accountLabel, updatedAllowedList);
                quickPick.hide();
            }));
            disposableStore.add(quickPick.onDidHide(() => {
                disposableStore.dispose();
            }));
            disposableStore.add(quickPick.onDidCustom(() => {
                quickPick.hide();
            }));
            quickPick.show();
        }
    }
    exports.ManageTrustedExtensionsForAccountAction = ManageTrustedExtensionsForAccountAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlVHJ1c3RlZEV4dGVuc2lvbnNGb3JBY2NvdW50QWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYXV0aGVudGljYXRpb24vYnJvd3Nlci9hY3Rpb25zL21hbmFnZVRydXN0ZWRFeHRlbnNpb25zRm9yQWNjb3VudEFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSx1Q0FBd0MsU0FBUSxpQkFBTztRQUNuRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsb0NBQW9DO2dCQUN4QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsbUNBQW1DLEVBQUUsdUNBQXVDLENBQUM7Z0JBQzlGLFFBQVEsRUFBRSxJQUFBLGVBQVMsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO2dCQUMzQyxFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsT0FBc0Q7WUFDcEcsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZSxDQUFDLENBQUM7WUFDckQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFpQixDQUFDLENBQUM7WUFDekQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7WUFDM0QsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUFzQixDQUFDLENBQUM7WUFDbkUsTUFBTSwwQkFBMEIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdE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