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
define(["require", "exports", "electron", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/state/node/state", "vs/platform/environment/electron-main/environmentMainService"], function (require, exports, electron_1, ipcMain_1, async_1, event_1, lifecycle_1, platform_1, process_1, types_1, instantiation_1, log_1, state_1, environmentMainService_1) {
    "use strict";
    var LifecycleMainService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LifecycleMainService = exports.LifecycleMainPhase = exports.ShutdownReason = exports.ILifecycleMainService = void 0;
    exports.ILifecycleMainService = (0, instantiation_1.createDecorator)('lifecycleMainService');
    var ShutdownReason;
    (function (ShutdownReason) {
        /**
         * The application exits normally.
         */
        ShutdownReason[ShutdownReason["QUIT"] = 1] = "QUIT";
        /**
         * The application exits abnormally and is being
         * killed with an exit code (e.g. from integration
         * test run)
         */
        ShutdownReason[ShutdownReason["KILL"] = 2] = "KILL";
    })(ShutdownReason || (exports.ShutdownReason = ShutdownReason = {}));
    var LifecycleMainPhase;
    (function (LifecycleMainPhase) {
        /**
         * The first phase signals that we are about to startup.
         */
        LifecycleMainPhase[LifecycleMainPhase["Starting"] = 1] = "Starting";
        /**
         * Services are ready and first window is about to open.
         */
        LifecycleMainPhase[LifecycleMainPhase["Ready"] = 2] = "Ready";
        /**
         * This phase signals a point in time after the window has opened
         * and is typically the best place to do work that is not required
         * for the window to open.
         */
        LifecycleMainPhase[LifecycleMainPhase["AfterWindowOpen"] = 3] = "AfterWindowOpen";
        /**
         * The last phase after a window has opened and some time has passed
         * (2-5 seconds).
         */
        LifecycleMainPhase[LifecycleMainPhase["Eventually"] = 4] = "Eventually";
    })(LifecycleMainPhase || (exports.LifecycleMainPhase = LifecycleMainPhase = {}));
    let LifecycleMainService = class LifecycleMainService extends lifecycle_1.Disposable {
        static { LifecycleMainService_1 = this; }
        static { this.QUIT_AND_RESTART_KEY = 'lifecycle.quitAndRestart'; }
        get quitRequested() { return this._quitRequested; }
        get wasRestarted() { return this._wasRestarted; }
        get phase() { return this._phase; }
        constructor(logService, stateService, environmentMainService) {
            super();
            this.logService = logService;
            this.stateService = stateService;
            this.environmentMainService = environmentMainService;
            this._onBeforeShutdown = this._register(new event_1.Emitter());
            this.onBeforeShutdown = this._onBeforeShutdown.event;
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.onWillShutdown = this._onWillShutdown.event;
            this._onWillLoadWindow = this._register(new event_1.Emitter());
            this.onWillLoadWindow = this._onWillLoadWindow.event;
            this._onBeforeCloseWindow = this._register(new event_1.Emitter());
            this.onBeforeCloseWindow = this._onBeforeCloseWindow.event;
            this._quitRequested = false;
            this._wasRestarted = false;
            this._phase = 1 /* LifecycleMainPhase.Starting */;
            this.windowToCloseRequest = new Set();
            this.oneTimeListenerTokenGenerator = 0;
            this.windowCounter = 0;
            this.pendingQuitPromise = undefined;
            this.pendingQuitPromiseResolve = undefined;
            this.pendingWillShutdownPromise = undefined;
            this.mapWindowIdToPendingUnload = new Map();
            this.phaseWhen = new Map();
            this.relaunchHandler = undefined;
            this.resolveRestarted();
            this.when(2 /* LifecycleMainPhase.Ready */).then(() => this.registerListeners());
        }
        resolveRestarted() {
            this._wasRestarted = !!this.stateService.getItem(LifecycleMainService_1.QUIT_AND_RESTART_KEY);
            if (this._wasRestarted) {
                // remove the marker right after if found
                this.stateService.removeItem(LifecycleMainService_1.QUIT_AND_RESTART_KEY);
            }
        }
        registerListeners() {
            // before-quit: an event that is fired if application quit was
            // requested but before any window was closed.
            const beforeQuitListener = () => {
                if (this._quitRequested) {
                    return;
                }
                this.trace('Lifecycle#app.on(before-quit)');
                this._quitRequested = true;
                // Emit event to indicate that we are about to shutdown
                this.trace('Lifecycle#onBeforeShutdown.fire()');
                this._onBeforeShutdown.fire();
                // macOS: can run without any window open. in that case we fire
                // the onWillShutdown() event directly because there is no veto
                // to be expected.
                if (platform_1.isMacintosh && this.windowCounter === 0) {
                    this.fireOnWillShutdown(1 /* ShutdownReason.QUIT */);
                }
            };
            electron_1.app.addListener('before-quit', beforeQuitListener);
            // window-all-closed: an event that only fires when the last window
            // was closed. We override this event to be in charge if app.quit()
            // should be called or not.
            const windowAllClosedListener = () => {
                this.trace('Lifecycle#app.on(window-all-closed)');
                // Windows/Linux: we quit when all windows have closed
                // Mac: we only quit when quit was requested
                if (this._quitRequested || !platform_1.isMacintosh) {
                    electron_1.app.quit();
                }
            };
            electron_1.app.addListener('window-all-closed', windowAllClosedListener);
            // will-quit: an event that is fired after all windows have been
            // closed, but before actually quitting.
            electron_1.app.once('will-quit', e => {
                this.trace('Lifecycle#app.on(will-quit) - begin');
                // Prevent the quit until the shutdown promise was resolved
                e.preventDefault();
                // Start shutdown sequence
                const shutdownPromise = this.fireOnWillShutdown(1 /* ShutdownReason.QUIT */);
                // Wait until shutdown is signaled to be complete
                shutdownPromise.finally(() => {
                    this.trace('Lifecycle#app.on(will-quit) - after fireOnWillShutdown');
                    // Resolve pending quit promise now without veto
                    this.resolvePendingQuitPromise(false /* no veto */);
                    // Quit again, this time do not prevent this, since our
                    // will-quit listener is only installed "once". Also
                    // remove any listener we have that is no longer needed
                    electron_1.app.removeListener('before-quit', beforeQuitListener);
                    electron_1.app.removeListener('window-all-closed', windowAllClosedListener);
                    this.trace('Lifecycle#app.on(will-quit) - calling app.quit()');
                    electron_1.app.quit();
                });
            });
        }
        fireOnWillShutdown(reason) {
            if (this.pendingWillShutdownPromise) {
                return this.pendingWillShutdownPromise; // shutdown is already running
            }
            const logService = this.logService;
            this.trace('Lifecycle#onWillShutdown.fire()');
            const joiners = [];
            this._onWillShutdown.fire({
                reason,
                join(id, promise) {
                    logService.trace(`Lifecycle#onWillShutdown - begin '${id}'`);
                    joiners.push(promise.finally(() => {
                        logService.trace(`Lifecycle#onWillShutdown - end '${id}'`);
                    }));
                }
            });
            this.pendingWillShutdownPromise = (async () => {
                // Settle all shutdown event joiners
                try {
                    await async_1.Promises.settled(joiners);
                }
                catch (error) {
                    this.logService.error(error);
                }
                // Then, always make sure at the end
                // the state service is flushed.
                try {
                    await this.stateService.close();
                }
                catch (error) {
                    this.logService.error(error);
                }
            })();
            return this.pendingWillShutdownPromise;
        }
        set phase(value) {
            if (value < this.phase) {
                throw new Error('Lifecycle cannot go backwards');
            }
            if (this._phase === value) {
                return;
            }
            this.trace(`lifecycle (main): phase changed (value: ${value})`);
            this._phase = value;
            const barrier = this.phaseWhen.get(this._phase);
            if (barrier) {
                barrier.open();
                this.phaseWhen.delete(this._phase);
            }
        }
        async when(phase) {
            if (phase <= this._phase) {
                return;
            }
            let barrier = this.phaseWhen.get(phase);
            if (!barrier) {
                barrier = new async_1.Barrier();
                this.phaseWhen.set(phase, barrier);
            }
            await barrier.wait();
        }
        registerWindow(window) {
            const windowListeners = new lifecycle_1.DisposableStore();
            // track window count
            this.windowCounter++;
            // Window Will Load
            windowListeners.add(window.onWillLoad(e => this._onWillLoadWindow.fire({ window, workspace: e.workspace, reason: e.reason })));
            // Window Before Closing: Main -> Renderer
            const win = (0, types_1.assertIsDefined)(window.win);
            windowListeners.add(event_1.Event.fromNodeEventEmitter(win, 'close')(e => {
                // The window already acknowledged to be closed
                const windowId = window.id;
                if (this.windowToCloseRequest.has(windowId)) {
                    this.windowToCloseRequest.delete(windowId);
                    return;
                }
                this.trace(`Lifecycle#window.on('close') - window ID ${window.id}`);
                // Otherwise prevent unload and handle it from window
                e.preventDefault();
                this.unload(window, 1 /* UnloadReason.CLOSE */).then(veto => {
                    if (veto) {
                        this.windowToCloseRequest.delete(windowId);
                        return;
                    }
                    this.windowToCloseRequest.add(windowId);
                    // Fire onBeforeCloseWindow before actually closing
                    this.trace(`Lifecycle#onBeforeCloseWindow.fire() - window ID ${windowId}`);
                    this._onBeforeCloseWindow.fire(window);
                    // No veto, close window now
                    window.close();
                });
            }));
            windowListeners.add(event_1.Event.fromNodeEventEmitter(win, 'closed')(() => {
                this.trace(`Lifecycle#window.on('closed') - window ID ${window.id}`);
                // update window count
                this.windowCounter--;
                // clear window listeners
                windowListeners.dispose();
                // if there are no more code windows opened, fire the onWillShutdown event, unless
                // we are on macOS where it is perfectly fine to close the last window and
                // the application continues running (unless quit was actually requested)
                if (this.windowCounter === 0 && (!platform_1.isMacintosh || this._quitRequested)) {
                    this.fireOnWillShutdown(1 /* ShutdownReason.QUIT */);
                }
            }));
        }
        registerAuxWindow(auxWindow) {
            const win = (0, types_1.assertIsDefined)(auxWindow.win);
            const windowListeners = new lifecycle_1.DisposableStore();
            windowListeners.add(event_1.Event.fromNodeEventEmitter(win, 'close')(e => {
                this.trace(`Lifecycle#auxWindow.on('close') - window ID ${auxWindow.id}`);
                if (this._quitRequested) {
                    this.trace(`Lifecycle#auxWindow.on('close') - preventDefault() because quit requested`);
                    // When quit is requested, Electron will close all
                    // auxiliary windows before closing the main windows.
                    // This prevents us from storing the auxiliary window
                    // state on shutdown and thus we prevent closing if
                    // quit is requested.
                    //
                    // Interestingly, this will not prevent the application
                    // from quitting because the auxiliary windows will still
                    // close once the owning window closes.
                    e.preventDefault();
                }
            }));
            windowListeners.add(event_1.Event.fromNodeEventEmitter(win, 'closed')(() => {
                this.trace(`Lifecycle#auxWindow.on('closed') - window ID ${auxWindow.id}`);
                windowListeners.dispose();
            }));
        }
        async reload(window, cli) {
            // Only reload when the window has not vetoed this
            const veto = await this.unload(window, 3 /* UnloadReason.RELOAD */);
            if (!veto) {
                window.reload(cli);
            }
        }
        unload(window, reason) {
            // Ensure there is only 1 unload running at the same time
            const pendingUnloadPromise = this.mapWindowIdToPendingUnload.get(window.id);
            if (pendingUnloadPromise) {
                return pendingUnloadPromise;
            }
            // Start unload and remember in map until finished
            const unloadPromise = this.doUnload(window, reason).finally(() => {
                this.mapWindowIdToPendingUnload.delete(window.id);
            });
            this.mapWindowIdToPendingUnload.set(window.id, unloadPromise);
            return unloadPromise;
        }
        async doUnload(window, reason) {
            // Always allow to unload a window that is not yet ready
            if (!window.isReady) {
                return false;
            }
            this.trace(`Lifecycle#unload() - window ID ${window.id}`);
            // first ask the window itself if it vetos the unload
            const windowUnloadReason = this._quitRequested ? 2 /* UnloadReason.QUIT */ : reason;
            const veto = await this.onBeforeUnloadWindowInRenderer(window, windowUnloadReason);
            if (veto) {
                this.trace(`Lifecycle#unload() - veto in renderer (window ID ${window.id})`);
                return this.handleWindowUnloadVeto(veto);
            }
            // finally if there are no vetos, unload the renderer
            await this.onWillUnloadWindowInRenderer(window, windowUnloadReason);
            return false;
        }
        handleWindowUnloadVeto(veto) {
            if (!veto) {
                return false; // no veto
            }
            // a veto resolves any pending quit with veto
            this.resolvePendingQuitPromise(true /* veto */);
            // a veto resets the pending quit request flag
            this._quitRequested = false;
            return true; // veto
        }
        resolvePendingQuitPromise(veto) {
            if (this.pendingQuitPromiseResolve) {
                this.pendingQuitPromiseResolve(veto);
                this.pendingQuitPromiseResolve = undefined;
                this.pendingQuitPromise = undefined;
            }
        }
        onBeforeUnloadWindowInRenderer(window, reason) {
            return new Promise(resolve => {
                const oneTimeEventToken = this.oneTimeListenerTokenGenerator++;
                const okChannel = `vscode:ok${oneTimeEventToken}`;
                const cancelChannel = `vscode:cancel${oneTimeEventToken}`;
                ipcMain_1.validatedIpcMain.once(okChannel, () => {
                    resolve(false); // no veto
                });
                ipcMain_1.validatedIpcMain.once(cancelChannel, () => {
                    resolve(true); // veto
                });
                window.send('vscode:onBeforeUnload', { okChannel, cancelChannel, reason });
            });
        }
        onWillUnloadWindowInRenderer(window, reason) {
            return new Promise(resolve => {
                const oneTimeEventToken = this.oneTimeListenerTokenGenerator++;
                const replyChannel = `vscode:reply${oneTimeEventToken}`;
                ipcMain_1.validatedIpcMain.once(replyChannel, () => resolve());
                window.send('vscode:onWillUnload', { replyChannel, reason });
            });
        }
        quit(willRestart) {
            return this.doQuit(willRestart).then(veto => {
                if (!veto && willRestart) {
                    // Windows: we are about to restart and as such we need to restore the original
                    // current working directory we had on startup to get the exact same startup
                    // behaviour. As such, we briefly change back to that directory and then when
                    // Code starts it will set it back to the installation directory again.
                    try {
                        if (platform_1.isWindows) {
                            const currentWorkingDir = (0, process_1.cwd)();
                            if (currentWorkingDir !== process.cwd()) {
                                process.chdir(currentWorkingDir);
                            }
                        }
                    }
                    catch (err) {
                        this.logService.error(err);
                    }
                }
                return veto;
            });
        }
        doQuit(willRestart) {
            this.trace(`Lifecycle#quit() - begin (willRestart: ${willRestart})`);
            if (this.pendingQuitPromise) {
                this.trace('Lifecycle#quit() - returning pending quit promise');
                return this.pendingQuitPromise;
            }
            // Remember if we are about to restart
            if (willRestart) {
                this.stateService.setItem(LifecycleMainService_1.QUIT_AND_RESTART_KEY, true);
            }
            this.pendingQuitPromise = new Promise(resolve => {
                // Store as field to access it from a window cancellation
                this.pendingQuitPromiseResolve = resolve;
                // Calling app.quit() will trigger the close handlers of each opened window
                // and only if no window vetoed the shutdown, we will get the will-quit event
                this.trace('Lifecycle#quit() - calling app.quit()');
                electron_1.app.quit();
            });
            return this.pendingQuitPromise;
        }
        trace(msg) {
            if (this.environmentMainService.args['enable-smoke-test-driver']) {
                this.logService.info(msg); // helps diagnose issues with exiting from smoke tests
            }
            else {
                this.logService.trace(msg);
            }
        }
        setRelaunchHandler(handler) {
            this.relaunchHandler = handler;
        }
        async relaunch(options) {
            this.trace('Lifecycle#relaunch()');
            const args = process.argv.slice(1);
            if (options?.addArgs) {
                args.push(...options.addArgs);
            }
            if (options?.removeArgs) {
                for (const a of options.removeArgs) {
                    const idx = args.indexOf(a);
                    if (idx >= 0) {
                        args.splice(idx, 1);
                    }
                }
            }
            const quitListener = () => {
                if (!this.relaunchHandler?.handleRelaunch(options)) {
                    this.trace('Lifecycle#relaunch() - calling app.relaunch()');
                    electron_1.app.relaunch({ args });
                }
            };
            electron_1.app.once('quit', quitListener);
            // `app.relaunch()` does not quit automatically, so we quit first,
            // check for vetoes and then relaunch from the `app.on('quit')` event
            const veto = await this.quit(true /* will restart */);
            if (veto) {
                electron_1.app.removeListener('quit', quitListener);
            }
        }
        async kill(code) {
            this.trace('Lifecycle#kill()');
            // Give main process participants a chance to orderly shutdown
            await this.fireOnWillShutdown(2 /* ShutdownReason.KILL */);
            // From extension tests we have seen issues where calling app.exit()
            // with an opened window can lead to native crashes (Linux). As such,
            // we should make sure to destroy any opened window before calling
            // `app.exit()`.
            //
            // Note: Electron implements a similar logic here:
            // https://github.com/electron/electron/blob/fe5318d753637c3903e23fc1ed1b263025887b6a/spec-main/window-helpers.ts#L5
            await Promise.race([
                // Still do not block more than 1s
                (0, async_1.timeout)(1000),
                // Destroy any opened window: we do not unload windows here because
                // there is a chance that the unload is veto'd or long running due
                // to a participant within the window. this is not wanted when we
                // are asked to kill the application.
                (async () => {
                    for (const window of electron_1.BrowserWindow.getAllWindows()) {
                        if (window && !window.isDestroyed()) {
                            let whenWindowClosed;
                            if (window.webContents && !window.webContents.isDestroyed()) {
                                whenWindowClosed = new Promise(resolve => window.once('closed', resolve));
                            }
                            else {
                                whenWindowClosed = Promise.resolve();
                            }
                            window.destroy();
                            await whenWindowClosed;
                        }
                    }
                })()
            ]);
            // Now exit either after 1s or all windows destroyed
            electron_1.app.exit(code);
        }
    };
    exports.LifecycleMainService = LifecycleMainService;
    exports.LifecycleMainService = LifecycleMainService = LifecycleMainService_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, state_1.IStateService),
        __param(2, environmentMainService_1.IEnvironmentMainService)
    ], LifecycleMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlTWFpblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9saWZlY3ljbGUvZWxlY3Ryb24tbWFpbi9saWZlY3ljbGVNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbUJuRixRQUFBLHFCQUFxQixHQUFHLElBQUEsK0JBQWUsRUFBd0Isc0JBQXNCLENBQUMsQ0FBQztJQW9CcEcsSUFBa0IsY0FhakI7SUFiRCxXQUFrQixjQUFjO1FBRS9COztXQUVHO1FBQ0gsbURBQVEsQ0FBQTtRQUVSOzs7O1dBSUc7UUFDSCxtREFBSSxDQUFBO0lBQ0wsQ0FBQyxFQWJpQixjQUFjLDhCQUFkLGNBQWMsUUFhL0I7SUFrSUQsSUFBa0Isa0JBd0JqQjtJQXhCRCxXQUFrQixrQkFBa0I7UUFFbkM7O1dBRUc7UUFDSCxtRUFBWSxDQUFBO1FBRVo7O1dBRUc7UUFDSCw2REFBUyxDQUFBO1FBRVQ7Ozs7V0FJRztRQUNILGlGQUFtQixDQUFBO1FBRW5COzs7V0FHRztRQUNILHVFQUFjLENBQUE7SUFDZixDQUFDLEVBeEJpQixrQkFBa0Isa0NBQWxCLGtCQUFrQixRQXdCbkM7SUFFTSxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVOztpQkFJM0IseUJBQW9CLEdBQUcsMEJBQTBCLEFBQTdCLENBQThCO1FBZTFFLElBQUksYUFBYSxLQUFjLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFHNUQsSUFBSSxZQUFZLEtBQWMsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUcxRCxJQUFJLEtBQUssS0FBeUIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQWlCdkQsWUFDYyxV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