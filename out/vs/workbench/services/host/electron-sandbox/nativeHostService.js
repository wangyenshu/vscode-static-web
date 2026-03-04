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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/host/browser/host", "vs/platform/native/common/native", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/workbench/services/environment/common/environmentService", "vs/platform/window/common/window", "vs/base/common/lifecycle", "vs/platform/native/common/nativeHostService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/ipc/common/mainProcessService", "vs/base/browser/dom", "vs/base/common/decorators", "vs/base/browser/window"], function (require, exports, event_1, host_1, native_1, extensions_1, label_1, environmentService_1, window_1, lifecycle_1, nativeHostService_1, environmentService_2, mainProcessService_1, dom_1, decorators_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WorkbenchNativeHostService = class WorkbenchNativeHostService extends nativeHostService_1.NativeHostService {
        constructor(environmentService, mainProcessService) {
            super(environmentService.window.id, mainProcessService);
        }
    };
    WorkbenchNativeHostService = __decorate([
        __param(0, environmentService_2.INativeWorkbenchEnvironmentService),
        __param(1, mainProcessService_1.IMainProcessService)
    ], WorkbenchNativeHostService);
    let WorkbenchHostService = class WorkbenchHostService extends lifecycle_1.Disposable {
        constructor(nativeHostService, labelService, environmentService) {
            super();
            this.nativeHostService = nativeHostService;
            this.labelService = labelService;
            this.environmentService = environmentService;
            //#region Focus
            this.onDidChangeFocus = event_1.Event.latch(event_1.Event.any(event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidFocusMainOrAuxiliaryWindow, id => (0, dom_1.hasWindow)(id), this._store), () => this.hasFocus, this._store), event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidBlurMainOrAuxiliaryWindow, id => (0, dom_1.hasWindow)(id), this._store), () => this.hasFocus, this._store), event_1.Event.map(this.onDidChangeActiveWindow, () => this.hasFocus, this._store)), undefined, this._store);
            this.onDidChangeFullScreen = event_1.Event.filter(this.nativeHostService.onDidChangeWindowFullScreen, e => (0, dom_1.hasWindow)(e.windowId), this._store);
        }
        get hasFocus() {
            return (0, dom_1.getActiveDocument)().hasFocus();
        }
        async hadLastFocus() {
            const activeWindowId = await this.nativeHostService.getActiveWindowId();
            if (typeof activeWindowId === 'undefined') {
                return false;
            }
            return activeWindowId === this.nativeHostService.windowId;
        }
        //#endregion
        //#region Window
        get onDidChangeActiveWindow() {
            const emitter = this._register(new event_1.Emitter());
            // Emit via native focus tracking
            this._register(event_1.Event.filter(this.nativeHostService.onDidFocusMainOrAuxiliaryWindow, id => (0, dom_1.hasWindow)(id), this._store)(id => emitter.fire(id)));
            this._register((0, dom_1.onDidRegisterWindow)(({ window, disposables }) => {
                // Emit via interval: immediately when opening an auxiliary window,
                // it is possible that document focus has not yet changed, so we
                // poll for a while to ensure we catch the event.
                disposables.add((0, dom_1.disposableWindowInterval)(window, () => {
                    const hasFocus = window.document.hasFocus();
                    if (hasFocus) {
                        emitter.fire(window.vscodeWindowId);
                    }
                    return hasFocus;
                }, 100, 20));
            }));
            return event_1.Event.latch(emitter.event, undefined, this._store);
        }
        openWindow(arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(arg1, arg2);
            }
            return this.doOpenEmptyWindow(arg1);
        }
        doOpenWindow(toOpen, options) {
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (!!remoteAuthority) {
                toOpen.forEach(openable => openable.label = openable.label || this.getRecentLabel(openable));
                if (options?.remoteAuthority === undefined) {
                    // set the remoteAuthority of the window the request came from.
                    // It will be used when the input is neither file nor vscode-remote.
                    options = options ? { ...options, remoteAuthority } : { remoteAuthority };
                }
            }
            return this.nativeHostService.openWindow(toOpen, options);
        }
        getRecentLabel(openable) {
            if ((0, window_1.isFolderToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel(openable.folderUri, { verbose: 2 /* Verbosity.LONG */ });
            }
            if ((0, window_1.isWorkspaceToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel({ id: '', configPath: openable.workspaceUri }, { verbose: 2 /* Verbosity.LONG */ });
            }
            return this.labelService.getUriLabel(openable.fileUri);
        }
        doOpenEmptyWindow(options) {
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (!!remoteAuthority && options?.remoteAuthority === undefined) {
                // set the remoteAuthority of the window the request came from
                options = options ? { ...options, remoteAuthority } : { remoteAuthority };
            }
            return this.nativeHostService.openWindow(options);
        }
        toggleFullScreen(targetWindow) {
            return this.nativeHostService.toggleFullScreen({ targetWindowId: (0, window_2.isAuxiliaryWindow)(targetWindow) ? targetWindow.vscodeWindowId : undefined });
        }
        async moveTop(targetWindow) {
            if ((0, dom_1.getWindowsCount)() <= 1) {
                return; // does not apply when only one window is opened
            }
            return this.nativeHostService.moveWindowTop((0, window_2.isAuxiliaryWindow)(targetWindow) ? { targetWindowId: targetWindow.vscodeWindowId } : undefined);
        }
        getCursorScreenPoint() {
            return this.nativeHostService.getCursorScreenPoint();
        }
        //#endregion
        //#region Lifecycle
        focus(targetWindow, options) {
            return this.nativeHostService.focusWindow({
                force: options?.force,
                targetWindowId: (0, dom_1.getWindowId)(targetWindow)
            });
        }
        restart() {
            return this.nativeHostService.relaunch();
        }
        reload(options) {
            return this.nativeHostService.reload(options);
        }
        close() {
            return this.nativeHostService.closeWindow();
        }
        async withExpectedShutdown(expectedShutdownTask) {
            return await expectedShutdownTask();
        }
    };
    __decorate([
        decorators_1.memoize
    ], WorkbenchHostService.prototype, "onDidChangeActiveWindow", null);
    WorkbenchHostService = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, label_1.ILabelService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkbenchHostService);
    (0, extensions_1.registerSingleton)(host_1.IHostService, WorkbenchHostService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(native_1.INativeHostService, WorkbenchNativeHostService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlSG9zdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvaG9zdC9lbGVjdHJvbi1zYW5kYm94L25hdGl2ZUhvc3RTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBaUJoRyxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHFDQUFpQjtRQUV6RCxZQUNxQyxrQkFBc0QsRUFDckUsa0JBQXVDO1lBRTVELEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDekQsQ0FBQztLQUNELENBQUE7SUFSSywwQkFBMEI7UUFHN0IsV0FBQSx1REFBa0MsQ0FBQTtRQUNsQyxXQUFBLHdDQUFtQixDQUFBO09BSmhCLDBCQUEwQixDQVEvQjtJQUVELElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFJNUMsWUFDcUIsaUJBQXNELEVBQzNELFlBQTRDLEVBQzdCLGtCQUFpRTtZQUUvRixLQUFLLEVBQUUsQ0FBQztZQUo2QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzFDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ1osdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUtoRyxlQUFlO1lBRU4scUJBQWdCLEdBQUcsYUFBSyxDQUFDLEtBQUssQ0FDdEMsYUFBSyxDQUFDLEdBQUcsQ0FDUixhQUFLLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLCtCQUErQixFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBQSxlQUFTLEVBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0s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