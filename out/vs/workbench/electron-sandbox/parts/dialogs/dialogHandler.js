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
define(["require", "exports", "vs/nls", "vs/base/common/date", "vs/base/common/platform", "vs/platform/clipboard/common/clipboardService", "vs/platform/dialogs/common/dialogs", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/product/common/productService", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/base/browser/dom"], function (require, exports, nls_1, date_1, platform_1, clipboardService_1, dialogs_1, log_1, native_1, productService_1, globals_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeDialogHandler = void 0;
    let NativeDialogHandler = class NativeDialogHandler extends dialogs_1.AbstractDialogHandler {
        constructor(logService, nativeHostService, productService, clipboardService) {
            super();
            this.logService = logService;
            this.nativeHostService = nativeHostService;
            this.productService = productService;
            this.clipboardService = clipboardService;
        }
        async prompt(prompt) {
            this.logService.trace('DialogService#prompt', prompt.message);
            const buttons = this.getPromptButtons(prompt);
            const { response, checkboxChecked } = await this.nativeHostService.showMessageBox({
                type: this.getDialogType(prompt.type),
                title: prompt.title,
                message: prompt.message,
                detail: prompt.detail,
                buttons,
                cancelId: prompt.cancelButton ? buttons.length - 1 : -1 /* Disabled */,
                checkboxLabel: prompt.checkbox?.label,
                checkboxChecked: prompt.checkbox?.checked,
                targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId
            });
            return this.getPromptResult(prompt, response, checkboxChecked);
        }
        async confirm(confirmation) {
            this.logService.trace('DialogService#confirm', confirmation.message);
            const buttons = this.getConfirmationButtons(confirmation);
            const { response, checkboxChecked } = await this.nativeHostService.showMessageBox({
                type: this.getDialogType(confirmation.type) ?? 'question',
                title: confirmation.title,
                message: confirmation.message,
                detail: confirmation.detail,
                buttons,
                cancelId: buttons.length - 1,
                checkboxLabel: confirmation.checkbox?.label,
                checkboxChecked: confirmation.checkbox?.checked,
                targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId
            });
            return { confirmed: response === 0, checkboxChecked };
        }
        input() {
            throw new Error('Unsupported'); // we have no native API for password dialogs in Electron
        }
        async about() {
            let version = this.productService.version;
            if (this.productService.target) {
                version = `${version} (${this.productService.target} setup)`;
            }
            else if (this.productService.darwinUniversalAssetId) {
                version = `${version} (Universal)`;
            }
            const osProps = await this.nativeHostService.getOSProperties();
            const detailString = (useAgo) => {
                return (0, nls_1.localize)({ key: 'aboutDetail', comment: ['Electron, Chromium, Node.js and V8 are product names that need no translation'] }, "Version: {0}\nCommit: {1}\nDate: {2}\nElectron: {3}\nElectronBuildId: {4}\nChromium: {5}\nNode.js: {6}\nV8: {7}\nOS: {8}", version, this.productService.commit || 'Unknown', this.productService.date ? `${this.productService.date}${useAgo ? ' (' + (0, date_1.fromNow)(new Date(this.productService.date), true) + ')' : ''}` : 'Unknown', globals_1.process.versions['electron'], globals_1.process.versions['microsoft-build'], globals_1.process.versions['chrome'], globals_1.process.versions['node'], globals_1.process.versions['v8'], `${osProps.type} ${osProps.arch} ${osProps.release}${platform_1.isLinuxSnap ? ' snap' : ''}`);
            };
            const detail = detailString(true);
            const detailToCopy = detailString(false);
            const { response } = await this.nativeHostService.showMessageBox({
                type: 'info',
                message: this.productService.nameLong,
                detail: `\n${detail}`,
                buttons: [
                    (0, nls_1.localize)({ key: 'copy', comment: ['&& denotes a mnemonic'] }, "&&Copy"),
                    (0, nls_1.localize)('okButton', "OK")
                ],
                targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId
            });
            if (response === 0) {
                this.clipboardService.writeText(detailToCopy);
            }
        }
    };
    exports.NativeDialogHandler = NativeDialogHandler;
    exports.NativeDialogHandler = NativeDialogHandler = __decorate([
        __param(0, log_1.ILogService),
        __param(1, native_1.INativeHostService),
        __param(2, productService_1.IProductService),
        __param(3, clipboardService_1.IClipboardService)
    ], NativeDialogHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nSGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9lbGVjdHJvbi1zYW5kYm94L3BhcnRzL2RpYWxvZ3MvZGlhbG9nSGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSwrQkFBcUI7UUFFN0QsWUFDK0IsVUFBdUIsRUFDaEIsaUJBQXFDLEVBQ3hDLGNBQStCLEVBQzdCLGdCQUFtQztZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQUxzQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2hCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDeEMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzdCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7UUFHeEUsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNLENBQUksTUFBa0I7WUFDakMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTlELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUU5QyxNQUFNLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQztnQkFDakYsSUFBSSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDckMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO2dCQUNuQixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3ZCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtnQkFDckIsT0FBTztn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