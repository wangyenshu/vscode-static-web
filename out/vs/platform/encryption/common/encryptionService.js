/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KnownStorageProvider = exports.PasswordStoreCLIOption = exports.IEncryptionMainService = exports.IEncryptionService = void 0;
    exports.isKwallet = isKwallet;
    exports.isGnome = isGnome;
    exports.IEncryptionService = (0, instantiation_1.createDecorator)('encryptionService');
    exports.IEncryptionMainService = (0, instantiation_1.createDecorator)('encryptionMainService');
    // The values provided to the `password-store` command line switch.
    // Notice that they are not the same as the values returned by
    // `getSelectedStorageBackend` in the `safeStorage` API.
    var PasswordStoreCLIOption;
    (function (PasswordStoreCLIOption) {
        PasswordStoreCLIOption["kwallet"] = "kwallet";
        PasswordStoreCLIOption["kwallet5"] = "kwallet5";
        PasswordStoreCLIOption["gnomeLibsecret"] = "gnome-libsecret";
        PasswordStoreCLIOption["basic"] = "basic";
    })(PasswordStoreCLIOption || (exports.PasswordStoreCLIOption = PasswordStoreCLIOption = {}));
    // The values returned by `getSelectedStorageBackend` in the `safeStorage` API.
    var KnownStorageProvider;
    (function (KnownStorageProvider) {
        KnownStorageProvider["unknown"] = "unknown";
        KnownStorageProvider["basicText"] = "basic_text";
        // Linux
        KnownStorageProvider["gnomeAny"] = "gnome_any";
        KnownStorageProvider["gnomeLibsecret"] = "gnome_libsecret";
        KnownStorageProvider["gnomeKeyring"] = "gnome_keyring";
        KnownStorageProvider["kwallet"] = "kwallet";
        KnownStorageProvider["kwallet5"] = "kwallet5";
        KnownStorageProvider["kwallet6"] = "kwallet6";
        // The rest of these are not returned by `getSelectedStorageBackend`
        // but these were added for platform completeness.
        // Windows
        KnownStorageProvider["dplib"] = "dpapi";
        // macOS
        KnownStorageProvider["keychainAccess"] = "keychain_access";
    })(KnownStorageProvider || (exports.KnownStorageProvider = KnownStorageProvider = {}));
    function isKwallet(backend) {
        return backend === "kwallet" /* KnownStorageProvider.kwallet */
            || backend === "kwallet5" /* KnownStorageProvider.kwallet5 */
            || backend === "kwallet6" /* KnownStorageProvider.kwallet6 */;
    }
    function isGnome(backend) {
        return backend === "gnome_any" /* KnownStorageProvider.gnomeAny */
            || backend === "gnome_libsecret" /* KnownStorageProvider.gnomeLibsecret */
            || backend === "gnome_keyring" /* KnownStorageProvider.gnomeKeyring */;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jcnlwdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9lbmNyeXB0aW9uL2NvbW1vbi9lbmNyeXB0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5RGhHLDhCQUlDO0lBRUQsMEJBSUM7SUEvRFksUUFBQSxrQkFBa0IsR0FBRyxJQUFBLCtCQUFlLEVBQXFCLG1CQUFtQixDQUFDLENBQUM7SUFNOUUsUUFBQSxzQkFBc0IsR0FBRyxJQUFBLCtCQUFlLEVBQXlCLHVCQUF1QixDQUFDLENBQUM7SUFjdkcsbUVBQW1FO0lBQ25FLDhEQUE4RDtJQUM5RCx3REFBd0Q7SUFDeEQsSUFBa0Isc0JBS2pCO0lBTEQsV0FBa0Isc0JBQXNCO1FBQ3ZDLDZDQUFtQixDQUFBO1FBQ25CLCtDQUFxQixDQUFBO1FBQ3JCLDREQUFrQyxDQUFBO1FBQ2xDLHlDQUFlLENBQUE7SUFDaEIsQ0FBQyxFQUxpQixzQkFBc0Isc0NBQXRCLHNCQUFzQixRQUt2QztJQUVELCtFQUErRTtJQUMvRSxJQUFrQixvQkFvQmpCO0lBcEJELFdBQWtCLG9CQUFvQjtRQUNyQywyQ0FBbUIsQ0FBQTtRQUNuQixnREFBd0IsQ0FBQTtRQUV4QixRQUFRO1FBQ1IsOENBQXNCLENBQUE7UUFDdEIsMERBQWtDLENBQUE7UUFDbEMsc0RBQThCLENBQUE7UUFDOUIsMkNBQW1CLENBQUE7UUFDbkIsNkNBQXFCLENBQUE7UUFDckIsNkNBQXFCLENBQUE7UUFFckIsb0VBQW9FO1FBQ3BFLGtEQUFrRDtRQUVsRCxVQUFVO1FBQ1YsdUNBQWUsQ0FBQTtRQUVmLFFBQVE7UUFDUiwwREFBa0MsQ0FBQTtJQUNuQyxDQUFDLEVBcEJpQixvQkFBb0Isb0NBQXBCLG9CQUFvQixRQW9CckM7SUFFRCxTQUFnQixTQUFTLENBQUMsT0FBZTtRQUN4QyxPQUFPLE9BQU8saURBQWlDO2VBQzNDLE9BQU8sbURBQWtDO2VBQ3pDLE9BQU8sbURBQWtDLENBQUM7SUFDL0MsQ0FBQztJQUVELFNBQWdCLE9BQU8sQ0FBQyxPQUFlO1FBQ3RDLE9BQU8sT0FBTyxvREFBa0M7ZUFDNUMsT0FBTyxnRUFBd0M7ZUFDL0MsT0FBTyw0REFBc0MsQ0FBQztJQUNuRCxDQUFDIn0=