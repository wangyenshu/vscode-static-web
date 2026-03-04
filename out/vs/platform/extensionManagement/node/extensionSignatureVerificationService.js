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
define(["require", "exports", "vs/base/common/errors", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry"], function (require, exports, errors_1, instantiation_1, log_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionSignatureVerificationService = exports.ExtensionSignatureVerificationError = exports.ExtensionSignatureVerificationCode = exports.IExtensionSignatureVerificationService = void 0;
    exports.IExtensionSignatureVerificationService = (0, instantiation_1.createDecorator)('IExtensionSignatureVerificationService');
    var ExtensionSignatureVerificationCode;
    (function (ExtensionSignatureVerificationCode) {
        ExtensionSignatureVerificationCode["None"] = "None";
        ExtensionSignatureVerificationCode["RequiredArgumentMissing"] = "RequiredArgumentMissing";
        ExtensionSignatureVerificationCode["InvalidArgument"] = "InvalidArgument";
        ExtensionSignatureVerificationCode["PackageIsUnreadable"] = "PackageIsUnreadable";
        ExtensionSignatureVerificationCode["UnhandledException"] = "UnhandledException";
        ExtensionSignatureVerificationCode["SignatureManifestIsMissing"] = "SignatureManifestIsMissing";
        ExtensionSignatureVerificationCode["SignatureManifestIsUnreadable"] = "SignatureManifestIsUnreadable";
        ExtensionSignatureVerificationCode["SignatureIsMissing"] = "SignatureIsMissing";
        ExtensionSignatureVerificationCode["SignatureIsUnreadable"] = "SignatureIsUnreadable";
        ExtensionSignatureVerificationCode["CertificateIsUnreadable"] = "CertificateIsUnreadable";
        ExtensionSignatureVerificationCode["SignatureArchiveIsUnreadable"] = "SignatureArchiveIsUnreadable";
        ExtensionSignatureVerificationCode["FileAlreadyExists"] = "FileAlreadyExists";
        ExtensionSignatureVerificationCode["SignatureArchiveIsInvalidZip"] = "SignatureArchiveIsInvalidZip";
        ExtensionSignatureVerificationCode["SignatureArchiveHasSameSignatureFile"] = "SignatureArchiveHasSameSignatureFile";
        ExtensionSignatureVerificationCode["Success"] = "Success";
        ExtensionSignatureVerificationCode["PackageIntegrityCheckFailed"] = "PackageIntegrityCheckFailed";
        ExtensionSignatureVerificationCode["SignatureIsInvalid"] = "SignatureIsInvalid";
        ExtensionSignatureVerificationCode["SignatureManifestIsInvalid"] = "SignatureManifestIsInvalid";
        ExtensionSignatureVerificationCode["SignatureIntegrityCheckFailed"] = "SignatureIntegrityCheckFailed";
        ExtensionSignatureVerificationCode["EntryIsMissing"] = "EntryIsMissing";
        ExtensionSignatureVerificationCode["EntryIsTampered"] = "EntryIsTampered";
        ExtensionSignatureVerificationCode["Untrusted"] = "Untrusted";
        ExtensionSignatureVerificationCode["CertificateRevoked"] = "CertificateRevoked";
        ExtensionSignatureVerificationCode["SignatureIsNotValid"] = "SignatureIsNotValid";
        ExtensionSignatureVerificationCode["UnknownError"] = "UnknownError";
        ExtensionSignatureVerificationCode["PackageIsInvalidZip"] = "PackageIsInvalidZip";
        ExtensionSignatureVerificationCode["SignatureArchiveHasTooManyEntries"] = "SignatureArchiveHasTooManyEntries";
    })(ExtensionSignatureVerificationCode || (exports.ExtensionSignatureVerificationCode = ExtensionSignatureVerificationCode = {}));
    class ExtensionSignatureVerificationError extends Error {
        constructor(code) {
            super(code);
            this.code = code;
        }
    }
    exports.ExtensionSignatureVerificationError = ExtensionSignatureVerificationError;
    let ExtensionSignatureVerificationService = class ExtensionSignatureVerificationService {
        constructor(logService, telemetryService) {
            this.logService = logService;
            this.telemetryService = telemetryService;
        }
        vsceSign() {
            if (!this.moduleLoadingPromise) {
                this.moduleLoadingPromise = new Promise((resolve, reject) => require(['@vscode/vsce-sign'], async (obj) => {
                    const instance = obj;
                    return resolve(instance);
                }, reject));
            }
            return this.moduleLoadingPromise;
        }
        async verify(extensionId, vsixFilePath, signatureArchiveFilePath) {
            let module;
            try {
                module = await this.vsceSign();
            }
            catch (error) {
                this.logService.error('Could not load vsce-sign module', (0, errors_1.getErrorMessage)(error));
                this.logService.info(`Extension signature verification is not done: ${extensionId}`);
                return false;
            }
            const startTime = new Date().getTime();
            let result;
            try {
                result = await module.verify(vsixFilePath, signatureArchiveFilePath, this.logService.getLevel() === log_1.LogLevel.Trace);
            }
            catch (e) {
                result = {
                    code: "UnknownError" /* ExtensionSignatureVerificationCode.UnknownError */,
                    didExecute: false,
                    output: (0, errors_1.getErrorMessage)(e)
                };
            }
            const duration = new Date().getTime() - startTime;
            this.logService.info(`Extension signature verification result for ${extensionId}: ${result.code}. Duration: ${duration}ms.`);
            this.logService.trace(`Extension signature verification output for ${extensionId}:\n${result.output}`);
            this.telemetryService.publicLog2('extensionsignature:verification', {
                extensionId,
                code: result.code,
                duration,
                didExecute: result.didExecute
            });
            if (result.code === "Success" /* ExtensionSignatureVerificationCode.Success */) {
                return true;
            }
            throw new ExtensionSignatureVerificationError(result.code);
        }
    };
    exports.ExtensionSignatureVerificationService = ExtensionSignatureVerificationService;
    exports.ExtensionSignatureVerificationService = ExtensionSignatureVerificationService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, telemetry_1.ITelemetryService)
    ], ExtensionSignatureVerificationService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uU2lnbmF0dXJlVmVyaWZpY2F0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvbm9kZS9leHRlbnNpb25TaWduYXR1cmVWZXJpZmljYXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU9uRixRQUFBLHNDQUFzQyxHQUFHLElBQUEsK0JBQWUsRUFBeUMsd0NBQXdDLENBQUMsQ0FBQztJQXlCeEosSUFBa0Isa0NBNkJqQjtJQTdCRCxXQUFrQixrQ0FBa0M7UUFDbkQsbURBQWUsQ0FBQTtRQUNmLHlGQUFxRCxDQUFBO1FBQ3JELHlFQUFxQyxDQUFBO1FBQ3JDLGlGQUE2QyxDQUFBO1FBQzdDLCtFQUEyQyxDQUFBO1FBQzNDLCtGQUEyRCxDQUFBO1FBQzNELHFHQUFpRSxDQUFBO1FBQ2pFLCtFQUEyQyxDQUFBO1FBQzNDLHFGQUFpRCxDQUFBO1FBQ2pELHlGQUFxRCxDQUFBO1FBQ3JELG1HQUErRCxDQUFBO1FBQy9ELDZFQUF5QyxDQUFBO1FBQ3pDLG1HQUErRCxDQUFBO1FBQy9ELG1IQUErRSxDQUFBO1FBRS9FLHlEQUFxQixDQUFBO1FBQ3JCLGlHQUE2RCxDQUFBO1FBQzdELCtFQUEyQyxDQUFBO1FBQzNDLCtGQUEyRCxDQUFBO1FBQzNELHFHQUFpRSxDQUFBO1FBQ2pFLHVFQUFtQyxDQUFBO1FBQ25DLHlFQUFxQyxDQUFBO1FBQ3JDLDZEQUF5QixDQUFBO1FBQ3pCLCtFQUEyQyxDQUFBO1FBQzNDLGlGQUE2QyxDQUFBO1FBQzdDLG1FQUErQixDQUFBO1FBQy9CLGlGQUE2QyxDQUFBO1FBQzdDLDZHQUF5RSxDQUFBO0lBQzFFLENBQUMsRUE3QmlCLGtDQUFrQyxrREFBbEMsa0NBQWtD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