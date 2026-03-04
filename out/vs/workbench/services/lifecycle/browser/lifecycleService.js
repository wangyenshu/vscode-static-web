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
define(["require", "exports", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/services/lifecycle/common/lifecycleService", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/base/common/cancellation", "vs/base/browser/window", "vs/base/common/arrays"], function (require, exports, lifecycle_1, log_1, lifecycleService_1, nls_1, extensions_1, dom_1, storage_1, cancellation_1, window_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserLifecycleService = void 0;
    let BrowserLifecycleService = class BrowserLifecycleService extends lifecycleService_1.AbstractLifecycleService {
        constructor(logService, storageService) {
            super(logService, storageService);
            this.beforeUnloadListener = undefined;
            this.unloadListener = undefined;
            this.ignoreBeforeUnload = false;
            this.didUnload = false;
            this.registerListeners();
        }
        registerListeners() {
            // Listen to `beforeUnload` to support to veto
            this.beforeUnloadListener = (0, dom_1.addDisposableListener)(window_1.mainWindow, dom_1.EventType.BEFORE_UNLOAD, (e) => this.onBeforeUnload(e));
            // Listen to `pagehide` to support orderly shutdown
            // We explicitly do not listen to `unload` event
            // which would disable certain browser caching.
            // We currently do not handle the `persisted` property
            // (https://github.com/microsoft/vscode/issues/136216)
            this.unloadListener = (0, dom_1.addDisposableListener)(window_1.mainWindow, dom_1.EventType.PAGE_HIDE, () => this.onUnload());
        }
        onBeforeUnload(event) {
            // Before unload ignored (once)
            if (this.ignoreBeforeUnload) {
                this.logService.info('[lifecycle] onBeforeUnload triggered but ignored once');
                this.ignoreBeforeUnload = false;
            }
            // Before unload with veto support
            else {
                this.logService.info('[lifecycle] onBeforeUnload triggered and handled with veto support');
                this.doShutdown(() => this.vetoBeforeUnload(event));
            }
        }
        vetoBeforeUnload(event) {
            event.preventDefault();
            event.returnValue = (0, nls_1.localize)('lifecycleVeto', "Changes that you made may not be saved. Please check press 'Cancel' and try again.");
        }
        withExpectedShutdown(reason, callback) {
            // Standard shutdown
            if (typeof reason === 'number') {
                this.shutdownReason = reason;
                // Ensure UI state is persisted
                return this.storageService.flush(storage_1.WillSaveStateReason.SHUTDOWN);
            }
            // Before unload handling ignored for duration of callback
            else {
                this.ignoreBeforeUnload = true;
                try {
                    callback?.();
                }
                finally {
                    this.ignoreBeforeUnload = false;
                }
            }
        }
        async shutdown() {
            this.logService.info('[lifecycle] shutdown triggered');
            // An explicit shutdown renders our unload
            // event handlers disabled, so dispose them.
            this.beforeUnloadListener?.dispose();
            this.unloadListener?.dispose();
            // Ensure UI state is persisted
            await this.storageService.flush(storage_1.WillSaveStateReason.SHUTDOWN);
            // Handle shutdown without veto support
            this.doShutdown();
        }
        doShutdown(vetoShutdown) {
            const logService = this.logService;
            // Optimistically trigger a UI state flush
            // without waiting for it. The browser does
            // not guarantee that this is being executed
            // but if a dialog opens, we have a chance
            // to succeed.
            this.storageService.flush(storage_1.WillSaveStateReason.SHUTDOWN);
            let veto = false;
            function handleVeto(vetoResult, id) {
                if (typeof vetoShutdown !== 'function') {
                    return; // veto handling disabled
                }
                if (vetoResult instanceof Promise) {
                    logService.error(`[lifecycle] Long running operations before shutdown are unsupported in the web (id: ${id})`);
                    veto = true; // implicitly vetos since we cannot handle promises in web
                }
                if (vetoResult === true) {
                    logService.info(`[lifecycle]: Unload was prevented (id: ${id})`);
                    veto = true;
                }
            }
            // Before Shutdown
            this._onBeforeShutdown.fire({
                reason: 2 /* ShutdownReason.QUIT */,
                veto(value, id) {
                    handleVeto(value, id);
                },
                finalVeto(valueFn, id) {
                    handleVeto(valueFn(), id); // in browser, trigger instantly because we do not support async anyway
                }
            });
            // Veto: handle if provided
            if (veto && typeof vetoShutdown === 'function') {
                return vetoShutdown();
            }
            // No veto, continue to shutdown
            return this.onUnload();
        }
        onUnload() {
            if (this.didUnload) {
                return; // only once
            }
            this.didUnload = true;
            // Register a late `pageshow` listener specifically on unload
            this._register((0, dom_1.addDisposableListener)(window_1.mainWindow, dom_1.EventType.PAGE_SHOW, (e) => this.onLoadAfterUnload(e)));
            // First indicate will-shutdown
            const logService = this.logService;
            this._onWillShutdown.fire({
                reason: 2 /* ShutdownReason.QUIT */,
                joiners: () => [], // Unsupported in web
                token: cancellation_1.CancellationToken.None, // Unsupported in web
                join(promise, joiner) {
                    logService.error(`[lifecycle] Long running operations during shutdown are unsupported in the web (id: ${joiner.id})`);
                },
                force: () => { },
            });
            // Finally end with did-shutdown
            this._onDidShutdown.fire();
        }
        onLoadAfterUnload(event) {
            // We only really care about page-show events
            // where the browser indicates to us that the
            // page was restored from cache and not freshly
            // loaded.
            const wasRestoredFromCache = event.persisted;
            if (!wasRestoredFromCache) {
                return;
            }
            // At this point, we know that the page was restored from
            // cache even though it was unloaded before,
            // so in order to get back to a functional workbench, we
            // currently can only reload the window
            // Docs: https://web.dev/bfcache/#optimize-your-pages-for-bfcache
            // Refs: https://github.com/microsoft/vscode/issues/136035
            this.withExpectedShutdown({ disableShutdownHandling: true }, () => window_1.mainWindow.location.reload());
        }
        doResolveStartupKind() {
            let startupKind = super.doResolveStartupKind();
            if (typeof startupKind !== 'number') {
                const timing = (0, arrays_1.firstOrDefault)(performance.getEntriesByType('navigation'));
                if (timing?.type === 'reload') {
                    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/type#value
                    startupKind = 3 /* StartupKind.ReloadedWindow */;
                }
            }
            return startupKind;
        }
    };
    exports.BrowserLifecycleService = BrowserLifecycleService;
    exports.BrowserLifecycleService = BrowserLifecycleService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, storage_1.IStorageService)
    ], BrowserLifecycleService);
    (0, extensions_1.registerSingleton)(lifecycle_1.ILifecycleService, BrowserLifecycleService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9saWZlY3ljbGUvYnJvd3Nlci9saWZlY3ljbGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLDJDQUF3QjtRQVNwRSxZQUNjLFVBQXVCLEVBQ25CLGNBQStCO1lBRWhELEtBQUssQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFYM0IseUJBQW9CLEdBQTRCLFNBQVMsQ0FBQztZQUMxRCxtQkFBYyxHQUE0QixTQUFTLENBQUM7WUFFcEQsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1lBRTNCLGNBQVMsR0FBRyxLQUFLLENBQUM7WUFRekIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUV4Qiw4Q0FBOEM7WUFDOUMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUEsMkJBQXFCLEVBQUMsbUJBQVUsRUFBRSxlQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpJLG1EQUFtRDtZQUNuRCxnREFBZ0Q7WUFDaEQsK0NBQStDO1lBQy9DLHNEQUFzRDtZQUN0RCxzREFBc0Q7WUFDdEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFBLDJCQUFxQixFQUFDLG1CQUFVLEVBQUUsZUFBUyxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNyRyxDQUFDO1FBRU8sY0FBYyxDQUFDLEtBQXdCO1lB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