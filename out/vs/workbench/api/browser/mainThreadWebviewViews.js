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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/webviewView/browser/webviewViewService", "vs/platform/telemetry/common/telemetry"], function (require, exports, errors_1, lifecycle_1, uuid_1, mainThreadWebviews_1, extHostProtocol, webviewViewService_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviewsViews = void 0;
    let MainThreadWebviewsViews = class MainThreadWebviewsViews extends lifecycle_1.Disposable {
        constructor(context, mainThreadWebviews, _telemetryService, _webviewViewService) {
            super();
            this.mainThreadWebviews = mainThreadWebviews;
            this._telemetryService = _telemetryService;
            this._webviewViewService = _webviewViewService;
            this._webviewViews = this._register(new lifecycle_1.DisposableMap());
            this._webviewViewProviders = this._register(new lifecycle_1.DisposableMap());
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviewViews);
        }
        $setWebviewViewTitle(handle, value) {
            const webviewView = this.getWebviewView(handle);
            webviewView.title = value;
        }
        $setWebviewViewDescription(handle, value) {
            const webviewView = this.getWebviewView(handle);
            webviewView.description = value;
        }
        $setWebviewViewBadge(handle, badge) {
            const webviewView = this.getWebviewView(handle);
            webviewView.badge = badge;
        }
        $show(handle, preserveFocus) {
            const webviewView = this.getWebviewView(handle);
            webviewView.show(preserveFocus);
        }
        $registerWebviewViewProvider(extensionData, viewType, options) {
            if (this._webviewViewProviders.has(viewType)) {
                throw new Error(`View provider for ${viewType} already registered`);
            }
            const extension = (0, mainThreadWebviews_1.reviveWebviewExtension)(extensionData);
            const registration = this._webviewViewService.register(viewType, {
                resolve: async (webviewView, cancellation) => {
                    const handle = (0, uuid_1.generateUuid)();
                    this._webviewViews.set(handle, webviewView);
                    this.mainThreadWebviews.addWebview(handle, webviewView.webview, { serializeBuffersForPostMessage: options.serializeBuffersForPostMessage });
                    let state = undefined;
                    if (webviewView.webview.state) {
                        try {
                            state = JSON.parse(webviewView.webview.state);
                        }
                        catch (e) {
                            console.error('Could not load webview state', e, webviewView.webview.state);
                        }
                    }
                    webviewView.webview.extension = extension;
                    if (options) {
                        webviewView.webview.options = options;
                    }
                    webviewView.onDidChangeVisibility(visible => {
                        this._proxy.$onDidChangeWebviewViewVisibility(handle, visible);
                    });
                    webviewView.onDispose(() => {
                        this._proxy.$disposeWebviewView(handle);
                        this._webviewViews.deleteAndDispose(handle);
                    });
                    this._telemetryService.publicLog2('webviews:createWebviewView', {
                        extensionId: extension.id.value,
                        id: viewType,
                    });
                    try {
                        await this._proxy.$resolveWebviewView(handle, viewType, webviewView.title, state, cancellation);
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                        webviewView.webview.setHtml(this.mainThreadWebviews.getWebviewResolvedFailedContent(viewType));
                    }
                }
            });
            this._webviewViewProviders.set(viewType, registration);
        }
        $unregisterWebviewViewProvider(viewType) {
            if (!this._webviewViewProviders.has(viewType)) {
                throw new Error(`No view provider for ${viewType} registered`);
            }
            this._webviewViewProviders.deleteAndDispose(viewType);
        }
        getWebviewView(handle) {
            const webviewView = this._webviewViews.get(handle);
            if (!webviewView) {
                throw new Error('unknown webview view');
            }
            return webviewView;
        }
    };
    exports.MainThreadWebviewsViews = MainThreadWebviewsViews;
    exports.MainThreadWebviewsViews = MainThreadWebviewsViews = __decorate([
        __param(2, telemetry_1.ITelemetryService),
        __param(3, webviewViewService_1.IWebviewViewService)
    ], MainThreadWebviewsViews);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFdlYnZpZXdWaWV3cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkV2Vidmlld1ZpZXdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBT3RELFlBQ0MsT0FBd0IsRUFDUCxrQkFBc0MsRUFDcEMsaUJBQXFELEVBQ25ELG1CQUF5RDtZQUU5RSxLQUFLLEVBQUUsQ0FBQztZQUpTLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNsQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBUDlELGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFhLEVBQXVCLENBQUMsQ0FBQztZQUN6RSwwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBVSxDQUFDLENBQUM7WUFVcEYsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBRU0sb0JBQW9CLENBQUMsTUFBcUMsRUFBRSxLQUF5QjtZQUMzRixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELFdBQVcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQzNCLENBQUM7UUFFTSwwQkFBMEIsQ0FBQyxNQUFxQyxFQUFFLEtBQXlCO1lBQ2pHLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFD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