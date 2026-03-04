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
define(["require", "exports", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/log/common/log", "vs/workbench/services/lifecycle/common/lifecycleService", "vs/platform/instantiation/common/extensions", "vs/platform/native/common/native", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/cancellation"], function (require, exports, lifecycle_1, lifecycle_2, storage_1, globals_1, log_1, lifecycleService_1, extensions_1, native_1, async_1, errorMessage_1, cancellation_1) {
    "use strict";
    var NativeLifecycleService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLifecycleService = void 0;
    let NativeLifecycleService = class NativeLifecycleService extends lifecycleService_1.AbstractLifecycleService {
        static { NativeLifecycleService_1 = this; }
        static { this.BEFORE_SHUTDOWN_WARNING_DELAY = 5000; }
        static { this.WILL_SHUTDOWN_WARNING_DELAY = 800; }
        constructor(nativeHostService, storageService, logService) {
            super(logService, storageService);
            this.nativeHostService = nativeHostService;
            this.registerListeners();
        }
        registerListeners() {
            const windowId = this.nativeHostService.windowId;
            // Main side indicates that window is about to unload, check for vetos
            globals_1.ipcRenderer.on('vscode:onBeforeUnload', async (event, reply) => {
                this.logService.trace(`[lifecycle] onBeforeUnload (reason: ${reply.reason})`);
                // trigger onBeforeShutdown events and veto collecting
                const veto = await this.handleBeforeShutdown(reply.reason);
                // veto: cancel unload
                if (veto) {
                    this.logService.trace('[lifecycle] onBeforeUnload prevented via veto');
                    // Indicate as event
                    this._onShutdownVeto.fire();
                    globals_1.ipcRenderer.send(reply.cancelChannel, windowId);
                }
                // no veto: allow unload
                else {
                    this.logService.trace('[lifecycle] onBeforeUnload continues without veto');
                    this.shutdownReason = reply.reason;
                    globals_1.ipcRenderer.send(reply.okChannel, windowId);
                }
            });
            // Main side indicates that we will indeed shutdown
            globals_1.ipcRenderer.on('vscode:onWillUnload', async (event, reply) => {
                this.logService.trace(`[lifecycle] onWillUnload (reason: ${reply.reason})`);
                // trigger onWillShutdown events and joining
                await this.handleWillShutdown(reply.reason);
                // trigger onDidShutdown event now that we know we will quit
                this._onDidShutdown.fire();
                // acknowledge to main side
                globals_1.ipcRenderer.send(reply.replyChannel, windowId);
            });
        }
        async handleBeforeShutdown(reason) {
            const logService = this.logService;
            const vetos = [];
            const pendingVetos = new Set();
            let finalVeto = undefined;
            let finalVetoId = undefined;
            // before-shutdown event with veto support
            this._onBeforeShutdown.fire({
                reason,
                veto(value, id) {
                    vetos.push(value);
                    // Log any veto instantly
                    if (value === true) {
                        logService.info(`[lifecycle]: Shutdown was prevented (id: ${id})`);
                    }
                    // Track promise completion
                    else if (value instanceof Promise) {
                        pendingVetos.add(id);
                        value.then(veto => {
                            if (veto === true) {
                                logService.info(`[lifecycle]: Shutdown was prevented (id: ${id})`);
                            }
                        }).finally(() => pendingVetos.delete(id));
                    }
                },
                finalVeto(value, id) {
                    if (!finalVeto) {
                        finalVeto = value;
                        finalVetoId = id;
                    }
                    else {
                        throw new Error(`[lifecycle]: Final veto is already defined (id: ${id})`);
                    }
                }
            });
            const longRunningBeforeShutdownWarning = (0, async_1.disposableTimeout)(() => {
                logService.warn(`[lifecycle] onBeforeShutdown is taking a long time, pending operations: ${Array.from(pendingVetos).join(', ')}`);
            }, NativeLifecycleService_1.BEFORE_SHUTDOWN_WARNING_DELAY);
            try {
                // First: run list of vetos in parallel
                let veto = await (0, lifecycle_1.handleVetos)(vetos, error => this.handleBeforeShutdownError(error, reason));
                if (veto) {
                    return veto;
                }
                // Second: run the final veto if defined
                if (finalVeto) {
                    try {
                        pendingVetos.add(finalVetoId);
                        veto = await finalVeto();
                        if (veto) {
                            logService.info(`[lifecycle]: Shutdown was prevented by final veto (id: ${finalVetoId})`);
                        }
                    }
                    catch (error) {
                        veto = true; // treat error as veto
                        this.handleBeforeShutdownError(error, reason);
                    }
                }
                return veto;
            }
            finally {
                longRunningBeforeShutdownWarning.dispose();
            }
        }
        handleBeforeShutdownError(error, reason) {
            this.logService.error(`[lifecycle]: Error during before-shutdown phase (error: ${(0, errorMessage_1.toErrorMessage)(error)})`);
            this._onBeforeShutdownError.fire({ reason, error });
        }
        async handleWillShutdown(reason) {
            const joiners = [];
            const pendingJoiners = new Set();
            const cts = new cancellation_1.CancellationTokenSource();
            this._onWillShutdown.fire({
                reason,
                token: cts.token,
                joiners: () => Array.from(pendingJoiners.values()),
                join(promise, joiner) {
                    joiners.push(promise);
                    // Track promise completion
                    pendingJoiners.add(joiner);
                    promise.finally(() => pendingJoiners.delete(joiner));
                },
                force: () => {
                    cts.dispose(true);
                }
            });
            const longRunningWillShutdownWarning = (0, async_1.disposableTimeout)(() => {
                this.logService.warn(`[lifecycle] onWillShutdown is taking a long time, pending operations: ${Array.from(pendingJoiners).map(joiner => joiner.id).join(', ')}`);
            }, NativeLifecycleService_1.WILL_SHUTDOWN_WARNING_DELAY);
            try {
                await (0, async_1.raceCancellation)(async_1.Promises.settled(joiners), cts.token);
            }
            catch (error) {
                this.logService.error(`[lifecycle]: Error during will-shutdown phase (error: ${(0, errorMessage_1.toErrorMessage)(error)})`); // this error will not prevent the shutdown
            }
            finally {
                longRunningWillShutdownWarning.dispose();
            }
        }
        shutdown() {
            return this.nativeHostService.closeWindow();
        }
    };
    exports.NativeLifecycleService = NativeLifecycleService;
    exports.NativeLifecycleService = NativeLifecycleService = NativeLifecycleService_1 = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, storage_1.IStorageService),
        __param(2, log_1.ILogService)
    ], NativeLifecycleService);
    (0, extensions_1.registerSingleton)(lifecycle_2.ILifecycleService, NativeLifecycleService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9saWZlY3ljbGUvZWxlY3Ryb24tc2FuZGJveC9saWZlY3ljbGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSwyQ0FBd0I7O2lCQUUzQyxrQ0FBNkIsR0FBRyxJQUFJLEFBQVAsQ0FBUTtpQkFDckMsZ0NBQTJCLEdBQUcsR0FBRyxBQUFOLENBQU87UUFFMUQsWUFDc0MsaUJBQXFDLEVBQ3pELGNBQStCLEVBQ25DLFVBQXVCO1lBRXBDLEtBQUssQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFKRyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBTTFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztZQUVqRCxzRUFBc0U7WUFDdEUscUJBQVcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLEtBQWMsRUFBRSxLQUEyRSxFQUFFLEVBQUU7Z0JBQzdJLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFFOUUsc0RBQXNEO2dCQUN0RCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTNELHNCQUFzQjtnQkFDdEIsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDVixJQUFJLENBQUMs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