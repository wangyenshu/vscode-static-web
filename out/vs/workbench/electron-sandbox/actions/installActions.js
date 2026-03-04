/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/product/common/product", "vs/platform/dialogs/common/dialogs", "vs/platform/native/common/native", "vs/base/common/errorMessage", "vs/platform/product/common/productService", "vs/base/common/errors"], function (require, exports, nls_1, actions_1, product_1, dialogs_1, native_1, errorMessage_1, productService_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UninstallShellScriptAction = exports.InstallShellScriptAction = void 0;
    const shellCommandCategory = (0, nls_1.localize2)('shellCommand', 'Shell Command');
    class InstallShellScriptAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.installCommandLine',
                title: (0, nls_1.localize2)('install', "Install '{0}' command in PATH", product_1.default.applicationName),
                category: shellCommandCategory,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const productService = accessor.get(productService_1.IProductService);
            try {
                await nativeHostService.installShellCommand();
                dialogService.info((0, nls_1.localize)('successIn', "Shell command '{0}' successfully installed in PATH.", productService.applicationName));
            }
            catch (error) {
                if ((0, errors_1.isCancellationError)(error)) {
                    return;
                }
                dialogService.error((0, errorMessage_1.toErrorMessage)(error));
            }
        }
    }
    exports.InstallShellScriptAction = InstallShellScriptAction;
    class UninstallShellScriptAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.uninstallCommandLine',
                title: (0, nls_1.localize2)('uninstall', "Uninstall '{0}' command from PATH", product_1.default.applicationName),
                category: shellCommandCategory,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const productService = accessor.get(productService_1.IProductService);
            try {
                await nativeHostService.uninstallShellCommand();
                dialogService.info((0, nls_1.localize)('successFrom', "Shell command '{0}' successfully uninstalled from PATH.", productService.applicationName));
            }
            catch (error) {
                if ((0, errors_1.isCancellationError)(error)) {
                    return;
                }
                dialogService.error((0, errorMessage_1.toErrorMessage)(error));
            }
        }
    }
    exports.UninstallShellScriptAction = UninstallShellScriptAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvZWxlY3Ryb24tc2FuZGJveC9hY3Rpb25zL2luc3RhbGxBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFNLG9CQUFvQixHQUFxQixJQUFBLGVBQVMsRUFBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFFMUYsTUFBYSx3QkFBeUIsU0FBUSxpQkFBTztRQUVwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUscUNBQXFDO2dCQUN6QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsU0FBUyxFQUFFLCtCQUErQixFQUFFLGlCQUFPLENBQUMsZUFBZSxDQUFDO2dCQUNyRixRQUFRLEVBQUUsb0JBQW9CO2dCQUM5QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBa0IsQ0FBQyxDQUFDO1lBQzNELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0NBQWUsQ0FBQyxDQUFDO1lBRXJELElBQUksQ0FBQztnQkFDSixNQUFNLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBRTlDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLHFEQUFxRCxFQUFFLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQ2xJLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLElBQUEsNEJBQW1CLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsT0FBTztnQkFDUixDQUFDO2dCQUVELGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNGLENBQUM7S0FDRDtJQTVCRCw0REE0QkM7SUFFRCxNQUFhLDBCQUEyQixTQUFRLGlCQUFPO1FBRXREO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx1Q0FBdUM7Z0JBQzNDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxXQUFXLEVBQUUsbUNBQW1DLEVBQUUsaUJBQU8sQ0FBQyxlQUFlLENBQUM7Z0JBQzNGLFFBQVEsRUFBRSxvQkFBb0I7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFrQixDQUFDLENBQUM7WUFDM0QsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZSxDQUFDLENBQUM7WUFFckQsSUFBSSxDQUFDO2dCQUNKLE1BQU0saUJBQWlCLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFFaEQsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUseURBQXlELEVBQUUsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDeEksQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksSUFBQSw0QkFBbUIsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNoQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM1QyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBNUJELGdFQTRCQyJ9