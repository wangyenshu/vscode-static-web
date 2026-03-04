/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostWebview", "vs/workbench/api/common/extHostTypeConverters", "./extHost.protocol", "./extHostTypes"], function (require, exports, event_1, lifecycle_1, extHostWebview_1, extHostTypeConverters_1, extHostProtocol, extHostTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostWebviewViews = void 0;
    /* eslint-disable local/code-no-native-private */
    class ExtHostWebviewView extends lifecycle_1.Disposable {
        #handle;
        #proxy;
        #viewType;
        #webview;
        #isDisposed;
        #isVisible;
        #title;
        #description;
        #badge;
        constructor(handle, proxy, viewType, title, webview, isVisible) {
            super();
            this.#isDisposed = false;
            this.#onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this.#onDidChangeVisibility.event;
            this.#onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this.#onDidDispose.event;
            this.#viewType = viewType;
            this.#title = title;
            this.#handle = handle;
            this.#proxy = proxy;
            this.#webview = webview;
            this.#isVisible = isVisible;
        }
        dispose() {
            if (this.#isDisposed) {
                return;
            }
            this.#isDisposed = true;
            this.#onDidDispose.fire();
            this.#webview.dispose();
            super.dispose();
        }
        #onDidChangeVisibility;
        #onDidDispose;
        get title() {
            this.assertNotDisposed();
            return this.#title;
        }
        set title(value) {
            this.assertNotDisposed();
            if (this.#title !== value) {
                this.#title = value;
                this.#proxy.$setWebviewViewTitle(this.#handle, value);
            }
        }
        get description() {
            this.assertNotDisposed();
            return this.#description;
        }
        set description(value) {
            this.assertNotDisposed();
            if (this.#description !== value) {
                this.#description = value;
                this.#proxy.$setWebviewViewDescription(this.#handle, value);
            }
        }
        get visible() { return this.#isVisible; }
        get webview() { return this.#webview; }
        get viewType() { return this.#viewType; }
        /* internal */ _setVisible(visible) {
            if (visible === this.#isVisible || this.#isDisposed) {
                return;
            }
            this.#isVisible = visible;
            this.#onDidChangeVisibility.fire();
        }
        get badge() {
            this.assertNotDisposed();
            return this.#badge;
        }
        set badge(badge) {
            this.assertNotDisposed();
            if (badge?.value === this.#badge?.value &&
                badge?.tooltip === this.#badge?.tooltip) {
                return;
            }
            this.#badge = extHostTypeConverters_1.ViewBadge.from(badge);
            this.#proxy.$setWebviewViewBadge(this.#handle, badge);
        }
        show(preserveFocus) {
            this.assertNotDisposed();
            this.#proxy.$show(this.#handle, !!preserveFocus);
        }
        assertNotDisposed() {
            if (this.#isDisposed) {
                throw new Error('Webview is disposed');
            }
        }
    }
    class ExtHostWebviewViews {
        constructor(mainContext, _extHostWebview) {
            this._extHostWebview = _extHostWebview;
            this._viewProviders = new Map();
            this._webviewViews = new Map();
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadWebviewViews);
        }
        registerWebviewViewProvider(extension, viewType, provider, webviewOptions) {
            if (this._viewProviders.has(viewType)) {
                throw new Error(`View provider for '${viewType}' already registered`);
            }
            this._viewProviders.set(viewType, { provider, extension });
            this._proxy.$registerWebviewViewProvider((0, extHostWebview_1.toExtensionData)(extension), viewType, {
                retainContextWhenHidden: webviewOptions?.retainContextWhenHidden,
                serializeBuffersForPostMessage: (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension),
            });
            return new extHostTypes.Disposable(() => {
                this._viewProviders.delete(viewType);
                this._proxy.$unregisterWebviewViewProvider(viewType);
            });
        }
        async $resolveWebviewView(webviewHandle, viewType, title, state, cancellation) {
            const entry = this._viewProviders.get(viewType);
            if (!entry) {
                throw new Error(`No view provider found for '${viewType}'`);
            }
            const { provider, extension } = entry;
            const webview = this._extHostWebview.createNewWebview(webviewHandle, { /* todo */}, extension);
            const revivedView = new ExtHostWebviewView(webviewHandle, this._proxy, viewType, title, webview, true);
            this._webviewViews.set(webviewHandle, revivedView);
            await provider.resolveWebviewView(revivedView, { state }, cancellation);
        }
        async $onDidChangeWebviewViewVisibility(webviewHandle, visible) {
            const webviewView = this.getWebviewView(webviewHandle);
            webviewView._setVisible(visible);
        }
        async $disposeWebviewView(webviewHandle) {
            const webviewView = this.getWebviewView(webviewHandle);
            this._webviewViews.delete(webviewHandle);
            webviewView.dispose();
            this._extHostWebview.deleteWebview(webviewHandle);
        }
        getWebviewView(handle) {
            const entry = this._webviewViews.get(handle);
            if (!entry) {
                throw new Error('No webview found');
            }
            return entry;
        }
    }
    exports.ExtHostWebviewViews = ExtHostWebviewViews;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdlYnZpZXdWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFdlYnZpZXdWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxpREFBaUQ7SUFFakQsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQUVqQyxPQUFPLENBQWdDO1FBQ3ZDLE1BQU0sQ0FBOEM7UUFFcEQsU0FBUyxDQUFTO1FBQ2xCLFFBQVEsQ0FBaUI7UUFFbEMsV0FBVyxDQUFTO1FBQ3BCLFVBQVUsQ0FBVTtRQUNwQixNQUFNLENBQXFCO1FBQzNCLFlBQVksQ0FBcUI7UUFDakMsTUFBTSxDQUErQjtRQUVyQyxZQUNDLE1BQXFDLEVBQ3JDLEtBQWtELEVBQ2xELFFBQWdCLEVBQ2hCLEtBQXlCLEVBQ3pCLE9BQXVCLEVBQ3ZCLFNBQWtCO1lBRWxCLEtBQUssRUFBRSxDQUFDO1lBZFQsZ0JBQVcsR0FBRyxLQUFLLENBQUM7WUFxQ1gsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDdEQsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUVqRSxrQkFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzdDLGlCQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7WUF6QnZELElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxD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