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
define(["require", "exports", "electron", "vs/base/common/platform", "vs/platform/log/common/log"], function (require, exports, electron_1, platform_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncryptionMainService = void 0;
    const safeStorage = electron_1.safeStorage;
    let EncryptionMainService = class EncryptionMainService {
        constructor(logService) {
            this.logService = logService;
            // if this commandLine switch is set, the user has opted in to using basic text encryption
            if (electron_1.app.commandLine.getSwitchValue('password-store') === "basic" /* PasswordStoreCLIOption.basic */) {
                safeStorage.setUsePlainTextEncryption?.(true);
            }
        }
        async encrypt(value) {
            this.logService.trace('[EncryptionMainService] Encrypting value.');
            try {
                const result = JSON.stringify(safeStorage.encryptString(value));
                this.logService.trace('[EncryptionMainService] Encrypted value.');
                return result;
            }
            catch (e) {
                this.logService.error(e);
                throw e;
            }
        }
        async decrypt(value) {
            let parsedValue;
            try {
                parsedValue = JSON.parse(value);
                if (!parsedValue.data) {
                    throw new Error(`[EncryptionMainService] Invalid encrypted value: ${value}`);
                }
                const bufferToDecrypt = Buffer.from(parsedValue.data);
                this.logService.trace('[EncryptionMainService] Decrypting value.');
                const result = safeStorage.decryptString(bufferToDecrypt);
                this.logService.trace('[EncryptionMainService] Decrypted value.');
                return result;
            }
            catch (e) {
                this.logService.error(e);
                throw e;
            }
        }
        isEncryptionAvailable() {
            return Promise.resolve(safeStorage.isEncryptionAvailable());
        }
        getKeyStorageProvider() {
            if (platform_1.isWindows) {
                return Promise.resolve("dpapi" /* KnownStorageProvider.dplib */);
            }
            if (platform_1.isMacintosh) {
                return Promise.resolve("keychain_access" /* KnownStorageProvider.keychainAccess */);
            }
            if (safeStorage.getSelectedStorageBackend) {
                try {
                    const result = safeStorage.getSelectedStorageBackend();
                    return Promise.resolve(result);
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            return Promise.resolve("unknown" /* KnownStorageProvider.unknown */);
        }
        async setUsePlainTextEncryption() {
            if (platform_1.isWindows) {
                throw new Error('Setting plain text encryption is not supported on Windows.');
            }
            if (platform_1.isMacintosh) {
                throw new Error('Setting plain text encryption is not supported on macOS.');
            }
            if (!safeStorage.setUsePlainTextEncryption) {
                throw new Error('Setting plain text encryption is not supported.');
            }
            safeStorage.setUsePlainTextEncryption(true);
        }
    };
    exports.EncryptionMainService = EncryptionMainService;
    exports.EncryptionMainService = EncryptionMainService = __decorate([
        __param(0, log_1.ILogService)
    ], EncryptionMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jcnlwdGlvbk1haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZW5jcnlwdGlvbi9lbGVjdHJvbi1tYWluL2VuY3J5cHRpb25NYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjaEcsTUFBTSxXQUFXLEdBQWdGLHNCQUFtQixDQUFDO0lBRTlHLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCO1FBR2pDLFlBQytCLFVBQXVCO1lBQXZCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFFckQsMEZBQTBGO1lBQzFGLElBQUksY0FBRyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsK0NBQWlDLEVBQUUsQ0FBQztnQkFDdkYsV0FBVyxDQUFDLHlCQUF5QixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0MsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQWE7WUFDMUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUM7Z0JBQ0osTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7Z0JBQ2xFLE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLE1BQU0sQ0FBQyxDQUFDO1lBQ1QsQ0FBQztRQUNGLENBQUM7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