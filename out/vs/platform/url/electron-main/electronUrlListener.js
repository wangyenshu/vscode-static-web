/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, electron_1, async_1, event_1, lifecycle_1, platform_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronURLListener = void 0;
    /**
     * A listener for URLs that are opened from the OS and handled by VSCode.
     * Depending on the platform, this works differently:
     * - Windows: we use `app.setAsDefaultProtocolClient()` to register VSCode with the OS
     *            and additionally add the `open-url` command line argument to identify.
     * - macOS:   we rely on `app.on('open-url')` to be called by the OS
     * - Linux:   we have a special shortcut installed (`resources/linux/code-url-handler.desktop`)
     *            that calls VSCode with the `open-url` command line argument
     *            (https://github.com/microsoft/vscode/pull/56727)
     */
    class ElectronURLListener extends lifecycle_1.Disposable {
        constructor(initialProtocolUrls, urlService, windowsMainService, environmentMainService, productService, logService) {
            super();
            this.urlService = urlService;
            this.logService = logService;
            this.uris = [];
            this.retryCount = 0;
            if (initialProtocolUrls) {
                logService.trace('ElectronURLListener initialUrisToHandle:', initialProtocolUrls.map(url => url.originalUrl));
                // the initial set of URIs we need to handle once the window is ready
                this.uris = initialProtocolUrls;
            }
            // Windows: install as protocol handler
            if (platform_1.isWindows) {
                const windowsParameters = environmentMainService.isBuilt ? [] : [`"${environmentMainService.appRoot}"`];
                windowsParameters.push('--open-url', '--');
                electron_1.app.setAsDefaultProtocolClient(productService.urlProtocol, process.execPath, windowsParameters);
            }
            // macOS: listen to `open-url` events from here on to handle
            const onOpenElectronUrl = event_1.Event.map(event_1.Event.fromNodeEventEmitter(electron_1.app, 'open-url', (event, url) => ({ event, url })), ({ event, url }) => {
                event.preventDefault(); // always prevent default and return the url as string
                return url;
            });
            this._register(onOpenElectronUrl(url => {
                const uri = this.uriFromRawUrl(url);
                if (!uri) {
                    return;
                }
                this.urlService.open(uri, { originalUrl: url });
            }));
            // Send initial links to the window once it has loaded
            const isWindowReady = windowsMainService.getWindows()
                .filter(window => window.isReady)
                .length > 0;
            if (isWindowReady) {
                logService.trace('ElectronURLListener: window is ready to handle URLs');
                this.flush();
            }
            else {
                logService.trace('ElectronURLListener: waiting for window to be ready to handle URLs...');
                this._register(event_1.Event.once(windowsMainService.onDidSignalReadyWindow)(() => this.flush()));
            }
        }
        uriFromRawUrl(url) {
            try {
                return uri_1.URI.parse(url);
            }
            catch (e) {
                return undefined;
            }
        }
        async flush() {
            if (this.retryCount++ > 10) {
                this.logService.trace('ElectronURLListener#flush(): giving up after 10 retries');
                return;
            }
            this.logService.trace('ElectronURLListener#flush(): flushing URLs');
            const uris = [];
            for (const obj of this.uris) {
                const handled = await this.urlService.open(obj.uri, { originalUrl: obj.originalUrl });
                if (handled) {
                    this.logService.trace('ElectronURLListener#flush(): URL was handled', obj.originalUrl);
                }
                else {
                    this.logService.trace('ElectronURLListener#flush(): URL was not yet handled', obj.originalUrl);
                    uris.push(obj);
                }
            }
            if (uris.length === 0) {
                return;
            }
            this.uris = uris;
            (0, async_1.disposableTimeout)(() => this.flush(), 500, this._store);
        }
    }
    exports.ElectronURLListener = ElectronURLListener;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb25VcmxMaXN0ZW5lci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VybC9lbGVjdHJvbi1tYWluL2VsZWN0cm9uVXJsTGlzdGVuZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHOzs7Ozs7Ozs7T0FTRztJQUNILE1BQWEsbUJBQW9CLFNBQVEsc0JBQVU7UUFLbEQsWUFDQyxtQkFBK0MsRUFDOUIsVUFBdUIsRUFDeEMsa0JBQXVDLEVBQ3ZDLHNCQUErQyxFQUMvQyxjQUErQixFQUNkLFVBQXVCO1lBRXhDLEtBQUssRUFBRSxDQUFDO1lBTlMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUl2QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBVGpDLFNBQUksR0FBbUIsRUFBRSxDQUFDO1lBQzFCLGVBQVUsR0FBRyxDQUFDLENBQUM7WUFZdEIsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO2dCQUN6QixVQUFVLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUU5RyxxRUFBcUU7Z0JBQ3JFLElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUM7WUFDakMsQ0FBQztZQUVELHVDQUF1QztZQUN2QyxJQUFJLG9CQUFTLEVBQUUsQ0FBQztnQkFDZixNQUFNLGlCQUFpQixHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksc0JBQXNCLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztnQkFDeEcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0Ms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