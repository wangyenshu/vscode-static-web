/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreferencesLocalizedLabel = exports.ExtensionsLocalizedLabel = exports.IExtensionTipsService = exports.IGlobalExtensionEnablementService = exports.ENABLED_EXTENSIONS_STORAGE_PATH = exports.DISABLED_EXTENSIONS_STORAGE_PATH = exports.IExtensionManagementService = exports.ExtensionGalleryError = exports.ExtensionGalleryErrorCode = exports.ExtensionManagementError = exports.ExtensionManagementErrorCode = exports.IExtensionGalleryService = exports.InstallOperation = exports.StatisticType = exports.SortOrder = exports.SortBy = exports.EXTENSION_INSTALL_DEP_PACK_CONTEXT = exports.EXTENSION_INSTALL_SYNC_CONTEXT = exports.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT = exports.WEB_EXTENSION_TAG = exports.EXTENSION_IDENTIFIER_REGEX = exports.EXTENSION_IDENTIFIER_PATTERN = void 0;
    exports.TargetPlatformToString = TargetPlatformToString;
    exports.toTargetPlatform = toTargetPlatform;
    exports.getTargetPlatform = getTargetPlatform;
    exports.isNotWebExtensionInWebTargetPlatform = isNotWebExtensionInWebTargetPlatform;
    exports.isTargetPlatformCompatible = isTargetPlatformCompatible;
    exports.isIExtensionIdentifier = isIExtensionIdentifier;
    exports.EXTENSION_IDENTIFIER_PATTERN = '^([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$';
    exports.EXTENSION_IDENTIFIER_REGEX = new RegExp(exports.EXTENSION_IDENTIFIER_PATTERN);
    exports.WEB_EXTENSION_TAG = '__web_extension';
    exports.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT = 'skipWalkthrough';
    exports.EXTENSION_INSTALL_SYNC_CONTEXT = 'extensionsSync';
    exports.EXTENSION_INSTALL_DEP_PACK_CONTEXT = 'dependecyOrPackExtensionInstall';
    function TargetPlatformToString(targetPlatform) {
        switch (targetPlatform) {
            case "win32-x64" /* TargetPlatform.WIN32_X64 */: return 'Windows 64 bit';
            case "win32-arm64" /* TargetPlatform.WIN32_ARM64 */: return 'Windows ARM';
            case "linux-x64" /* TargetPlatform.LINUX_X64 */: return 'Linux 64 bit';
            case "linux-arm64" /* TargetPlatform.LINUX_ARM64 */: return 'Linux ARM 64';
            case "linux-armhf" /* TargetPlatform.LINUX_ARMHF */: return 'Linux ARM';
            case "alpine-x64" /* TargetPlatform.ALPINE_X64 */: return 'Alpine Linux 64 bit';
            case "alpine-arm64" /* TargetPlatform.ALPINE_ARM64 */: return 'Alpine ARM 64';
            case "darwin-x64" /* TargetPlatform.DARWIN_X64 */: return 'Mac';
            case "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */: return 'Mac Silicon';
            case "web" /* TargetPlatform.WEB */: return 'Web';
            case "universal" /* TargetPlatform.UNIVERSAL */: return "universal" /* TargetPlatform.UNIVERSAL */;
            case "unknown" /* TargetPlatform.UNKNOWN */: return "unknown" /* TargetPlatform.UNKNOWN */;
            case "undefined" /* TargetPlatform.UNDEFINED */: return "undefined" /* TargetPlatform.UNDEFINED */;
        }
    }
    function toTargetPlatform(targetPlatform) {
        switch (targetPlatform) {
            case "win32-x64" /* TargetPlatform.WIN32_X64 */: return "win32-x64" /* TargetPlatform.WIN32_X64 */;
            case "win32-arm64" /* TargetPlatform.WIN32_ARM64 */: return "win32-arm64" /* TargetPlatform.WIN32_ARM64 */;
            case "linux-x64" /* TargetPlatform.LINUX_X64 */: return "linux-x64" /* TargetPlatform.LINUX_X64 */;
            case "linux-arm64" /* TargetPlatform.LINUX_ARM64 */: return "linux-arm64" /* TargetPlatform.LINUX_ARM64 */;
            case "linux-armhf" /* TargetPlatform.LINUX_ARMHF */: return "linux-armhf" /* TargetPlatform.LINUX_ARMHF */;
            case "alpine-x64" /* TargetPlatform.ALPINE_X64 */: return "alpine-x64" /* TargetPlatform.ALPINE_X64 */;
            case "alpine-arm64" /* TargetPlatform.ALPINE_ARM64 */: return "alpine-arm64" /* TargetPlatform.ALPINE_ARM64 */;
            case "darwin-x64" /* TargetPlatform.DARWIN_X64 */: return "darwin-x64" /* TargetPlatform.DARWIN_X64 */;
            case "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */: return "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */;
            case "web" /* TargetPlatform.WEB */: return "web" /* TargetPlatform.WEB */;
            case "universal" /* TargetPlatform.UNIVERSAL */: return "universal" /* TargetPlatform.UNIVERSAL */;
            default: return "unknown" /* TargetPlatform.UNKNOWN */;
        }
    }
    function getTargetPlatform(platform, arch) {
        switch (platform) {
            case 3 /* Platform.Windows */:
                if (arch === 'x64') {
                    return "win32-x64" /* TargetPlatform.WIN32_X64 */;
                }
                if (arch === 'arm64') {
                    return "win32-arm64" /* TargetPlatform.WIN32_ARM64 */;
                }
                return "unknown" /* TargetPlatform.UNKNOWN */;
            case 2 /* Platform.Linux */:
                if (arch === 'x64') {
                    return "linux-x64" /* TargetPlatform.LINUX_X64 */;
                }
                if (arch === 'arm64') {
                    return "linux-arm64" /* TargetPlatform.LINUX_ARM64 */;
                }
                if (arch === 'arm') {
                    return "linux-armhf" /* TargetPlatform.LINUX_ARMHF */;
                }
                return "unknown" /* TargetPlatform.UNKNOWN */;
            case 'alpine':
                if (arch === 'x64') {
                    return "alpine-x64" /* TargetPlatform.ALPINE_X64 */;
                }
                if (arch === 'arm64') {
                    return "alpine-arm64" /* TargetPlatform.ALPINE_ARM64 */;
                }
                return "unknown" /* TargetPlatform.UNKNOWN */;
            case 1 /* Platform.Mac */:
                if (arch === 'x64') {
                    return "darwin-x64" /* TargetPlatform.DARWIN_X64 */;
                }
                if (arch === 'arm64') {
                    return "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */;
                }
                return "unknown" /* TargetPlatform.UNKNOWN */;
            case 0 /* Platform.Web */: return "web" /* TargetPlatform.WEB */;
        }
    }
    function isNotWebExtensionInWebTargetPlatform(allTargetPlatforms, productTargetPlatform) {
        // Not a web extension in web target platform
        return productTargetPlatform === "web" /* TargetPlatform.WEB */ && !allTargetPlatforms.includes("web" /* TargetPlatform.WEB */);
    }
    function isTargetPlatformCompatible(extensionTargetPlatform, allTargetPlatforms, productTargetPlatform) {
        // Not compatible when extension is not a web extension in web target platform
        if (isNotWebExtensionInWebTargetPlatform(allTargetPlatforms, productTargetPlatform)) {
            return false;
        }
        // Compatible when extension target platform is not defined
        if (extensionTargetPlatform === "undefined" /* TargetPlatform.UNDEFINED */) {
            return true;
        }
        // Compatible when extension target platform is universal
        if (extensionTargetPlatform === "universal" /* TargetPlatform.UNIVERSAL */) {
            return true;
        }
        // Not compatible when extension target platform is unknown
        if (extensionTargetPlatform === "unknown" /* TargetPlatform.UNKNOWN */) {
            return false;
        }
        // Compatible when extension and product target platforms matches
        if (extensionTargetPlatform === productTargetPlatform) {
            return true;
        }
        return false;
    }
    function isIExtensionIdentifier(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.id === 'string'
            && (!thing.uuid || typeof thing.uuid === 'string');
    }
    var SortBy;
    (function (SortBy) {
        SortBy[SortBy["NoneOrRelevance"] = 0] = "NoneOrRelevance";
        SortBy[SortBy["LastUpdatedDate"] = 1] = "LastUpdatedDate";
        SortBy[SortBy["Title"] = 2] = "Title";
        SortBy[SortBy["PublisherName"] = 3] = "PublisherName";
        SortBy[SortBy["InstallCount"] = 4] = "InstallCount";
        SortBy[SortBy["PublishedDate"] = 10] = "PublishedDate";
        SortBy[SortBy["AverageRating"] = 6] = "AverageRating";
        SortBy[SortBy["WeightedRating"] = 12] = "WeightedRating";
    })(SortBy || (exports.SortBy = SortBy = {}));
    var SortOrder;
    (function (SortOrder) {
        SortOrder[SortOrder["Default"] = 0] = "Default";
        SortOrder[SortOrder["Ascending"] = 1] = "Ascending";
        SortOrder[SortOrder["Descending"] = 2] = "Descending";
    })(SortOrder || (exports.SortOrder = SortOrder = {}));
    var StatisticType;
    (function (StatisticType) {
        StatisticType["Install"] = "install";
        StatisticType["Uninstall"] = "uninstall";
    })(StatisticType || (exports.StatisticType = StatisticType = {}));
    var InstallOperation;
    (function (InstallOperation) {
        InstallOperation[InstallOperation["None"] = 1] = "None";
        InstallOperation[InstallOperation["Install"] = 2] = "Install";
        InstallOperation[InstallOperation["Update"] = 3] = "Update";
        InstallOperation[InstallOperation["Migrate"] = 4] = "Migrate";
    })(InstallOperation || (exports.InstallOperation = InstallOperation = {}));
    exports.IExtensionGalleryService = (0, instantiation_1.createDecorator)('extensionGalleryService');
    var ExtensionManagementErrorCode;
    (function (ExtensionManagementErrorCode) {
        ExtensionManagementErrorCode["Unsupported"] = "Unsupported";
        ExtensionManagementErrorCode["Deprecated"] = "Deprecated";
        ExtensionManagementErrorCode["Malicious"] = "Malicious";
        ExtensionManagementErrorCode["Incompatible"] = "Incompatible";
        ExtensionManagementErrorCode["IncompatibleTargetPlatform"] = "IncompatibleTargetPlatform";
        ExtensionManagementErrorCode["ReleaseVersionNotFound"] = "ReleaseVersionNotFound";
        ExtensionManagementErrorCode["Invalid"] = "Invalid";
        ExtensionManagementErrorCode["Download"] = "Download";
        ExtensionManagementErrorCode["DownloadSignature"] = "DownloadSignature";
        ExtensionManagementErrorCode["UpdateMetadata"] = "UpdateMetadata";
        ExtensionManagementErrorCode["Extract"] = "Extract";
        ExtensionManagementErrorCode["Scanning"] = "Scanning";
        ExtensionManagementErrorCode["Delete"] = "Delete";
        ExtensionManagementErrorCode["Rename"] = "Rename";
        ExtensionManagementErrorCode["CorruptZip"] = "CorruptZip";
        ExtensionManagementErrorCode["IncompleteZip"] = "IncompleteZip";
        ExtensionManagementErrorCode["Signature"] = "Signature";
        ExtensionManagementErrorCode["NotAllowed"] = "NotAllowed";
        ExtensionManagementErrorCode["Gallery"] = "Gallery";
        ExtensionManagementErrorCode["Cancelled"] = "Cancelled";
        ExtensionManagementErrorCode["Unknown"] = "Unknown";
        ExtensionManagementErrorCode["Internal"] = "Internal";
    })(ExtensionManagementErrorCode || (exports.ExtensionManagementErrorCode = ExtensionManagementErrorCode = {}));
    class ExtensionManagementError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
            this.name = code;
        }
    }
    exports.ExtensionManagementError = ExtensionManagementError;
    var ExtensionGalleryErrorCode;
    (function (ExtensionGalleryErrorCode) {
        ExtensionGalleryErrorCode["Timeout"] = "Timeout";
        ExtensionGalleryErrorCode["Cancelled"] = "Cancelled";
        ExtensionGalleryErrorCode["Failed"] = "Failed";
    })(ExtensionGalleryErrorCode || (exports.ExtensionGalleryErrorCode = ExtensionGalleryErrorCode = {}));
    class ExtensionGalleryError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
            this.name = code;
        }
    }
    exports.ExtensionGalleryError = ExtensionGalleryError;
    exports.IExtensionManagementService = (0, instantiation_1.createDecorator)('extensionManagementService');
    exports.DISABLED_EXTENSIONS_STORAGE_PATH = 'extensionsIdentifiers/disabled';
    exports.ENABLED_EXTENSIONS_STORAGE_PATH = 'extensionsIdentifiers/enabled';
    exports.IGlobalExtensionEnablementService = (0, instantiation_1.createDecorator)('IGlobalExtensionEnablementService');
    exports.IExtensionTipsService = (0, instantiation_1.createDecorator)('IExtensionTipsService');
    exports.ExtensionsLocalizedLabel = (0, nls_1.localize2)('extensions', "Extensions");
    exports.PreferencesLocalizedLabel = (0, nls_1.localize2)('preferences', 'Preferences');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvbk1hbmFnZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0JoRyx3REFxQkM7SUFFRCw0Q0FvQkM7SUFFRCw4Q0EyQ0M7SUFFRCxvRkFHQztJQUVELGdFQTJCQztJQTRCRCx3REFLQztJQXZLWSxRQUFBLDRCQUE0QixHQUFHLDJEQUEyRCxDQUFDO0lBQzNGLFFBQUEsMEJBQTBCLEdBQUcsSUFBSSxNQUFNLENBQUMsb0NBQTRCLENBQUMsQ0FBQztJQUN0RSxRQUFBLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDO0lBQ3RDLFFBQUEsMENBQTBDLEdBQUcsaUJBQWlCLENBQUM7SUFDL0QsUUFBQSw4QkFBOEIsR0FBRyxnQkFBZ0IsQ0FBQztJQUNsRCxRQUFBLGtDQUFrQyxHQUFHLGlDQUFpQyxDQUFDO0lBT3BGLFNBQWdCLHNCQUFzQixDQUFDLGNBQThCO1FBQ3BFLFFBQVEsY0FBYyxFQUFFLENBQUM7WUFDeEIsK0NBQTZCLENBQUMsQ0FBQyxPQUFPLGdCQUFnQixDQUFDO1lBQ3ZELG1EQUErQixDQUFDLENBQUMsT0FBTyxhQUFhLENBQUM7WUFFdEQsK0NBQTZCLENBQUMsQ0FBQyxPQUFPLGNBQWMsQ0FBQztZQUNyRCxtREFBK0IsQ0FBQyxDQUFDLE9BQU8sY0FBYyxDQUFDO1lBQ3ZELG1EQUErQixDQUFDLENBQUMsT0FBTyxXQUFXLENBQUM7WUFFcEQsaURBQThCLENBQUMsQ0FBQyxPQUFPLHFCQUFxQixDQUFDO1lBQzdELHFEQUFnQyxDQUFDLENBQUMsT0FBTyxlQUFlLENBQUM7WUFFekQsaURBQThCLENBQUMsQ0FBQyxPQUFPLEtBQUss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