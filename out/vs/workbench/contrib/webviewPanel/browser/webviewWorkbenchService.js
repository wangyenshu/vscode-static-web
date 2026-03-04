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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditor", "vs/workbench/contrib/webviewPanel/browser/webviewIconManager", "vs/workbench/services/editor/common/editorService", "./webviewEditorInput"], function (require, exports, async_1, cancellation_1, decorators_1, errors_1, event_1, iterator_1, lifecycle_1, contextkey_1, editor_1, instantiation_1, diffEditorInput_1, webview_1, webviewEditor_1, webviewIconManager_1, editorService_1, webviewEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewEditorService = exports.LazilyResolvedWebviewEditorInput = exports.IWebviewWorkbenchService = void 0;
    exports.IWebviewWorkbenchService = (0, instantiation_1.createDecorator)('webviewEditorService');
    function canRevive(reviver, webview) {
        return reviver.canResolve(webview);
    }
    let LazilyResolvedWebviewEditorInput = class LazilyResolvedWebviewEditorInput extends webviewEditorInput_1.WebviewInput {
        constructor(init, webview, _webviewWorkbenchService) {
            super(init, webview, _webviewWorkbenchService.iconManager);
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this._resolved = false;
        }
        dispose() {
            super.dispose();
            this._resolvePromise?.cancel();
            this._resolvePromise = undefined;
        }
        async resolve() {
            if (!this._resolved) {
                this._resolved = true;
                this._resolvePromise = (0, async_1.createCancelablePromise)(token => this._webviewWorkbenchService.resolveWebview(this, token));
                try {
                    await this._resolvePromise;
                }
                catch (e) {
                    if (!(0, errors_1.isCancellationError)(e)) {
                        throw e;
                    }
                }
            }
            return super.resolve();
        }
        transfer(other) {
            if (!super.transfer(other)) {
                return;
            }
            other._resolved = this._resolved;
            return other;
        }
    };
    exports.LazilyResolvedWebviewEditorInput = LazilyResolvedWebviewEditorInput;
    __decorate([
        decorators_1.memoize
    ], LazilyResolvedWebviewEditorInput.prototype, "resolve", null);
    exports.LazilyResolvedWebviewEditorInput = LazilyResolvedWebviewEditorInput = __decorate([
        __param(2, exports.IWebviewWorkbenchService)
    ], LazilyResolvedWebviewEditorInput);
    class RevivalPool {
        constructor() {
            this._awaitingRevival = [];
        }
        enqueueForRestoration(input, token) {
            const promise = new async_1.DeferredPromise();
            const remove = () => {
                const index = this._awaitingRevival.findIndex(entry => input === entry.input);
                if (index >= 0) {
                    this._awaitingRevival.splice(index, 1);
                }
            };
            const disposable = (0, lifecycle_1.combinedDisposable)(input.webview.onDidDispose(remove), token.onCancellationRequested(() => {
                remove();
                promise.cancel();
            }));
            this._awaitingRevival.push({ input, promise, disposable });
            return promise.p;
        }
        reviveFor(reviver, token) {
            const toRevive = this._awaitingRevival.filter(({ input }) => canRevive(reviver, input));
            this._awaitingRevival = this._awaitingRevival.filter(({ input }) => !canRevive(reviver, input));
            for (const { input, promise: resolve, disposable } of toRevive) {
                reviver.resolveWebview(input, token).then(x => resolve.complete(x), err => resolve.error(err)).finally(() => {
                    disposable.dispose();
                });
            }
        }
    }
    let WebviewEditorService = class WebviewEditorService extends lifecycle_1.Disposable {
        constructor(contextKeyService, _editorService, _instantiationService, _webviewService) {
            super();
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._webviewService = _webviewService;
            this._revivers = new Set();
            this._revivalPool = new RevivalPool();
            this._onDidChangeActiveWebviewEditor = this._register(new event_1.Emitter());
            this.onDidChangeActiveWebviewEditor = this._onDidChangeActiveWebviewEditor.event;
            this._activeWebviewPanelIdContext = webviewEditor_1.CONTEXT_ACTIVE_WEBVIEW_PANEL_ID.bindTo(contextKeyService);
            this._iconManager = this._register(this._instantiationService.createInstance(webviewIconManager_1.WebviewIconManager));
            this._register(_editorService.onDidActiveEditorChange(() => {
                this.updateActiveWebview();
            }));
            // The user may have switched focus between two sides of a diff editor
            this._register(_webviewService.onDidChangeActiveWebview(() => {
                this.updateActiveWebview();
            }));
            this.updateActiveWebview();
        }
        get iconManager() {
            return this._iconManager;
        }
        updateActiveWebview() {
            const activeInput = this._editorService.activeEditor;
            let newActiveWebview;
            if (activeInput instanceof webviewEditorInput_1.WebviewInput) {
                newActiveWebview = activeInput;
            }
            else if (activeInput instanceof diffEditorInput_1.DiffEditorInput) {
                if (activeInput.primary instanceof webviewEditorInput_1.WebviewInput && activeInput.primary.webview === this._webviewService.activeWebview) {
                    newActiveWebview = activeInput.primary;
                }
                else if (activeInput.secondary instanceof webviewEditorInput_1.WebviewInput && activeInput.secondary.webview === this._webviewService.activeWebview) {
                    newActiveWebview = activeInput.secondary;
                }
            }
            if (newActiveWebview) {
                this._activeWebviewPanelIdContext.set(newActiveWebview.webview.providedViewType ?? '');
            }
            else {
                this._activeWebviewPanelIdContext.reset();
            }
            if (newActiveWebview !== this._activeWebview) {
                this._activeWebview = newActiveWebview;
                this._onDidChangeActiveWebviewEditor.fire(newActiveWebview);
            }
        }
        openWebview(webviewInitInfo, viewType, title, showOptions) {
            const webview = this._webviewService.createWebviewOverlay(webviewInitInfo);
            const webviewInput = this._instantiationService.createInstance(webviewEditorInput_1.WebviewInput, { viewType, name: title, providedId: webviewInitInfo.providedViewType }, webview, this.iconManager);
            this._editorService.openEditor(webviewInput, {
                pinned: true,
                preserveFocus: showOptions.preserveFocus,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: showOptions.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
            }, showOptions.group);
            return webviewInput;
        }
        revealWebview(webview, group, preserveFocus) {
            const topLevelEditor = this.findTopLevelEditorForWebview(webview);
            this._editorService.openEditor(topLevelEditor, {
                preserveFocus,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
            }, group);
        }
        findTopLevelEditorForWebview(webview) {
            for (const editor of this._editorService.editors) {
                if (editor === webview) {
                    return editor;
                }
                if (editor instanceof diffEditorInput_1.DiffEditorInput) {
                    if (webview === editor.primary || webview === editor.secondary) {
                        return editor;
                    }
                }
            }
            return webview;
        }
        openRevivedWebview(options) {
            const webview = this._webviewService.createWebviewOverlay(options.webviewInitInfo);
            webview.state = options.state;
            const webviewInput = this._instantiationService.createInstance(LazilyResolvedWebviewEditorInput, { viewType: options.viewType, providedId: options.webviewInitInfo.providedViewType, name: options.title }, webview);
            webviewInput.iconPath = options.iconPath;
            if (typeof options.group === 'number') {
                webviewInput.updateGroup(options.group);
            }
            return webviewInput;
        }
        registerResolver(reviver) {
            this._revivers.add(reviver);
            const cts = new cancellation_1.CancellationTokenSource();
            this._revivalPool.reviveFor(reviver, cts.token);
            return (0, lifecycle_1.toDisposable)(() => {
                this._revivers.delete(reviver);
                cts.dispose(true);
            });
        }
        shouldPersist(webview) {
            // Revived webviews may not have an actively registered reviver but we still want to persist them
            // since a reviver should exist when it is actually needed.
            if (webview instanceof LazilyResolvedWebviewEditorInput) {
                return true;
            }
            return iterator_1.Iterable.some(this._revivers.values(), reviver => canRevive(reviver, webview));
        }
        async tryRevive(webview, token) {
            for (const reviver of this._revivers.values()) {
                if (canRevive(reviver, webview)) {
                    await reviver.resolveWebview(webview, token);
                    return true;
                }
            }
            return false;
        }
        async resolveWebview(webview, token) {
            const didRevive = await this.tryRevive(webview, token);
            if (!didRevive && !token.isCancellationRequested) {
                // A reviver may not be registered yet. Put into pool and resolve promise when we can revive
                return this._revivalPool.enqueueForRestoration(webview, token);
            }
        }
        setIcons(id, iconPath) {
            this._iconManager.setIcons(id, iconPath);
        }
    };
    exports.WebviewEditorService = WebviewEditorService;
    exports.WebviewEditorService = WebviewEditorService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, editorService_1.IEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, webview_1.IWebviewService)
    ], WebviewEditorService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1dvcmtiZW5jaFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3UGFuZWwvYnJvd3Nlci93ZWJ2aWV3V29ya2JlbmNoU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQm5GLFFBQUEsd0JBQXdCLEdBQUcsSUFBQSwrQkFBZSxFQUEyQixzQkFBc0IsQ0FBQyxDQUFDO0lBb0YxRyxTQUFTLFNBQVMsQ0FBQyxPQUF3QixFQUFFLE9BQXFCO1FBQ2pFLE9BQU8sT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRU0sSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxpQ0FBWTtRQUtqRSxZQUNDLElBQTBCLEVBQzFCLE9BQXdCLEVBQ0Usd0JBQW1FO1lBRTdGLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRmhCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFOdEYsY0FBUyxHQUFHLEtBQUssQ0FBQztRQVMxQixDQUFDO1FBRVEsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBQy9CLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO1FBQ2xDLENBQUM7UUFHcUIsQUFBTixLQUFLLENBQUMsT0FBTztZQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFBLCtCQUF1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