/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/uri", "vs/platform/extensions/common/extensionValidator", "vs/workbench/api/common/extHostWebviewMessaging", "vs/workbench/contrib/webview/common/webview", "./extHost.protocol"], function (require, exports, event_1, lifecycle_1, network_1, objects, uri_1, extensionValidator_1, extHostWebviewMessaging_1, webview_1, extHostProtocol) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostWebviews = exports.ExtHostWebview = void 0;
    exports.shouldSerializeBuffersForPostMessage = shouldSerializeBuffersForPostMessage;
    exports.toExtensionData = toExtensionData;
    exports.serializeWebviewOptions = serializeWebviewOptions;
    class ExtHostWebview {
        #handle;
        #proxy;
        #deprecationService;
        #remoteInfo;
        #workspace;
        #extension;
        #html;
        #options;
        #isDisposed;
        #hasCalledAsWebviewUri;
        #serializeBuffersForPostMessage;
        #shouldRewriteOldResourceUris;
        constructor(handle, proxy, options, remoteInfo, workspace, extension, deprecationService) {
            this.#html = '';
            this.#isDisposed = false;
            this.#hasCalledAsWebviewUri = false;
            /* internal */ this._onMessageEmitter = new event_1.Emitter();
            this.onDidReceiveMessage = this._onMessageEmitter.event;
            this.#onDidDisposeEmitter = new event_1.Emitter();
            /* internal */ this._onDidDispose = this.#onDidDisposeEmitter.event;
            this.#handle = handle;
            this.#proxy = proxy;
            this.#options = options;
            this.#remoteInfo = remoteInfo;
            this.#workspace = workspace;
            this.#extension = extension;
            this.#serializeBuffersForPostMessage = shouldSerializeBuffersForPostMessage(extension);
            this.#shouldRewriteOldResourceUris = shouldTryRewritingOldResourceUris(extension);
            this.#deprecationService = deprecationService;
        }
        #onDidDisposeEmitter;
        dispose() {
            this.#isDisposed = true;
            this.#onDidDisposeEmitter.fire();
            this.#onDidDisposeEmitter.dispose();
            this._onMessageEmitter.dispose();
        }
        asWebviewUri(resource) {
            this.#hasCalledAsWebviewUri = true;
            return (0, webview_1.asWebviewUri)(resource, this.#remoteInfo);
        }
        get cspSource() {
            const extensionLocation = this.#extension.extensionLocation;
            if (extensionLocation.scheme === network_1.Schemas.https || extensionLocation.scheme === network_1.Schemas.http) {
                // The extension is being served up from a CDN.
                // Also include the CDN in the default csp.
                let extensionCspRule = extensionLocation.toString();
                if (!extensionCspRule.endsWith('/')) {
                    // Always treat the location as a directory so that we allow all content under it
                    extensionCspRule += '/';
                }
                return extensionCspRule + ' ' + webview_1.webviewGenericCspSource;
            }
            return webview_1.webviewGenericCspSource;
        }
        get html() {
            this.assertNotDisposed();
            return this.#html;
        }
        set html(value) {
            this.assertNotDisposed();
            if (this.#html !== value) {
                this.#html = value;
                if (this.#shouldRewriteOldResourceUris && !this.#hasCalledAsWebviewUri && /(["'])vscode-resource:([^\s'"]+?)(["'])/i.test(value)) {
                    this.#hasCalledAsWebviewUri = true;
                    this.#deprecationService.report('Webview vscode-resource: uris', this.#extension, `Please migrate to use the 'webview.asWebviewUri' api instead: https://aka.ms/vscode-webview-use-aswebviewuri`);
                }
                this.#proxy.$setHtml(this.#handle, this.rewriteOldResourceUrlsIfNeeded(value));
            }
        }
        get options() {
            this.assertNotDisposed();
            return this.#options;
        }
        set options(newOptions) {
            this.assertNotDisposed();
            if (!objects.equals(this.#options, newOptions)) {
                this.#proxy.$setOptions(this.#handle, serializeWebviewOptions(this.#extension, this.#workspace, newOptions));
            }
            this.#options = newOptions;
        }
        async postMessage(message) {
            if (this.#isDisposed) {
                return false;
            }
            const serialized = (0, extHostWebviewMessaging_1.serializeWebviewMessage)(message, { serializeBuffersForPostMessage: this.#serializeBuffersForPostMessage });
            return this.#proxy.$postMessage(this.#handle, serialized.message, ...serialized.buffers);
        }
        assertNotDisposed() {
            if (this.#isDisposed) {
                throw new Error('Webview is disposed');
            }
        }
        rewriteOldResourceUrlsIfNeeded(value) {
            if (!this.#shouldRewriteOldResourceUris) {
                return value;
            }
            const isRemote = this.#extension.extensionLocation?.scheme === network_1.Schemas.vscodeRemote;
            const remoteAuthority = this.#extension.extensionLocation.scheme === network_1.Schemas.vscodeRemote ? this.#extension.extensionLocation.authority : undefined;
            return value
                .replace(/(["'])(?:vscode-resource):(\/\/([^\s\/'"]+?)(?=\/))?([^\s'"]+?)(["'])/gi, (_match, startQuote, _1, scheme, path, endQuote) => {
                const uri = uri_1.URI.from({
                    scheme: scheme || 'file',
                    path: decodeURIComponent(path),
                });
                const webviewUri = (0, webview_1.asWebviewUri)(uri, { isRemote, authority: remoteAuthority }).toString();
                return `${startQuote}${webviewUri}${endQuote}`;
            })
                .replace(/(["'])(?:vscode-webview-resource):(\/\/[^\s\/'"]+\/([^\s\/'"]+?)(?=\/))?([^\s'"]+?)(["'])/gi, (_match, startQuote, _1, scheme, path, endQuote) => {
                const uri = uri_1.URI.from({
                    scheme: scheme || 'file',
                    path: decodeURIComponent(path),
                });
                const webviewUri = (0, webview_1.asWebviewUri)(uri, { isRemote, authority: remoteAuthority }).toString();
                return `${startQuote}${webviewUri}${endQuote}`;
            });
        }
    }
    exports.ExtHostWebview = ExtHostWebview;
    function shouldSerializeBuffersForPostMessage(extension) {
        try {
            const version = (0, extensionValidator_1.normalizeVersion)((0, extensionValidator_1.parseVersion)(extension.engines.vscode));
            return !!version && version.majorBase >= 1 && version.minorBase >= 57;
        }
        catch {
            return false;
        }
    }
    function shouldTryRewritingOldResourceUris(extension) {
        try {
            const version = (0, extensionValidator_1.normalizeVersion)((0, extensionValidator_1.parseVersion)(extension.engines.vscode));
            if (!version) {
                return false;
            }
            return version.majorBase < 1 || (version.majorBase === 1 && version.minorBase < 60);
        }
        catch {
            return false;
        }
    }
    class ExtHostWebviews extends lifecycle_1.Disposable {
        constructor(mainContext, remoteInfo, workspace, _logService, _deprecationService) {
            super();
            this.remoteInfo = remoteInfo;
            this.workspace = workspace;
            this._logService = _logService;
            this._deprecationService = _deprecationService;
            this._webviews = new Map();
            this._webviewProxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadWebviews);
        }
        dispose() {
            super.dispose();
            for (const webview of this._webviews.values()) {
                webview.dispose();
            }
            this._webviews.clear();
        }
        $onMessage(handle, jsonMessage, buffers) {
            const webview = this.getWebview(handle);
            if (webview) {
                const { message } = (0, extHostWebviewMessaging_1.deserializeWebviewMessage)(jsonMessage, buffers.value);
                webview._onMessageEmitter.fire(message);
            }
        }
        $onMissingCsp(_handle, extensionId) {
            this._logService.warn(`${extensionId} created a webview without a content security policy: https://aka.ms/vscode-webview-missing-csp`);
        }
        createNewWebview(handle, options, extension) {
            const webview = new ExtHostWebview(handle, this._webviewProxy, reviveOptions(options), this.remoteInfo, this.workspace, extension, this._deprecationService);
            this._webviews.set(handle, webview);
            const sub = webview._onDidDispose(() => {
                sub.dispose();
                this.deleteWebview(handle);
            });
            return webview;
        }
        deleteWebview(handle) {
            this._webviews.delete(handle);
        }
        getWebview(handle) {
            return this._webviews.get(handle);
        }
    }
    exports.ExtHostWebviews = ExtHostWebviews;
    function toExtensionData(extension) {
        return { id: extension.identifier, location: extension.extensionLocation };
    }
    function serializeWebviewOptions(extension, workspace, options) {
        return {
            enableCommandUris: options.enableCommandUris,
            enableScripts: options.enableScripts,
            enableForms: options.enableForms,
            portMapping: options.portMapping,
            localResourceRoots: options.localResourceRoots || getDefaultLocalResourceRoots(extension, workspace)
        };
    }
    function reviveOptions(options) {
        return {
            enableCommandUris: options.enableCommandUris,
            enableScripts: options.enableScripts,
            enableForms: options.enableForms,
            portMapping: options.portMapping,
            localResourceRoots: options.localResourceRoots?.map(components => uri_1.URI.from(components)),
        };
    }
    function getDefaultLocalResourceRoots(extension, workspace) {
        return [
            ...(workspace?.getWorkspaceFolders() || []).map(x => x.uri),
            extension.extensionLocation,
        ];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdlYnZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0V2Vidmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3S2hHLG9GQU9DO0lBaUZELDBDQUVDO0lBRUQsMERBWUM7SUEzUEQsTUFBYSxjQUFjO1FBRWpCLE9BQU8sQ0FBZ0M7UUFDdkMsTUFBTSxDQUEwQztRQUNoRCxtQkFBbUIsQ0FBZ0M7UUFFbkQsV0FBVyxDQUFvQjtRQUMvQixVQUFVLENBQWdDO1FBQzFDLFVBQVUsQ0FBd0I7UUFFM0MsS0FBSyxDQUFjO1FBQ25CLFFBQVEsQ0FBd0I7UUFDaEMsV0FBVyxDQUFrQjtRQUM3QixzQkFBc0IsQ0FBUztRQUUvQiwrQkFBK0IsQ0FBVTtRQUN6Qyw2QkFBNkIsQ0FBVTtRQUV2QyxZQUNDLE1BQXFDLEVBQ3JDLEtBQThDLEVBQzlDLE9BQThCLEVBQzlCLFVBQTZCLEVBQzdCLFNBQXdDLEVBQ3hDLFNBQWdDLEVBQ2hDLGtCQUFpRDtZQWZsRCxVQUFLLEdBQVcsRUFBRSxDQUFDO1lBRW5CLGdCQUFXLEdBQVksS0FBSyxDQUFDO1lBQzdCLDJCQUFzQixHQUFHLEtBQUssQ0FBQztZQXlCL0IsY0FBYyxDQUFVLHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUFPLENBQUM7WUFDL0Msd0JBQW1CLEdBQWUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUV0RSx5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3BELGNBQWMsQ0FBVSxrQkFBYSxHQUFnQixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBZnBGLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxNQUFNLEdB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