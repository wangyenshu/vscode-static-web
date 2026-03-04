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
define(["require", "exports", "vs/nls", "vs/base/common/performance", "vs/base/common/event", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/errors", "vs/base/common/platform", "vs/platform/window/common/window", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/workbench/browser/window", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/base/common/async", "vs/workbench/services/host/browser/host", "vs/workbench/services/environment/common/environmentService", "vs/base/common/arrays", "vs/base/browser/browser"], function (require, exports, nls_1, performance_1, event_1, dom_1, window_1, lifecycle_1, extensions_1, instantiation_1, layoutService_1, errors_1, platform_1, window_2, dialogs_1, severity_1, window_3, configuration_1, telemetry_1, async_1, host_1, environmentService_1, arrays_1, browser_1) {
    "use strict";
    var BrowserAuxiliaryWindowService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserAuxiliaryWindowService = exports.AuxiliaryWindow = exports.AuxiliaryWindowMode = exports.IAuxiliaryWindowService = void 0;
    exports.IAuxiliaryWindowService = (0, instantiation_1.createDecorator)('auxiliaryWindowService');
    var AuxiliaryWindowMode;
    (function (AuxiliaryWindowMode) {
        AuxiliaryWindowMode[AuxiliaryWindowMode["Maximized"] = 0] = "Maximized";
        AuxiliaryWindowMode[AuxiliaryWindowMode["Normal"] = 1] = "Normal";
        AuxiliaryWindowMode[AuxiliaryWindowMode["Fullscreen"] = 2] = "Fullscreen";
    })(AuxiliaryWindowMode || (exports.AuxiliaryWindowMode = AuxiliaryWindowMode = {}));
    let AuxiliaryWindow = class AuxiliaryWindow extends window_3.BaseWindow {
        constructor(window, container, stylesHaveLoaded, configurationService, hostService, environmentService) {
            super(window, undefined, hostService, environmentService);
            this.window = window;
            this.container = container;
            this.configurationService = configurationService;
            this._onWillLayout = this._register(new event_1.Emitter());
            this.onWillLayout = this._onWillLayout.event;
            this._onDidLayout = this._register(new event_1.Emitter());
            this.onDidLayout = this._onDidLayout.event;
            this._onBeforeUnload = this._register(new event_1.Emitter());
            this.onBeforeUnload = this._onBeforeUnload.event;
            this._onUnload = this._register(new event_1.Emitter());
            this.onUnload = this._onUnload.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.whenStylesHaveLoaded = stylesHaveLoaded.wait().then(() => undefined);
            this.registerListeners();
        }
        registerListeners() {
            this._register((0, dom_1.addDisposableListener)(this.window, dom_1.EventType.BEFORE_UNLOAD, (e) => this.handleBeforeUnload(e)));
            this._register((0, dom_1.addDisposableListener)(this.window, dom_1.EventType.UNLOAD, () => this.handleUnload()));
            this._register((0, dom_1.addDisposableListener)(this.window, 'unhandledrejection', e => {
                (0, errors_1.onUnexpectedError)(e.reason);
                e.preventDefault();
            }));
            this._register((0, dom_1.addDisposableListener)(this.window, dom_1.EventType.RESIZE, () => this.layout()));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.SCROLL, () => this.container.scrollTop = 0)); // Prevent container from scrolling (#55456)
            if (platform_1.isWeb) {
                this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.DROP, e => dom_1.EventHelper.stop(e, true))); // Prevent default navigation on drop
                this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.WHEEL, e => e.preventDefault(), { passive: false })); // Prevent the back/forward gestures in macOS
                this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.CONTEXT_MENU, e => dom_1.EventHelper.stop(e, true))); // Prevent native context menus in web
            }
            else {
                this._register((0, dom_1.addDisposableListener)(this.window.document.body, dom_1.EventType.DRAG_OVER, (e) => dom_1.EventHelper.stop(e))); // Prevent drag feedback on <body>
                this._register((0, dom_1.addDisposableListener)(this.window.document.body, dom_1.EventType.DROP, (e) => dom_1.EventHelper.stop(e))); // Prevent default navigation on drop
            }
        }
        handleBeforeUnload(e) {
            // Check for veto from a listening component
            let veto;
            this._onBeforeUnload.fire({
                veto(reason) {
                    if (reason) {
                        veto = reason;
                    }
                }
            });
            if (veto) {
                this.handleVetoBeforeClose(e, veto);
                return;
            }
            // Check for confirm before close setting
            const confirmBeforeCloseSetting = this.configurationService.getValue('window.confirmBeforeClose');
            const confirmBeforeClose = confirmBeforeCloseSetting === 'always' || (confirmBeforeCloseSetting === 'keyboardOnly' && dom_1.ModifierKeyEmitter.getInstance().isModifierPressed);
            if (confirmBeforeClose) {
                this.confirmBeforeClose(e);
            }
        }
        handleVetoBeforeClose(e, reason) {
            this.preventUnload(e);
        }
        preventUnload(e) {
            e.preventDefault();
            e.returnValue = (0, nls_1.localize)('lifecycleVeto', "Changes that you made may not be saved. Please check press 'Cancel' and try again.");
        }
        confirmBeforeClose(e) {
            this.preventUnload(e);
        }
        handleUnload() {
            // Event
            this._onUnload.fire();
        }
        layout() {
            // Split layout up into two events so that downstream components
            // have a chance to participate in the beginning or end of the
            // layout phase.
            // This helps to build the auxiliary window in another component
            // in the `onWillLayout` phase and then let other compoments
            // react when the overall layout has finished in `onDidLayout`.
            const dimension = (0, dom_1.getClientArea)(this.window.document.body, this.container);
            this._onWillLayout.fire(dimension);
            this._onDidLayout.fire(dimension);
        }
        createState() {
            return {
                bounds: {
                    x: this.window.screenX,
                    y: this.window.screenY,
                    width: this.window.outerWidth,
                    height: this.window.outerHeight
                },
                zoomLevel: (0, browser_1.getZoomLevel)(this.window)
            };
        }
        dispose() {
            if (this._store.isDisposed) {
                return;
            }
            this._onWillDispose.fire();
            super.dispose();
        }
    };
    exports.AuxiliaryWindow = AuxiliaryWindow;
    exports.AuxiliaryWindow = AuxiliaryWindow = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, host_1.IHostService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService)
    ], AuxiliaryWindow);
    let BrowserAuxiliaryWindowService = class BrowserAuxiliaryWindowService extends lifecycle_1.Disposable {
        static { BrowserAuxiliaryWindowService_1 = this; }
        static { this.DEFAULT_SIZE = { width: 800, height: 600 }; }
        static { this.WINDOW_IDS = (0, dom_1.getWindowId)(window_1.mainWindow) + 1; } // start from the main window ID + 1
        constructor(layoutService, dialogService, configurationService, telemetryService, hostService, environmentService) {
            super();
            this.layoutService = layoutService;
            this.dialogService = dialogService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.hostService = hostService;
            this.environmentService = environmentService;
            this._onDidOpenAuxiliaryWindow = this._register(new event_1.Emitter());
            this.onDidOpenAuxiliaryWindow = this._onDidOpenAuxiliaryWindow.event;
            this.windows = new Map();
        }
        async open(options) {
            (0, performance_1.mark)('code/auxiliaryWindow/willOpen');
            const targetWindow = await this.openWindow(options);
            if (!targetWindow) {
                throw new Error((0, nls_1.localize)('unableToOpenWindowError', "Unable to open a new window."));
            }
            // Add a `vscodeWindowId` property to identify auxiliary windows
            const resolvedWindowId = await this.resolveWindowId(targetWindow);
            (0, window_1.ensureCodeWindow)(targetWindow, resolvedWindowId);
            const containerDisposables = new lifecycle_1.DisposableStore();
            const { container, stylesLoaded } = this.createContainer(targetWindow, containerDisposables, options);
            const auxiliaryWindow = this.createAuxiliaryWindow(targetWindow, container, stylesLoaded);
            const registryDisposables = new lifecycle_1.DisposableStore();
            this.windows.set(targetWindow.vscodeWindowId, auxiliaryWindow);
            registryDisposables.add((0, lifecycle_1.toDisposable)(() => this.windows.delete(targetWindow.vscodeWindowId)));
            const eventDisposables = new lifecycle_1.DisposableStore();
            event_1.Event.once(auxiliaryWindow.onWillDispose)(() => {
                targetWindow.close();
                containerDisposables.dispose();
                registryDisposables.dispose();
                eventDisposables.dispose();
            });
            registryDisposables.add((0, dom_1.registerWindow)(targetWindow));
            this._onDidOpenAuxiliaryWindow.fire({ window: auxiliaryWindow, disposables: eventDisposables });
            (0, performance_1.mark)('code/auxiliaryWindow/didOpen');
            this.telemetryService.publicLog2('auxiliaryWindowOpen', { bounds: !!options?.bounds });
            return auxiliaryWindow;
        }
        createAuxiliaryWindow(targetWindow, container, stylesLoaded) {
            return new AuxiliaryWindow(targetWindow, container, stylesLoaded, this.configurationService, this.hostService, this.environmentService);
        }
        async openWindow(options) {
            const activeWindow = (0, dom_1.getActiveWindow)();
            const activeWindowBounds = {
                x: activeWindow.screenX,
                y: activeWindow.screenY,
                width: activeWindow.outerWidth,
                height: activeWindow.outerHeight
            };
            const width = Math.max(options?.bounds?.width ?? BrowserAuxiliaryWindowService_1.DEFAULT_SIZE.width, window_2.WindowMinimumSize.WIDTH);
            const height = Math.max(options?.bounds?.height ?? BrowserAuxiliaryWindowService_1.DEFAULT_SIZE.height, window_2.WindowMinimumSize.HEIGHT);
            let newWindowBounds = {
                x: options?.bounds?.x ?? Math.max(activeWindowBounds.x + activeWindowBounds.width / 2 - width / 2, 0),
                y: options?.bounds?.y ?? Math.max(activeWindowBounds.y + activeWindowBounds.height / 2 - height / 2, 0),
                width,
                height
            };
            if (!options?.bounds && newWindowBounds.x === activeWindowBounds.x && newWindowBounds.y === activeWindowBounds.y) {
                // Offset the new window a bit so that it does not overlap
                // with the active window, unless bounds are provided
                newWindowBounds = {
                    ...newWindowBounds,
                    x: newWindowBounds.x + 30,
                    y: newWindowBounds.y + 30
                };
            }
            const features = (0, arrays_1.coalesce)([
                'popup=yes',
                `left=${newWindowBounds.x}`,
                `top=${newWindowBounds.y}`,
                `width=${newWindowBounds.width}`,
                `height=${newWindowBounds.height}`,
                options?.mode === AuxiliaryWindowMode.Maximized ? 'window-maximized=yes' : undefined, // non-standard property
                options?.mode === AuxiliaryWindowMode.Fullscreen ? 'window-fullscreen=yes' : undefined // non-standard property
            ]);
            const auxiliaryWindow = window_1.mainWindow.open('about:blank', undefined, features.join(','));
            if (!auxiliaryWindow && platform_1.isWeb) {
                return (await this.dialogService.prompt({
                    type: severity_1.default.Warning,
                    message: (0, nls_1.localize)('unableToOpenWindow', "The browser interrupted the opening of a new window. Press 'Retry' to try again."),
                    detail: (0, nls_1.localize)('unableToOpenWindowDetail', "To avoid this problem in the future, please ensure to allow popups for this website."),
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'retry', comment: ['&& denotes a mnemonic'] }, "&&Retry"),
                            run: () => this.openWindow(options)
                        }
                    ],
                    cancelButton: true
                })).result;
            }
            return auxiliaryWindow?.window;
        }
        async resolveWindowId(auxiliaryWindow) {
            return BrowserAuxiliaryWindowService_1.WINDOW_IDS++;
        }
        createContainer(auxiliaryWindow, disposables, options) {
            auxiliaryWindow.document.createElement = function () {
                // Disallow `createElement` because it would create
                // HTML Elements in the "wrong" context and break
                // code that does "instanceof HTMLElement" etc.
                throw new Error('Not allowed to create elements in child window JavaScript context. Always use the main window so that "xyz instanceof HTMLElement" continues to work.');
            };
            this.applyMeta(auxiliaryWindow);
            const { stylesLoaded } = this.applyCSS(auxiliaryWindow, disposables);
            const container = this.applyHTML(auxiliaryWindow, disposables);
            return { stylesLoaded, container };
        }
        applyMeta(auxiliaryWindow) {
            for (const metaTag of ['meta[charset="utf-8"]', 'meta[http-equiv="Content-Security-Policy"]', 'meta[name="viewport"]', 'meta[name="theme-color"]']) {
                const metaElement = window_1.mainWindow.document.querySelector(metaTag);
                if (metaElement) {
                    const clonedMetaElement = (0, dom_1.createMetaElement)(auxiliaryWindow.document.head);
                    (0, dom_1.copyAttributes)(metaElement, clonedMetaElement);
                    if (metaTag === 'meta[http-equiv="Content-Security-Policy"]') {
                        const content = clonedMetaElement.getAttribute('content');
                        if (content) {
                            clonedMetaElement.setAttribute('content', content.replace(/(script-src[^\;]*)/, `script-src 'none'`));
                        }
                    }
                }
            }
            const originalIconLinkTag = window_1.mainWindow.document.querySelector('link[rel="icon"]');
            if (originalIconLinkTag) {
                const icon = (0, dom_1.createLinkElement)(auxiliaryWindow.document.head);
                (0, dom_1.copyAttributes)(originalIconLinkTag, icon);
            }
        }
        applyCSS(auxiliaryWindow, disposables) {
            (0, performance_1.mark)('code/auxiliaryWindow/willApplyCSS');
            const mapOriginalToClone = new Map();
            const stylesLoaded = new async_1.Barrier();
            stylesLoaded.wait().then(() => (0, performance_1.mark)('code/auxiliaryWindow/didLoadCSSStyles'));
            const pendingLinksDisposables = disposables.add(new lifecycle_1.DisposableStore());
            let pendingLinksToSettle = 0;
            function onLinkSettled() {
                if (--pendingLinksToSettle === 0) {
                    pendingLinksDisposables.dispose();
                    stylesLoaded.open();
                }
            }
            function cloneNode(originalNode) {
                if ((0, dom_1.isGlobalStylesheet)(originalNode)) {
                    return; // global stylesheets are handled by `cloneGlobalStylesheets` below
                }
                const clonedNode = auxiliaryWindow.document.head.appendChild(originalNode.cloneNode(true));
                if (originalNode.tagName.toLowerCase() === 'link') {
                    pendingLinksToSettle++;
                    pendingLinksDisposables.add((0, dom_1.addDisposableListener)(clonedNode, 'load', onLinkSettled));
                    pendingLinksDisposables.add((0, dom_1.addDisposableListener)(clonedNode, 'error', onLinkSettled));
                }
                mapOriginalToClone.set(originalNode, clonedNode);
            }
            // Clone all style elements and stylesheet links from the window to the child window
            // and keep track of <link> elements to settle to signal that styles have loaded
            // Increment pending links right from the beginning to ensure we only settle when
            // all style related nodes have been cloned.
            pendingLinksToSettle++;
            try {
                for (const originalNode of window_1.mainWindow.document.head.querySelectorAll('link[rel="stylesheet"], style')) {
                    cloneNode(originalNode);
                }
            }
            finally {
                onLinkSettled();
            }
            // Global stylesheets in <head> are cloned in a special way because the mutation
            // observer is not firing for changes done via `style.sheet` API. Only text changes
            // can be observed.
            disposables.add((0, dom_1.cloneGlobalStylesheets)(auxiliaryWindow));
            // Listen to new stylesheets as they are being added or removed in the main window
            // and apply to child window (including changes to existing stylesheets elements)
            disposables.add(dom_1.sharedMutationObserver.observe(window_1.mainWindow.document.head, disposables, { childList: true, subtree: true })(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type !== 'childList' || // only interested in added/removed nodes
                        mutation.target.nodeName.toLowerCase() === 'title' || // skip over title changes that happen frequently
                        mutation.target.nodeName.toLowerCase() === 'script' || // block <script> changes that are unsupported anyway
                        mutation.target.nodeName.toLowerCase() === 'meta' // do not observe <meta> elements for now
                    ) {
                        continue;
                    }
                    for (const node of mutation.addedNodes) {
                        // <style>/<link> element was added
                        if (node instanceof HTMLElement && (node.tagName.toLowerCase() === 'style' || node.tagName.toLowerCase() === 'link')) {
                            cloneNode(node);
                        }
                        // text-node was changed, try to apply to our clones
                        else if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
                            const clonedNode = mapOriginalToClone.get(node.parentNode);
                            if (clonedNode) {
                                clonedNode.textContent = node.textContent;
                            }
                        }
                    }
                    for (const node of mutation.removedNodes) {
                        const clonedNode = mapOriginalToClone.get(node);
                        if (clonedNode) {
                            clonedNode.parentNode?.removeChild(clonedNode);
                            mapOriginalToClone.delete(node);
                        }
                    }
                }
            }));
            (0, performance_1.mark)('code/auxiliaryWindow/didApplyCSS');
            return { stylesLoaded };
        }
        applyHTML(auxiliaryWindow, disposables) {
            (0, performance_1.mark)('code/auxiliaryWindow/willApplyHTML');
            // Create workbench container and apply classes
            const container = document.createElement('div');
            container.setAttribute('role', 'application');
            (0, dom_1.position)(container, 0, 0, 0, 0, 'relative');
            container.style.display = 'flex';
            container.style.height = '100%';
            container.style.flexDirection = 'column';
            auxiliaryWindow.document.body.append(container);
            // Track attributes
            disposables.add((0, dom_1.trackAttributes)(window_1.mainWindow.document.documentElement, auxiliaryWindow.document.documentElement));
            disposables.add((0, dom_1.trackAttributes)(window_1.mainWindow.document.body, auxiliaryWindow.document.body));
            disposables.add((0, dom_1.trackAttributes)(this.layoutService.mainContainer, container, ['class'])); // only class attribute
            (0, performance_1.mark)('code/auxiliaryWindow/didApplyHTML');
            return container;
        }
        getWindow(windowId) {
            return this.windows.get(windowId);
        }
    };
    exports.BrowserAuxiliaryWindowService = BrowserAuxiliaryWindowService;
    exports.BrowserAuxiliaryWindowService = BrowserAuxiliaryWindowService = BrowserAuxiliaryWindowService_1 = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, dialogs_1.IDialogService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, host_1.IHostService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService)
    ], BrowserAuxiliaryWindowService);
    (0, extensions_1.registerSingleton)(exports.IAuxiliaryWindowService, BrowserAuxiliaryWindowService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5V2luZG93U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9hdXhpbGlhcnlXaW5kb3cvYnJvd3Nlci9hdXhpbGlhcnlXaW5kb3dTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5Qm5GLFFBQUEsdUJBQXVCLEdBQUcsSUFBQSwrQkFBZSxFQUEwQix3QkFBd0IsQ0FBQyxDQUFDO0lBTzFHLElBQVksbUJBSVg7SUFKRCxXQUFZLG1CQUFtQjtRQUM5Qix1RUFBUyxDQUFBO1FBQ1QsaUVBQU0sQ0FBQTtRQUNOLHlFQUFVLENBQUE7SUFDWCxDQUFDLEVBSlcsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFJOUI7SUF5Q00sSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxtQkFBVTtRQW1COUMsWUFDVSxNQUFrQixFQUNsQixTQUFzQixFQUMvQixnQkFBeUIsRUFDRixvQkFBNEQsRUFDckUsV0FBeUIsRUFDVCxrQkFBZ0Q7WUFFOUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFQakQsV0FBTSxHQUFOLE1BQU0sQ0FBWTtZQUNsQixjQUFTLEdBQVQsU0FBUyxDQUFhO1lBRVMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQXJCbkUsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFhLENBQUMsQ0FBQztZQUNqRSxpQkFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBRWhDLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBYSxDQUFDLENBQUM7WUFDaEUsZ0JBQVcsR0FB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