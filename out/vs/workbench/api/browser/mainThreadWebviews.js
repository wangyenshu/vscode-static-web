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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/nls", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostWebviewMessaging", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, lifecycle_1, network_1, platform_1, strings_1, uri_1, nls_1, opener_1, productService_1, extHostProtocol, extHostWebviewMessaging_1, proxyIdentifier_1) {
    "use strict";
    var MainThreadWebviews_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviews = void 0;
    exports.reviveWebviewExtension = reviveWebviewExtension;
    exports.reviveWebviewContentOptions = reviveWebviewContentOptions;
    let MainThreadWebviews = class MainThreadWebviews extends lifecycle_1.Disposable {
        static { MainThreadWebviews_1 = this; }
        static { this.standardSupportedLinkSchemes = new Set([
            network_1.Schemas.http,
            network_1.Schemas.https,
            network_1.Schemas.mailto,
            network_1.Schemas.vscode,
            'vscode-insider',
        ]); }
        constructor(context, _openerService, _productService) {
            super();
            this._openerService = _openerService;
            this._productService = _productService;
            this._webviews = new Map();
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviews);
        }
        addWebview(handle, webview, options) {
            if (this._webviews.has(handle)) {
                throw new Error('Webview already registered');
            }
            this._webviews.set(handle, webview);
            this.hookupWebviewEventDelegate(handle, webview, options);
        }
        $setHtml(handle, value) {
            this.tryGetWebview(handle)?.setHtml(value);
        }
        $setOptions(handle, options) {
            const webview = this.tryGetWebview(handle);
            if (webview) {
                webview.contentOptions = reviveWebviewContentOptions(options);
            }
        }
        async $postMessage(handle, jsonMessage, ...buffers) {
            const webview = this.tryGetWebview(handle);
            if (!webview) {
                return false;
            }
            const { message, arrayBuffers } = (0, extHostWebviewMessaging_1.deserializeWebviewMessage)(jsonMessage, buffers);
            return webview.postMessage(message, arrayBuffers);
        }
        hookupWebviewEventDelegate(handle, webview, options) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(webview.onDidClickLink((uri) => this.onDidClickLink(handle, uri)));
            disposables.add(webview.onMessage((message) => {
                const serialized = (0, extHostWebviewMessaging_1.serializeWebviewMessage)(message.message, options);
                this._proxy.$onMessage(handle, serialized.message, new proxyIdentifier_1.SerializableObjectWithBuffers(serialized.buffers));
            }));
            disposables.add(webview.onMissingCsp((extension) => this._proxy.$onMissingCsp(handle, extension.value)));
            disposables.add(webview.onDidDispose(() => {
                disposables.dispose();
                this._webviews.delete(handle);
            }));
        }
        onDidClickLink(handle, link) {
            const webview = this.getWebview(handle);
            if (this.isSupportedLink(webview, uri_1.URI.parse(link))) {
                this._openerService.open(link, { fromUserGesture: true, allowContributedOpeners: true, allowCommands: Array.isArray(webview.contentOptions.enableCommandUris) || webview.contentOptions.enableCommandUris === true, fromWorkspace: true });
            }
        }
        isSupportedLink(webview, link) {
            if (MainThreadWebviews_1.standardSupportedLinkSchemes.has(link.scheme)) {
                return true;
            }
            if (!platform_1.isWeb && this._productService.urlProtocol === link.scheme) {
                return true;
            }
            if (link.scheme === network_1.Schemas.command) {
                if (Array.isArray(webview.contentOptions.enableCommandUris)) {
                    return webview.contentOptions.enableCommandUris.includes(link.path);
                }
                return webview.contentOptions.enableCommandUris === true;
            }
            return false;
        }
        tryGetWebview(handle) {
            return this._webviews.get(handle);
        }
        getWebview(handle) {
            const webview = this.tryGetWebview(handle);
            if (!webview) {
                throw new Error(`Unknown webview handle:${handle}`);
            }
            return webview;
        }
        getWebviewResolvedFailedContent(viewType) {
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';">
			</head>
			<body>${(0, nls_1.localize)('errorMessage', "An error occurred while loading view: {0}", (0, strings_1.escape)(viewType))}</body>
		</html>`;
        }
    };
    exports.MainThreadWebviews = MainThreadWebviews;
    exports.MainThreadWebviews = MainThreadWebviews = MainThreadWebviews_1 = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, productService_1.IProductService)
    ], MainThreadWebviews);
    function reviveWebviewExtension(extensionData) {
        return {
            id: extensionData.id,
            location: uri_1.URI.revive(extensionData.location),
        };
    }
    function reviveWebviewContentOptions(webviewOptions) {
        return {
            allowScripts: webviewOptions.enableScripts,
            allowForms: webviewOptions.enableForms,
            enableCommandUris: webviewOptions.enableCommandUris,
            localResourceRoots: Array.isArray(webviewOptions.localResourceRoots) ? webviewOptions.localResourceRoots.map(r => uri_1.URI.revive(r)) : undefined,
            portMapping: webviewOptions.portMapping,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFdlYnZpZXdzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRXZWJ2aWV3cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNEloRyx3REFLQztJQUVELGtFQVFDO0lBeklNLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7O2lCQUV6QixpQ0FBNEIsR0FBRyxJQUFJLEdBQUcsQ0FBQztZQUM5RCxpQkFBTyxDQUFDLElBQUk7WUFDWixpQkFBTyxDQUFDLEtBQUs7WUFDYixpQkFBTyxDQUFDLE1BQU07WUFDZCxpQkFBTyxDQUFDLE1BQU07WUFDZCxnQkFBZ0I7U0FDaEIsQ0FBQyxBQU5rRCxDQU1qRDtRQU1ILFlBQ0MsT0FBd0IsRUFDUixjQUErQyxFQUM5QyxlQUFpRDtZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQUh5QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDN0Isb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBTGxELGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQztZQVN4RCxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBRU0sVUFBVSxDQUFDLE1BQXFDLEVBQUUsT0FBd0IsRUFBRSxPQUFvRDtZQUN0SSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFB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