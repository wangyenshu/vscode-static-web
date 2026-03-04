/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/platform/remote/common/remoteHosts"], function (require, exports, strings, instantiation_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IBuiltinExtensionsScannerService = exports.ExtensionIdentifierMap = exports.ExtensionIdentifierSet = exports.ExtensionIdentifier = exports.TargetPlatform = exports.ExtensionType = exports.EXTENSION_CATEGORIES = exports.ALL_EXTENSION_KINDS = exports.UNDEFINED_PUBLISHER = exports.BUILTIN_MANIFEST_CACHE_FILE = exports.USER_MANIFEST_CACHE_FILE = void 0;
    exports.getWorkspaceSupportTypeMessage = getWorkspaceSupportTypeMessage;
    exports.isApplicationScopedExtension = isApplicationScopedExtension;
    exports.isLanguagePackExtension = isLanguagePackExtension;
    exports.isAuthenticationProviderExtension = isAuthenticationProviderExtension;
    exports.isResolverExtension = isResolverExtension;
    exports.USER_MANIFEST_CACHE_FILE = 'extensions.user.cache';
    exports.BUILTIN_MANIFEST_CACHE_FILE = 'extensions.builtin.cache';
    exports.UNDEFINED_PUBLISHER = 'undefined_publisher';
    exports.ALL_EXTENSION_KINDS = ['ui', 'workspace', 'web'];
    function getWorkspaceSupportTypeMessage(supportType) {
        if (typeof supportType === 'object' && supportType !== null) {
            if (supportType.supported !== true) {
                return supportType.description;
            }
        }
        return undefined;
    }
    exports.EXTENSION_CATEGORIES = [
        'Azure',
        'Data Science',
        'Debuggers',
        'Extension Packs',
        'Education',
        'Formatters',
        'Keymaps',
        'Language Packs',
        'Linters',
        'Machine Learning',
        'Notebooks',
        'Programming Languages',
        'SCM Providers',
        'Snippets',
        'Testing',
        'Themes',
        'Visualization',
        'AI',
        'Chat',
        'Other',
    ];
    var ExtensionType;
    (function (ExtensionType) {
        ExtensionType[ExtensionType["System"] = 0] = "System";
        ExtensionType[ExtensionType["User"] = 1] = "User";
    })(ExtensionType || (exports.ExtensionType = ExtensionType = {}));
    var TargetPlatform;
    (function (TargetPlatform) {
        TargetPlatform["WIN32_X64"] = "win32-x64";
        TargetPlatform["WIN32_ARM64"] = "win32-arm64";
        TargetPlatform["LINUX_X64"] = "linux-x64";
        TargetPlatform["LINUX_ARM64"] = "linux-arm64";
        TargetPlatform["LINUX_ARMHF"] = "linux-armhf";
        TargetPlatform["ALPINE_X64"] = "alpine-x64";
        TargetPlatform["ALPINE_ARM64"] = "alpine-arm64";
        TargetPlatform["DARWIN_X64"] = "darwin-x64";
        TargetPlatform["DARWIN_ARM64"] = "darwin-arm64";
        TargetPlatform["WEB"] = "web";
        TargetPlatform["UNIVERSAL"] = "universal";
        TargetPlatform["UNKNOWN"] = "unknown";
        TargetPlatform["UNDEFINED"] = "undefined";
    })(TargetPlatform || (exports.TargetPlatform = TargetPlatform = {}));
    /**
     * **!Do not construct directly!**
     *
     * **!Only static methods because it gets serialized!**
     *
     * This represents the "canonical" version for an extension identifier. Extension ids
     * have to be case-insensitive (due to the marketplace), but we must ensure case
     * preservation because the extension API is already public at this time.
     *
     * For example, given an extension with the publisher `"Hello"` and the name `"World"`,
     * its canonical extension identifier is `"Hello.World"`. This extension could be
     * referenced in some other extension's dependencies using the string `"hello.world"`.
     *
     * To make matters more complicated, an extension can optionally have an UUID. When two
     * extensions have the same UUID, they are considered equal even if their identifier is different.
     */
    class ExtensionIdentifier {
        constructor(value) {
            this.value = value;
            this._lower = value.toLowerCase();
        }
        static equals(a, b) {
            if (typeof a === 'undefined' || a === null) {
                return (typeof b === 'undefined' || b === null);
            }
            if (typeof b === 'undefined' || b === null) {
                return false;
            }
            if (typeof a === 'string' || typeof b === 'string') {
                // At least one of the arguments is an extension id in string form,
                // so we have to use the string comparison which ignores case.
                const aValue = (typeof a === 'string' ? a : a.value);
                const bValue = (typeof b === 'string' ? b : b.value);
                return strings.equalsIgnoreCase(aValue, bValue);
            }
            // Now we know both arguments are ExtensionIdentifier
            return (a._lower === b._lower);
        }
        /**
         * Gives the value by which to index (for equality).
         */
        static toKey(id) {
            if (typeof id === 'string') {
                return id.toLowerCase();
            }
            return id._lower;
        }
    }
    exports.ExtensionIdentifier = ExtensionIdentifier;
    class ExtensionIdentifierSet {
        get size() {
            return this._set.size;
        }
        constructor(iterable) {
            this._set = new Set();
            if (iterable) {
                for (const value of iterable) {
                    this.add(value);
                }
            }
        }
        add(id) {
            this._set.add(ExtensionIdentifier.toKey(id));
        }
        delete(extensionId) {
            return this._set.delete(ExtensionIdentifier.toKey(extensionId));
        }
        has(id) {
            return this._set.has(ExtensionIdentifier.toKey(id));
        }
    }
    exports.ExtensionIdentifierSet = ExtensionIdentifierSet;
    class ExtensionIdentifierMap {
        constructor() {
            this._map = new Map();
        }
        clear() {
            this._map.clear();
        }
        delete(id) {
            this._map.delete(ExtensionIdentifier.toKey(id));
        }
        get(id) {
            return this._map.get(ExtensionIdentifier.toKey(id));
        }
        has(id) {
            return this._map.has(ExtensionIdentifier.toKey(id));
        }
        set(id, value) {
            this._map.set(ExtensionIdentifier.toKey(id), value);
        }
        values() {
            return this._map.values();
        }
        forEach(callbackfn) {
            this._map.forEach(callbackfn);
        }
        [Symbol.iterator]() {
            return this._map[Symbol.iterator]();
        }
    }
    exports.ExtensionIdentifierMap = ExtensionIdentifierMap;
    function isApplicationScopedExtension(manifest) {
        return isLanguagePackExtension(manifest);
    }
    function isLanguagePackExtension(manifest) {
        return manifest.contributes && manifest.contributes.localizations ? manifest.contributes.localizations.length > 0 : false;
    }
    function isAuthenticationProviderExtension(manifest) {
        return manifest.contributes && manifest.contributes.authentication ? manifest.contributes.authentication.length > 0 : false;
    }
    function isResolverExtension(manifest, remoteAuthority) {
        if (remoteAuthority) {
            const activationEvent = `onResolveRemoteAuthority:${(0, remoteHosts_1.getRemoteName)(remoteAuthority)}`;
            return !!manifest.activationEvents?.includes(activationEvent);
        }
        return false;
    }
    exports.IBuiltinExtensionsScannerService = (0, instantiation_1.createDecorator)('IBuiltinExtensionsScannerService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBOE5oRyx3RUFPQztJQWtQRCxvRUFFQztJQUVELDBEQUVDO0lBRUQsOEVBRUM7SUFFRCxrREFNQztJQS9kWSxRQUFBLHdCQUF3QixHQUFHLHVCQUF1QixDQUFDO0lBQ25ELFFBQUEsMkJBQTJCLEdBQUcsMEJBQTBCLENBQUM7SUFDekQsUUFBQSxtQkFBbUIsR0FBRyxxQkFBcUIsQ0FBQztJQXlNNUMsUUFBQSxtQkFBbUIsR0FBNkIsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBU3hGLFNBQWdCLDhCQUE4QixDQUFDLFdBQThGO1FBQzVJLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUM3RCxJQUFJLFdBQVcsQ0FBQyxTQUFTLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3BDLE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFRWSxRQUFBLG9CQUFvQixHQUFHO1FBQ25DLE9BQU87UUFDUCxjQUFjO1FBQ2QsV0FBVztRQUNYLGlCQUFpQjtRQUNqQixXQUFXO1FBQ1gsWUFBWTtRQUNaLFNBQVM7UUFDVCxnQkFBZ0I7UUFDaEIsU0FBUztRQUNULGtCQUFrQjtRQUNsQixXQUFXO1FBQ1gsdUJBQXVCO1FBQ3ZCLGVBQWU7UUFDZixVQUFVO1FBQ1YsU0FBUztRQUNULFFBQVE7UUFDUixlQUFlO1FBQ2YsSUFBSTtRQUNKLE1BQU07UUFDTixPQUFPO0tBQ1As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