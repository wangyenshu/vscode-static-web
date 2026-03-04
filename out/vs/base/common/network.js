/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/path"], function (require, exports, errors, platform, strings_1, uri_1, paths) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COI = exports.FileAccess = exports.VSCODE_AUTHORITY = exports.nodeModulesAsarUnpackedPath = exports.nodeModulesAsarPath = exports.nodeModulesPath = exports.builtinExtensionsPath = exports.RemoteAuthorities = exports.connectionTokenQueryName = exports.connectionTokenCookieName = exports.Schemas = void 0;
    exports.matchesScheme = matchesScheme;
    exports.matchesSomeScheme = matchesSomeScheme;
    exports.getServerRootPath = getServerRootPath;
    var Schemas;
    (function (Schemas) {
        /**
         * A schema that is used for models that exist in memory
         * only and that have no correspondence on a server or such.
         */
        Schemas.inMemory = 'inmemory';
        /**
         * A schema that is used for setting files
         */
        Schemas.vscode = 'vscode';
        /**
         * A schema that is used for internal private files
         */
        Schemas.internal = 'private';
        /**
         * A walk-through document.
         */
        Schemas.walkThrough = 'walkThrough';
        /**
         * An embedded code snippet.
         */
        Schemas.walkThroughSnippet = 'walkThroughSnippet';
        Schemas.http = 'http';
        Schemas.https = 'https';
        Schemas.file = 'file';
        Schemas.mailto = 'mailto';
        Schemas.untitled = 'untitled';
        Schemas.data = 'data';
        Schemas.command = 'command';
        Schemas.vscodeRemote = 'vscode-remote';
        Schemas.vscodeRemoteResource = 'vscode-remote-resource';
        Schemas.vscodeManagedRemoteResource = 'vscode-managed-remote-resource';
        Schemas.vscodeUserData = 'vscode-userdata';
        Schemas.vscodeCustomEditor = 'vscode-custom-editor';
        Schemas.vscodeNotebookCell = 'vscode-notebook-cell';
        Schemas.vscodeNotebookCellMetadata = 'vscode-notebook-cell-metadata';
        Schemas.vscodeNotebookCellOutput = 'vscode-notebook-cell-output';
        Schemas.vscodeInteractiveInput = 'vscode-interactive-input';
        Schemas.vscodeSettings = 'vscode-settings';
        Schemas.vscodeWorkspaceTrust = 'vscode-workspace-trust';
        Schemas.vscodeTerminal = 'vscode-terminal';
        /** Scheme used for code blocks in chat. */
        Schemas.vscodeChatCodeBlock = 'vscode-chat-code-block';
        /** Scheme used for LHS of code compare (aka diff) blocks in chat. */
        Schemas.vscodeChatCodeCompreBlock = 'vscode-chat-code-compare-block';
        /** Scheme used for the chat input editor. */
        Schemas.vscodeChatSesssion = 'vscode-chat-editor';
        /**
         * Scheme used internally for webviews that aren't linked to a resource (i.e. not custom editors)
         */
        Schemas.webviewPanel = 'webview-panel';
        /**
         * Scheme used for loading the wrapper html and script in webviews.
         */
        Schemas.vscodeWebview = 'vscode-webview';
        /**
         * Scheme used for extension pages
         */
        Schemas.extension = 'extension';
        /**
         * Scheme used as a replacement of `file` scheme to load
         * files with our custom protocol handler (desktop only).
         */
        Schemas.vscodeFileResource = 'vscode-file';
        /**
         * Scheme used for temporary resources
         */
        Schemas.tmp = 'tmp';
        /**
         * Scheme used vs live share
         */
        Schemas.vsls = 'vsls';
        /**
         * Scheme used for the Source Control commit input's text document
         */
        Schemas.vscodeSourceControl = 'vscode-scm';
        /**
         * Scheme used for input box for creating comments.
         */
        Schemas.commentsInput = 'comment';
        /**
         * Scheme used for special rendering of settings in the release notes
         */
        Schemas.codeSetting = 'code-setting';
    })(Schemas || (exports.Schemas = Schemas = {}));
    function matchesScheme(target, scheme) {
        if (uri_1.URI.isUri(target)) {
            return (0, strings_1.equalsIgnoreCase)(target.scheme, scheme);
        }
        else {
            return (0, strings_1.startsWithIgnoreCase)(target, scheme + ':');
        }
    }
    function matchesSomeScheme(target, ...schemes) {
        return schemes.some(scheme => matchesScheme(target, scheme));
    }
    exports.connectionTokenCookieName = 'vscode-tkn';
    exports.connectionTokenQueryName = 'tkn';
    class RemoteAuthoritiesImpl {
        constructor() {
            this._hosts = Object.create(null);
            this._ports = Object.create(null);
            this._connectionTokens = Object.create(null);
            this._preferredWebSchema = 'http';
            this._delegate = null;
            this._serverRootPath = '/';
        }
        setPreferredWebSchema(schema) {
            this._preferredWebSchema = schema;
        }
        setDelegate(delegate) {
            this._delegate = delegate;
        }
        setServerRootPath(product, serverBasePath) {
            this._serverRootPath = getServerRootPath(product, serverBasePath);
        }
        getServerRootPath() {
            return this._serverRootPath;
        }
        get _remoteResourcesPath() {
            return paths.posix.join(this._serverRootPath, Schemas.vscodeRemoteResource);
        }
        set(authority, host, port) {
            this._hosts[authority] = host;
            this._ports[authority] = port;
        }
        setConnectionToken(authority, connectionToken) {
            this._connectionTokens[authority] = connectionToken;
        }
        getPreferredWebSchema() {
            return this._preferredWebSchema;
        }
        rewrite(uri) {
            if (this._delegate) {
                try {
                    return this._delegate(uri);
                }
                catch (err) {
                    errors.onUnexpectedError(err);
                    return uri;
                }
            }
            const authority = uri.authority;
            let host = this._hosts[authority];
            if (host && host.indexOf(':') !== -1 && host.indexOf('[') === -1) {
                host = `[${host}]`;
            }
            const port = this._ports[authority];
            const connectionToken = this._connectionTokens[authority];
            let query = `path=${encodeURIComponent(uri.path)}`;
            if (typeof connectionToken === 'string') {
                query += `&${exports.connectionTokenQueryName}=${encodeURIComponent(connectionToken)}`;
            }
            return uri_1.URI.from({
                scheme: platform.isWeb ? this._preferredWebSchema : Schemas.vscodeRemoteResource,
                authority: `${host}:${port}`,
                path: this._remoteResourcesPath,
                query
            });
        }
    }
    exports.RemoteAuthorities = new RemoteAuthoritiesImpl();
    function getServerRootPath(product, basePath) {
        return paths.posix.join(basePath ?? '/', `${product.quality ?? 'oss'}-${product.commit ?? 'dev'}`);
    }
    exports.builtinExtensionsPath = 'vs/../../extensions';
    exports.nodeModulesPath = 'vs/../../node_modules';
    exports.nodeModulesAsarPath = 'vs/../../node_modules.asar';
    exports.nodeModulesAsarUnpackedPath = 'vs/../../node_modules.asar.unpacked';
    exports.VSCODE_AUTHORITY = 'vscode-app';
    class FileAccessImpl {
        static { this.FALLBACK_AUTHORITY = exports.VSCODE_AUTHORITY; }
        /**
         * Returns a URI to use in contexts where the browser is responsible
         * for loading (e.g. fetch()) or when used within the DOM.
         *
         * **Note:** use `dom.ts#asCSSUrl` whenever the URL is to be used in CSS context.
         */
        asBrowserUri(resourcePath) {
            const uri = this.toUri(resourcePath, require);
            return this.uriToBrowserUri(uri);
        }
        /**
         * Returns a URI to use in contexts where the browser is responsible
         * for loading (e.g. fetch()) or when used within the DOM.
         *
         * **Note:** use `dom.ts#asCSSUrl` whenever the URL is to be used in CSS context.
         */
        uriToBrowserUri(uri) {
            // Handle remote URIs via `RemoteAuthorities`
            if (uri.scheme === Schemas.vscodeRemote) {
                return exports.RemoteAuthorities.rewrite(uri);
            }
            // Convert to `vscode-file` resource..
            if (
            // ...only ever for `file` resources
            uri.scheme === Schemas.file &&
                (
                // ...and we run in native environments
                platform.isNative ||
                    // ...or web worker extensions on desktop
                    (platform.webWorkerOrigin === `${Schemas.vscodeFileResource}://${FileAccessImpl.FALLBACK_AUTHORITY}`))) {
                return uri.with({
                    scheme: Schemas.vscodeFileResource,
                    // We need to provide an authority here so that it can serve
                    // as origin for network and loading matters in chromium.
                    // If the URI is not coming with an authority already, we
                    // add our own
                    authority: uri.authority || FileAccessImpl.FALLBACK_AUTHORITY,
                    query: null,
                    fragment: null
                });
            }
            return uri;
        }
        /**
         * Returns the `file` URI to use in contexts where node.js
         * is responsible for loading.
         */
        asFileUri(resourcePath) {
            const uri = this.toUri(resourcePath, require);
            return this.uriToFileUri(uri);
        }
        /**
         * Returns the `file` URI to use in contexts where node.js
         * is responsible for loading.
         */
        uriToFileUri(uri) {
            // Only convert the URI if it is `vscode-file:` scheme
            if (uri.scheme === Schemas.vscodeFileResource) {
                return uri.with({
                    scheme: Schemas.file,
                    // Only preserve the `authority` if it is different from
                    // our fallback authority. This ensures we properly preserve
                    // Windows UNC paths that come with their own authority.
                    authority: uri.authority !== FileAccessImpl.FALLBACK_AUTHORITY ? uri.authority : null,
                    query: null,
                    fragment: null
                });
            }
            return uri;
        }
        toUri(uriOrModule, moduleIdToUrl) {
            if (uri_1.URI.isUri(uriOrModule)) {
                return uriOrModule;
            }
            return uri_1.URI.parse(moduleIdToUrl.toUrl(uriOrModule));
        }
    }
    exports.FileAccess = new FileAccessImpl();
    var COI;
    (function (COI) {
        const coiHeaders = new Map([
            ['1', { 'Cross-Origin-Opener-Policy': 'same-origin' }],
            ['2', { 'Cross-Origin-Embedder-Policy': 'require-corp' }],
            ['3', { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' }],
        ]);
        COI.CoopAndCoep = Object.freeze(coiHeaders.get('3'));
        const coiSearchParamName = 'vscode-coi';
        /**
         * Extract desired headers from `vscode-coi` invocation
         */
        function getHeadersFromQuery(url) {
            let params;
            if (typeof url === 'string') {
                params = new URL(url).searchParams;
            }
            else if (url instanceof URL) {
                params = url.searchParams;
            }
            else if (uri_1.URI.isUri(url)) {
                params = new URL(url.toString(true)).searchParams;
            }
            const value = params?.get(coiSearchParamName);
            if (!value) {
                return undefined;
            }
            return coiHeaders.get(value);
        }
        COI.getHeadersFromQuery = getHeadersFromQuery;
        /**
         * Add the `vscode-coi` query attribute based on wanting `COOP` and `COEP`. Will be a noop when `crossOriginIsolated`
         * isn't enabled the current context
         */
        function addSearchParam(urlOrSearch, coop, coep) {
            if (!globalThis.crossOriginIsolated) {
                // depends on the current context being COI
                return;
            }
            const value = coop && coep ? '3' : coep ? '2' : '1';
            if (urlOrSearch instanceof URLSearchParams) {
                urlOrSearch.set(coiSearchParamName, value);
            }
            else {
                urlOrSearch[coiSearchParamName] = value;
            }
        }
        COI.addSearchParam = addSearchParam;
    })(COI || (exports.COI = COI = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29yay5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL25ldHdvcmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkhoRyxzQ0FNQztJQUVELDhDQUVDO0lBNkVELDhDQUVDO0lBOU1ELElBQWlCLE9BQU8sQ0FtSHZCO0lBbkhELFdBQWlCLE9BQU87UUFFdkI7OztXQUdHO1FBQ1UsZ0JBQVEsR0FBRyxVQUFVLENBQUM7UUFFbkM7O1dBRUc7UUFDVSxjQUFNLEdBQUcsUUFBUSxDQUFDO1FBRS9COztXQUVHO1FBQ1UsZ0JBQVEsR0FBRyxTQUFTLENBQUM7UUFFbEM7O1dBRUc7UUFDVSxtQkFBVyxHQUFHLGFBQWEsQ0FBQztRQUV6Qzs7V0FFRztRQUNVLDBCQUFrQixHQUFHLG9CQUFvQixDQUFDO1FBRTFDLFlBQUksR0FBRyxNQUFNLENBQUM7UUFFZCxhQUFLLEdBQUcsT0FBTyxDQUFDO1FBRWhCLFlBQUksR0FBRyxNQUFNLENBQUM7UUFFZCxjQUFNLEdBQUcsUUFBUSxDQUFDO1FBRWxCLGdCQUFRLEdBQUcsVUFBVSxDQUFDO1FBRXRCLFlBQUksR0FBRyxNQUFNLENBQUM7UUFFZCxlQUFPLEdBQUcsU0FBUyxDQUFDO1FBRXBCLG9CQUFZLEdBQUcsZUFBZSxDQUFDO1FBRS9CLDRCQUFvQixHQUFHLHdCQUF3QixDQUFDO1FBRWhELG1DQUEyQixHQUFHLGdDQUFnQyxDQUFDO1FBRS9ELHNCQUFjLEdBQUcsaUJBQWlCLENBQUM7UUFFbkMsMEJBQWtCLEdBQUcsc0JBQXNCLENBQUM7UUFFNUMsMEJBQWtCLEdBQUcsc0JBQXNCLENBQUM7UUFDNUMsa0NBQTBCLEdBQUcsK0JBQStCLENBQUM7UUFDN0QsZ0NBQXdCLEdBQUcsNkJBQTZCLENBQUM7UUFDekQsOEJBQXNCLEdBQUcsMEJBQTBC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