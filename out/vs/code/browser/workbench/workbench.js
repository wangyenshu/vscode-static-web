/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/window", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/product/common/product", "vs/platform/window/common/window", "vs/workbench/workbench.web.main"], function (require, exports, browser_1, window_1, buffer_1, event_1, lifecycle_1, marshalling_1, network_1, path_1, resources_1, strings_1, uri_1, product_1, window_2, workbench_web_main_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalStorageSecretStorageProvider = void 0;
    class TransparentCrypto {
        async seal(data) {
            return data;
        }
        async unseal(data) {
            return data;
        }
    }
    var AESConstants;
    (function (AESConstants) {
        AESConstants["ALGORITHM"] = "AES-GCM";
        AESConstants[AESConstants["KEY_LENGTH"] = 256] = "KEY_LENGTH";
        AESConstants[AESConstants["IV_LENGTH"] = 12] = "IV_LENGTH";
    })(AESConstants || (AESConstants = {}));
    class ServerKeyedAESCrypto {
        /** Gets whether the algorithm is supported; requires a secure context */
        static supported() {
            return !!crypto.subtle;
        }
        constructor(authEndpoint) {
            this.authEndpoint = authEndpoint;
        }
        async seal(data) {
            // Get a new key and IV on every change, to avoid the risk of reusing the same key and IV pair with AES-GCM
            // (see also: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams#properties)
            const iv = window_1.mainWindow.crypto.getRandomValues(new Uint8Array(12 /* AESConstants.IV_LENGTH */));
            // crypto.getRandomValues isn't a good-enough PRNG to generate crypto keys, so we need to use crypto.subtle.generateKey and export the key instead
            const clientKeyObj = await window_1.mainWindow.crypto.subtle.generateKey({ name: "AES-GCM" /* AESConstants.ALGORITHM */, length: 256 /* AESConstants.KEY_LENGTH */ }, true, ['encrypt', 'decrypt']);
            const clientKey = new Uint8Array(await window_1.mainWindow.crypto.subtle.exportKey('raw', clientKeyObj));
            const key = await this.getKey(clientKey);
            const dataUint8Array = new TextEncoder().encode(data);
            const cipherText = await window_1.mainWindow.crypto.subtle.encrypt({ name: "AES-GCM" /* AESConstants.ALGORITHM */, iv }, key, dataUint8Array);
            // Base64 encode the result and store the ciphertext, the key, and the IV in localStorage
            // Note that the clientKey and IV don't need to be secret
            const result = new Uint8Array([...clientKey, ...iv, ...new Uint8Array(cipherText)]);
            return (0, buffer_1.encodeBase64)(buffer_1.VSBuffer.wrap(result));
        }
        async unseal(data) {
            // encrypted should contain, in order: the key (32-byte), the IV for AES-GCM (12-byte) and the ciphertext (which has the GCM auth tag at the end)
            // Minimum length must be 44 (key+IV length) + 16 bytes (1 block encrypted with AES - regardless of key size)
            const dataUint8Array = (0, buffer_1.decodeBase64)(data);
            if (dataUint8Array.byteLength < 60) {
                throw Error('Invalid length for the value for credentials.crypto');
            }
            const keyLength = 256 /* AESConstants.KEY_LENGTH */ / 8;
            const clientKey = dataUint8Array.slice(0, keyLength);
            const iv = dataUint8Array.slice(keyLength, keyLength + 12 /* AESConstants.IV_LENGTH */);
            const cipherText = dataUint8Array.slice(keyLength + 12 /* AESConstants.IV_LENGTH */);
            // Do the decryption and parse the result as JSON
            const key = await this.getKey(clientKey.buffer);
            const decrypted = await window_1.mainWindow.crypto.subtle.decrypt({ name: "AES-GCM" /* AESConstants.ALGORITHM */, iv: iv.buffer }, key, cipherText.buffer);
            return new TextDecoder().decode(new Uint8Array(decrypted));
        }
        /**
         * Given a clientKey, returns the CryptoKey object that is used to encrypt/decrypt the data.
         * The actual key is (clientKey XOR serverKey)
         */
        async getKey(clientKey) {
            if (!clientKey || clientKey.byteLength !== 256 /* AESConstants.KEY_LENGTH */ / 8) {
                throw Error('Invalid length for clientKey');
            }
            const serverKey = await this.getServerKeyPart();
            const keyData = new Uint8Array(256 /* AESConstants.KEY_LENGTH */ / 8);
            for (let i = 0; i < keyData.byteLength; i++) {
                keyData[i] = clientKey[i] ^ serverKey[i];
            }
            return window_1.mainWindow.crypto.subtle.importKey('raw', keyData, {
                name: "AES-GCM" /* AESConstants.ALGORITHM */,
                length: 256 /* AESConstants.KEY_LENGTH */,
            }, true, ['encrypt', 'decrypt']);
        }
        async getServerKeyPart() {
            if (this._serverKey) {
                return this._serverKey;
            }
            let attempt = 0;
            let lastError;
            while (attempt <= 3) {
                try {
                    const res = await fetch(this.authEndpoint, { credentials: 'include', method: 'POST' });
                    if (!res.ok) {
                        throw new Error(res.statusText);
                    }
                    const serverKey = new Uint8Array(await await res.arrayBuffer());
                    if (serverKey.byteLength !== 256 /* AESConstants.KEY_LENGTH */ / 8) {
                        throw Error(`The key retrieved by the server is not ${256 /* AESConstants.KEY_LENGTH */} bit long.`);
                    }
                    this._serverKey = serverKey;
                    return this._serverKey;
                }
                catch (e) {
                    lastError = e;
                    attempt++;
                    // exponential backoff
                    await new Promise(resolve => setTimeout(resolve, attempt * attempt * 100));
                }
            }
            throw lastError;
        }
    }
    class LocalStorageSecretStorageProvider {
        constructor(crypto) {
            this.crypto = crypto;
            this._storageKey = 'secrets.provider';
            this._secretsPromise = this.load();
            this.type = 'persisted';
        }
        async load() {
            const record = this.loadAuthSessionFromElement();
            // Get the secrets from localStorage
            const encrypted = localStorage.getItem(this._storageKey);
            if (encrypted) {
                try {
                    const decrypted = JSON.parse(await this.crypto.unseal(encrypted));
                    return { ...record, ...decrypted };
                }
                catch (err) {
                    // TODO: send telemetry
                    console.error('Failed to decrypt secrets from localStorage', err);
                    localStorage.removeItem(this._storageKey);
                }
            }
            return record;
        }
        loadAuthSessionFromElement() {
            let authSessionInfo;
            const authSessionElement = window_1.mainWindow.document.getElementById('vscode-workbench-auth-session');
            const authSessionElementAttribute = authSessionElement ? authSessionElement.getAttribute('data-settings') : undefined;
            if (authSessionElementAttribute) {
                try {
                    authSessionInfo = JSON.parse(authSessionElementAttribute);
                }
                catch (error) { /* Invalid session is passed. Ignore. */ }
            }
            if (!authSessionInfo) {
                return {};
            }
            const record = {};
            // Settings Sync Entry
            record[`${product_1.default.urlProtocol}.loginAccount`] = JSON.stringify(authSessionInfo);
            // Auth extension Entry
            if (authSessionInfo.providerId !== 'github') {
                console.error(`Unexpected auth provider: ${authSessionInfo.providerId}. Expected 'github'.`);
                return record;
            }
            const authAccount = JSON.stringify({ extensionId: 'vscode.github-authentication', key: 'github.auth' });
            record[authAccount] = JSON.stringify(authSessionInfo.scopes.map(scopes => ({
                id: authSessionInfo.id,
                scopes,
                accessToken: authSessionInfo.accessToken
            })));
            return record;
        }
        async get(key) {
            const secrets = await this._secretsPromise;
            return secrets[key];
        }
        async set(key, value) {
            const secrets = await this._secretsPromise;
            secrets[key] = value;
            this._secretsPromise = Promise.resolve(secrets);
            this.save();
        }
        async delete(key) {
            const secrets = await this._secretsPromise;
            delete secrets[key];
            this._secretsPromise = Promise.resolve(secrets);
            this.save();
        }
        async save() {
            try {
                const encrypted = await this.crypto.seal(JSON.stringify(await this._secretsPromise));
                localStorage.setItem(this._storageKey, encrypted);
            }
            catch (err) {
                console.error(err);
            }
        }
    }
    exports.LocalStorageSecretStorageProvider = LocalStorageSecretStorageProvider;
    class LocalStorageURLCallbackProvider extends lifecycle_1.Disposable {
        static { this.REQUEST_ID = 0; }
        static { this.QUERY_KEYS = [
            'scheme',
            'authority',
            'path',
            'query',
            'fragment'
        ]; }
        constructor(_callbackRoute) {
            super();
            this._callbackRoute = _callbackRoute;
            this._onCallback = this._register(new event_1.Emitter());
            this.onCallback = this._onCallback.event;
            this.pendingCallbacks = new Set();
            this.lastTimeChecked = Date.now();
            this.checkCallbacksTimeout = undefined;
        }
        create(options = {}) {
            const id = ++LocalStorageURLCallbackProvider.REQUEST_ID;
            const queryParams = [`vscode-reqid=${id}`];
            for (const key of LocalStorageURLCallbackProvider.QUERY_KEYS) {
                const value = options[key];
                if (value) {
                    queryParams.push(`vscode-${key}=${encodeURIComponent(value)}`);
                }
            }
            // TODO@joao remove eventually
            // https://github.com/microsoft/vscode-dev/issues/62
            // https://github.com/microsoft/vscode/blob/159479eb5ae451a66b5dac3c12d564f32f454796/extensions/github-authentication/src/githubServer.ts#L50-L50
            if (!(options.authority === 'vscode.github-authentication' && options.path === '/dummy')) {
                const key = `vscode-web.url-callbacks[${id}]`;
                localStorage.removeItem(key);
                this.pendingCallbacks.add(id);
                this.startListening();
            }
            return uri_1.URI.parse(window_1.mainWindow.location.href).with({ path: this._callbackRoute, query: queryParams.join('&') });
        }
        startListening() {
            if (this.onDidChangeLocalStorageDisposable) {
                return;
            }
            const fn = () => this.onDidChangeLocalStorage();
            window_1.mainWindow.addEventListener('storage', fn);
            this.onDidChangeLocalStorageDisposable = { dispose: () => window_1.mainWindow.removeEventListener('storage', fn) };
        }
        stopListening() {
            this.onDidChangeLocalStorageDisposable?.dispose();
            this.onDidChangeLocalStorageDisposable = undefined;
        }
        // this fires every time local storage changes, but we
        // don't want to check more often than once a second
        async onDidChangeLocalStorage() {
            const ellapsed = Date.now() - this.lastTimeChecked;
            if (ellapsed > 1000) {
                this.checkCallbacks();
            }
            else if (this.checkCallbacksTimeout === undefined) {
                this.checkCallbacksTimeout = setTimeout(() => {
                    this.checkCallbacksTimeout = undefined;
                    this.checkCallbacks();
                }, 1000 - ellapsed);
            }
        }
        checkCallbacks() {
            let pendingCallbacks;
            for (const id of this.pendingCallbacks) {
                const key = `vscode-web.url-callbacks[${id}]`;
                const result = localStorage.getItem(key);
                if (result !== null) {
                    try {
                        this._onCallback.fire(uri_1.URI.revive(JSON.parse(result)));
                    }
                    catch (error) {
                        console.error(error);
                    }
                    pendingCallbacks = pendingCallbacks ?? new Set(this.pendingCallbacks);
                    pendingCallbacks.delete(id);
                    localStorage.removeItem(key);
                }
            }
            if (pendingCallbacks) {
                this.pendingCallbacks = pendingCallbacks;
                if (this.pendingCallbacks.size === 0) {
                    this.stopListening();
                }
            }
            this.lastTimeChecked = Date.now();
        }
    }
    class WorkspaceProvider {
        static { this.QUERY_PARAM_EMPTY_WINDOW = 'ew'; }
        static { this.QUERY_PARAM_FOLDER = 'folder'; }
        static { this.QUERY_PARAM_WORKSPACE = 'workspace'; }
        static { this.QUERY_PARAM_PAYLOAD = 'payload'; }
        static create(config) {
            let foundWorkspace = false;
            let workspace;
            let payload = Object.create(null);
            const query = new URL(document.location.href).searchParams;
            query.forEach((value, key) => {
                switch (key) {
                    // Folder
                    case WorkspaceProvider.QUERY_PARAM_FOLDER:
                        if (config.remoteAuthority && value.startsWith(path_1.posix.sep)) {
                            // when connected to a remote and having a value
                            // that is a path (begins with a `/`), assume this
                            // is a vscode-remote resource as simplified URL.
                            workspace = { folderUri: uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, path: value, authority: config.remoteAuthority }) };
                        }
                        else {
                            workspace = { folderUri: uri_1.URI.parse(value) };
                        }
                        foundWorkspace = true;
                        break;
                    // Workspace
                    case WorkspaceProvider.QUERY_PARAM_WORKSPACE:
                        if (config.remoteAuthority && value.startsWith(path_1.posix.sep)) {
                            // when connected to a remote and having a value
                            // that is a path (begins with a `/`), assume this
                            // is a vscode-remote resource as simplified URL.
                            workspace = { workspaceUri: uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, path: value, authority: config.remoteAuthority }) };
                        }
                        else {
                            workspace = { workspaceUri: uri_1.URI.parse(value) };
                        }
                        foundWorkspace = true;
                        break;
                    // Empty
                    case WorkspaceProvider.QUERY_PARAM_EMPTY_WINDOW:
                        workspace = undefined;
                        foundWorkspace = true;
                        break;
                    // Payload
                    case WorkspaceProvider.QUERY_PARAM_PAYLOAD:
                        try {
                            payload = (0, marshalling_1.parse)(value); // use marshalling#parse() to revive potential URIs
                        }
                        catch (error) {
                            console.error(error); // possible invalid JSON
                        }
                        break;
                }
            });
            // If no workspace is provided through the URL, check for config
            // attribute from server
            if (!foundWorkspace) {
                if (config.folderUri) {
                    workspace = { folderUri: uri_1.URI.revive(config.folderUri) };
                }
                else if (config.workspaceUri) {
                    workspace = { workspaceUri: uri_1.URI.revive(config.workspaceUri) };
                }
            }
            return new WorkspaceProvider(workspace, payload, config);
        }
        constructor(workspace, payload, config) {
            this.workspace = workspace;
            this.payload = payload;
            this.config = config;
            this.trusted = true;
        }
        async open(workspace, options) {
            if (options?.reuse && !options.payload && this.isSame(this.workspace, workspace)) {
                return true; // return early if workspace and environment is not changing and we are reusing window
            }
            const targetHref = this.createTargetUrl(workspace, options);
            if (targetHref) {
                if (options?.reuse) {
                    window_1.mainWindow.location.href = targetHref;
                    return true;
                }
                else {
                    let result;
                    if ((0, browser_1.isStandalone)()) {
                        result = window_1.mainWindow.open(targetHref, '_blank', 'toolbar=no'); // ensures to open another 'standalone' window!
                    }
                    else {
                        result = window_1.mainWindow.open(targetHref);
                    }
                    return !!result;
                }
            }
            return false;
        }
        createTargetUrl(workspace, options) {
            // Empty
            let targetHref = undefined;
            if (!workspace) {
                targetHref = `${document.location.origin}${document.location.pathname}?${WorkspaceProvider.QUERY_PARAM_EMPTY_WINDOW}=true`;
            }
            // Folder
            else if ((0, window_2.isFolderToOpen)(workspace)) {
                const queryParamFolder = this.encodeWorkspacePath(workspace.folderUri);
                targetHref = `${document.location.origin}${document.location.pathname}?${WorkspaceProvider.QUERY_PARAM_FOLDER}=${queryParamFolder}`;
            }
            // Workspace
            else if ((0, window_2.isWorkspaceToOpen)(workspace)) {
                const queryParamWorkspace = this.encodeWorkspacePath(workspace.workspaceUri);
                targetHref = `${document.location.origin}${document.location.pathname}?${WorkspaceProvider.QUERY_PARAM_WORKSPACE}=${queryParamWorkspace}`;
            }
            // Append payload if any
            if (options?.payload) {
                targetHref += `&${WorkspaceProvider.QUERY_PARAM_PAYLOAD}=${encodeURIComponent(JSON.stringify(options.payload))}`;
            }
            return targetHref;
        }
        encodeWorkspacePath(uri) {
            if (this.config.remoteAuthority && uri.scheme === network_1.Schemas.vscodeRemote) {
                // when connected to a remote and having a folder
                // or workspace for that remote, only use the path
                // as query value to form shorter, nicer URLs.
                // however, we still need to `encodeURIComponent`
                // to ensure to preserve special characters, such
                // as `+` in the path.
                return encodeURIComponent(`${path_1.posix.sep}${(0, strings_1.ltrim)(uri.path, path_1.posix.sep)}`).replaceAll('%2F', '/');
            }
            return encodeURIComponent(uri.toString(true));
        }
        isSame(workspaceA, workspaceB) {
            if (!workspaceA || !workspaceB) {
                return workspaceA === workspaceB; // both empty
            }
            if ((0, window_2.isFolderToOpen)(workspaceA) && (0, window_2.isFolderToOpen)(workspaceB)) {
                return (0, resources_1.isEqual)(workspaceA.folderUri, workspaceB.folderUri); // same workspace
            }
            if ((0, window_2.isWorkspaceToOpen)(workspaceA) && (0, window_2.isWorkspaceToOpen)(workspaceB)) {
                return (0, resources_1.isEqual)(workspaceA.workspaceUri, workspaceB.workspaceUri); // same workspace
            }
            return false;
        }
        hasRemote() {
            if (this.workspace) {
                if ((0, window_2.isFolderToOpen)(this.workspace)) {
                    return this.workspace.folderUri.scheme === network_1.Schemas.vscodeRemote;
                }
                if ((0, window_2.isWorkspaceToOpen)(this.workspace)) {
                    return this.workspace.workspaceUri.scheme === network_1.Schemas.vscodeRemote;
                }
            }
            return true;
        }
    }
    function readCookie(name) {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            if (cookie.startsWith(name + '=')) {
                return cookie.substring(name.length + 1);
            }
        }
        return undefined;
    }
    (function () {
        // Find config by checking for DOM
        const configElement = window_1.mainWindow.document.getElementById('vscode-workbench-web-configuration');
        const configElementAttribute = configElement ? configElement.getAttribute('data-settings') : undefined;
        if (!configElement || !configElementAttribute) {
            throw new Error('Missing web configuration element');
        }
        const config = JSON.parse(configElementAttribute);
        const secretStorageKeyPath = readCookie('vscode-secret-key-path');
        const secretStorageCrypto = secretStorageKeyPath && ServerKeyedAESCrypto.supported()
            ? new ServerKeyedAESCrypto(secretStorageKeyPath) : new TransparentCrypto();
        // Create workbench
        window.vscodeAlterConfig && window.vscodeAlterConfig(config);
        (0, workbench_web_main_1.create)(window_1.mainWindow.document.body, {
            ...config,
            windowIndicator: config.windowIndicator ?? { label: '$(remote)', tooltip: `${product_1.default.nameShort} Web` },
            settingsSyncOptions: config.settingsSyncOptions ? { enabled: config.settingsSyncOptions.enabled, } : undefined,
            workspaceProvider: WorkspaceProvider.create(config),
            urlCallbackProvider: new LocalStorageURLCallbackProvider(config.callbackRoute),
            secretStorageProvider: config.remoteAuthority && !secretStorageKeyPath
                ? undefined /* with a remote without embedder-preferred storage, store on the remote */
                : new LocalStorageSecretStorageProvider(secretStorageCrypto),
        });
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvY29kZS9icm93c2VyL3dvcmtiZW5jaC93b3JrYmVuY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNEJoRyxNQUFNLGlCQUFpQjtRQUN0QixLQUFLLENBQUMsSUFBSSxDQUFDLElBQVk7WUFDdEIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFZO1lBQ3hCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztLQUNEO0lBRUQsSUFBVyxZQUlWO0lBSkQsV0FBVyxZQUFZO1FBQ3RCLHFDQUFxQixDQUFBO1FBQ3JCLDZEQUFnQixDQUFBO1FBQ2hCLDBEQUFjLENBQUE7SUFDZixDQUFDLEVBSlUsWUFBWSxLQUFaLFlBQVksUUFJdEI7SUFFRCxNQUFNLG9CQUFvQjtRQUd6Qix5RUFBeUU7UUFDbEUsTUFBTSxDQUFDLFNBQVM7WUFDdEIsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUN4QixDQUFDO1FBRUQsWUFBNkIsWUFBb0I7WUFBcEIsaUJBQVksR0FBWixZQUFZLENBQVE7UUFBSSxDQUFDO1FBRXRELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWTtZQUN0QiwyR0FBMkc7WUFDM0csdUZBQXVGO1lBQ3ZGLE1BQU0sRUFBRSxHQUFHLG1CQUFVLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLFVBQVUsaUNBQXdCLENBQUMsQ0FBQztZQUNyRixrSkFBa0o7WUFDbEosTUFBTSxZQUFZLEdBQUcsTUFBTSxtQkFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUM5RCxFQUFFLElBQUksRUFBRSxzQ0FBK0IsRUFBRSxNQUFNLEVBQUUsaUNBQWdDLEVBQUUsRUFDbkYs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