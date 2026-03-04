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
define(["require", "exports", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing", "vs/base/common/uri", "vs/base/common/network", "vs/base/common/platform", "vs/platform/files/common/files", "vs/base/common/path", "vs/base/browser/window"], function (require, exports, terminalLinkParsing_1, uri_1, network_1, platform_1, files_1, path_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkResolver = void 0;
    let TerminalLinkResolver = class TerminalLinkResolver {
        constructor(_fileService) {
            this._fileService = _fileService;
            // Link cache could be shared across all terminals, but that could lead to weird results when
            // both local and remote terminals are present
            this._resolvedLinkCaches = new Map();
        }
        async resolveLink(processManager, link, uri) {
            // Correct scheme and authority for remote terminals
            if (uri && uri.scheme === network_1.Schemas.file && processManager.remoteAuthority) {
                uri = uri.with({
                    scheme: network_1.Schemas.vscodeRemote,
                    authority: processManager.remoteAuthority
                });
            }
            // Get the link cache
            let cache = this._resolvedLinkCaches.get(processManager.remoteAuthority ?? '');
            if (!cache) {
                cache = new LinkCache();
                this._resolvedLinkCaches.set(processManager.remoteAuthority ?? '', cache);
            }
            // Check resolved link cache first
            const cached = cache.get(uri || link);
            if (cached !== undefined) {
                return cached;
            }
            if (uri) {
                try {
                    const stat = await this._fileService.stat(uri);
                    const result = { uri, link, isDirectory: stat.isDirectory };
                    cache.set(uri, result);
                    return result;
                }
                catch (e) {
                    // Does not exist
                    cache.set(uri, null);
                    return null;
                }
            }
            // Remove any line/col suffix
            let linkUrl = (0, terminalLinkParsing_1.removeLinkSuffix)(link);
            // Remove any query string
            linkUrl = (0, terminalLinkParsing_1.removeLinkQueryString)(linkUrl);
            // Exit early if the link is determines as not valid already
            if (linkUrl.length === 0) {
                cache.set(link, null);
                return null;
            }
            // If the link looks like a /mnt/ WSL path and this is a Windows frontend, use the backend
            // to get the resolved path from the wslpath util.
            if (platform_1.isWindows && link.match(/^\/mnt\/[a-z]/i) && processManager.backend) {
                linkUrl = await processManager.backend.getWslPath(linkUrl, 'unix-to-win');
            }
            // Skip preprocessing if it looks like a special Windows -> WSL link
            else if (platform_1.isWindows && link.match(/^(?:\/\/|\\\\)wsl(?:\$|\.localhost)(\/|\\)/)) {
                // No-op, it's already the right format
            }
            // Handle all non-WSL links
            else {
                const preprocessedLink = this._preprocessPath(linkUrl, processManager.initialCwd, processManager.os, processManager.userHome);
                if (!preprocessedLink) {
                    cache.set(link, null);
                    return null;
                }
                linkUrl = preprocessedLink;
            }
            try {
                let uri;
                if (processManager.remoteAuthority) {
                    uri = uri_1.URI.from({
                        scheme: network_1.Schemas.vscodeRemote,
                        authority: processManager.remoteAuthority,
                        path: linkUrl
                    });
                }
                else {
                    uri = uri_1.URI.file(linkUrl);
                }
                try {
                    const stat = await this._fileService.stat(uri);
                    const result = { uri, link, isDirectory: stat.isDirectory };
                    cache.set(link, result);
                    return result;
                }
                catch (e) {
                    // Does not exist
                    cache.set(link, null);
                    return null;
                }
            }
            catch {
                // Errors in parsing the path
                cache.set(link, null);
                return null;
            }
        }
        _preprocessPath(link, initialCwd, os, userHome) {
            const osPath = this._getOsPath(os);
            if (link.charAt(0) === '~') {
                // Resolve ~ -> userHome
                if (!userHome) {
                    return null;
                }
                link = osPath.join(userHome, link.substring(1));
            }
            else if (link.charAt(0) !== '/' && link.charAt(0) !== '~') {
                // Resolve workspace path . | .. | <relative_path> -> <path>/. | <path>/.. | <path>/<relative_path>
                if (os === 1 /* OperatingSystem.Windows */) {
                    if (!link.match('^' + terminalLinkParsing_1.winDrivePrefix) && !link.startsWith('\\\\?\\')) {
                        if (!initialCwd) {
                            // Abort if no workspace is open
                            return null;
                        }
                        link = osPath.join(initialCwd, link);
                    }
                    else {
                        // Remove \\?\ from paths so that they share the same underlying
                        // uri and don't open multiple tabs for the same file
                        link = link.replace(/^\\\\\?\\/, '');
                    }
                }
                else {
                    if (!initialCwd) {
                        // Abort if no workspace is open
                        return null;
                    }
                    link = osPath.join(initialCwd, link);
                }
            }
            link = osPath.normalize(link);
            return link;
        }
        _getOsPath(os) {
            return (os ?? platform_1.OS) === 1 /* OperatingSystem.Windows */ ? path_1.win32 : path_1.posix;
        }
    };
    exports.TerminalLinkResolver = TerminalLinkResolver;
    exports.TerminalLinkResolver = TerminalLinkResolver = __decorate([
        __param(0, files_1.IFileService)
    ], TerminalLinkResolver);
    var LinkCacheConstants;
    (function (LinkCacheConstants) {
        /**
         * How long to cache links for in milliseconds, the TTL resets whenever a new value is set in
         * the cache.
         */
        LinkCacheConstants[LinkCacheConstants["TTL"] = 10000] = "TTL";
    })(LinkCacheConstants || (LinkCacheConstants = {}));
    class LinkCache {
        constructor() {
            this._cache = new Map();
            this._cacheTilTimeout = 0;
        }
        set(link, value) {
            // Reset cached link TTL on any set
            if (this._cacheTilTimeout) {
                window_1.mainWindow.clearTimeout(this._cacheTilTimeout);
            }
            this._cacheTilTimeout = window_1.mainWindow.setTimeout(() => this._cache.clear(), 10000 /* LinkCacheConstants.TTL */);
            this._cache.set(this._getKey(link), value);
        }
        get(link) {
            return this._cache.get(this._getKey(link));
        }
        _getKey(link) {
            if (uri_1.URI.isUri(link)) {
                return link.toString();
            }
            return link;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rUmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvYnJvd3Nlci90ZXJtaW5hbExpbmtSZXNvbHZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7UUFLaEMsWUFDZSxZQUEyQztZQUExQixpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUwxRCw2RkFBNkY7WUFDN0YsOENBQThDO1lBQzdCLHdCQUFtQixHQUEyQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBS3pFLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLGNBQXdKLEVBQUUsSUFBWSxFQUFFLEdBQVM7WUFDbE0sb0RBQW9EO1lBQ3BELElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLElBQUksY0FBYyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMxRSxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztvQkFDZCxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxZQUFZO29CQUM1QixTQUFTLEVBQUUsY0FBYyxDQUFDLGVBQWU7aUJBQ3pDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxxQkFBcUI7WUFDckIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQy9FLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixLQUFLLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FB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