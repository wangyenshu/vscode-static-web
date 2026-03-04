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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/decorators", "vs/base/common/network", "vs/platform/product/common/productService", "vs/platform/sign/common/abstractSignService"], function (require, exports, dom_1, window_1, decorators_1, network_1, productService_1, abstractSignService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignService = void 0;
    const KEY_SIZE = 32;
    const IV_SIZE = 16;
    const STEP_SIZE = KEY_SIZE + IV_SIZE;
    let SignService = class SignService extends abstractSignService_1.AbstractSignService {
        constructor(productService) {
            super();
            this.productService = productService;
        }
        getValidator() {
            return this.vsda().then(vsda => {
                const v = new vsda.validator();
                return {
                    createNewMessage: arg => v.createNewMessage(arg),
                    validate: arg => v.validate(arg),
                    dispose: () => v.free(),
                };
            });
        }
        signValue(arg) {
            return this.vsda().then(vsda => vsda.sign(arg));
        }
        async vsda() {
            const checkInterval = new dom_1.WindowIntervalTimer();
            let [wasm] = await Promise.all([
                this.getWasmBytes(),
                new Promise((resolve, reject) => {
                    require(['vsda'], resolve, reject);
                    // todo@connor4312: there seems to be a bug(?) in vscode-loader with
                    // require() not resolving in web once the script loads, so check manually
                    checkInterval.cancelAndSet(() => {
                        if (typeof vsda_web !== 'undefined') {
                            resolve();
                        }
                    }, 50, window_1.mainWindow);
                }).finally(() => checkInterval.dispose()),
            ]);
            const keyBytes = new TextEncoder().encode(this.productService.serverLicense?.join('\n') || '');
            for (let i = 0; i + STEP_SIZE < keyBytes.length; i += STEP_SIZE) {
                const key = await crypto.subtle.importKey('raw', keyBytes.slice(i + IV_SIZE, i + IV_SIZE + KEY_SIZE), { name: 'AES-CBC' }, false, ['decrypt']);
                wasm = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: keyBytes.slice(i, i + IV_SIZE) }, key, wasm);
            }
            await vsda_web.default(wasm);
            return vsda_web;
        }
        async getWasmBytes() {
            const response = await fetch(network_1.FileAccess.asBrowserUri('vsda/../vsda_bg.wasm').toString(true));
            if (!response.ok) {
                throw new Error('error loading vsda');
            }
            return response.arrayBuffer();
        }
    };
    exports.SignService = SignService;
    __decorate([
        decorators_1.memoize
    ], SignService.prototype, "vsda", null);
    exports.SignService = SignService = __decorate([
        __param(0, productService_1.IProductService)
    ], SignService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9zaWduL2Jyb3dzZXIvc2lnblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0NoRyxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDcEIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLE1BQU0sU0FBUyxHQUFHLFFBQVEsR0FBRyxPQUFPLENBQUM7SUFFOUIsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLHlDQUFtQjtRQUNuRCxZQUE4QyxjQUErQjtZQUM1RSxLQUFLLEVBQUUsQ0FBQztZQURxQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7UUFFN0UsQ0FBQztRQUNrQixZQUFZO1lBQzlCLE9BQU8sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDOUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQy9CLE9BQU87b0JBQ04sZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDO29CQUNoRCxRQUFRLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztvQkFDaEMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7aUJBQ3ZCLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFa0IsU0FBUyxDQUFDLEdBQVc7WUFDdkMsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFB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