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
define(["require", "exports", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/contrib/terminal/electron-sandbox/terminalRemote", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/native/common/native", "vs/base/common/lifecycle", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/browser/dom"], function (require, exports, globals_1, uri_1, files_1, terminalRemote_1, remoteAgentService_1, native_1, lifecycle_1, terminal_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalNativeContribution = void 0;
    let TerminalNativeContribution = class TerminalNativeContribution extends lifecycle_1.Disposable {
        constructor(_fileService, _terminalService, remoteAgentService, nativeHostService) {
            super();
            this._fileService = _fileService;
            this._terminalService = _terminalService;
            globals_1.ipcRenderer.on('vscode:openFiles', (_, request) => { this._onOpenFileRequest(request); });
            this._register(nativeHostService.onDidResumeOS(() => this._onOsResume()));
            this._terminalService.setNativeDelegate({
                getWindowCount: () => nativeHostService.getWindowCount()
            });
            const connection = remoteAgentService.getConnection();
            if (connection && connection.remoteAuthority) {
                (0, terminalRemote_1.registerRemoteContributions)();
            }
        }
        _onOsResume() {
            for (const instance of this._terminalService.instances) {
                instance.xterm?.forceRedraw();
            }
        }
        async _onOpenFileRequest(request) {
            // if the request to open files is coming in from the integrated terminal (identified though
            // the termProgram variable) and we are instructed to wait for editors close, wait for the
            // marker file to get deleted and then focus back to the integrated terminal.
            if (request.termProgram === 'vscode' && request.filesToWait) {
                const waitMarkerFileUri = uri_1.URI.revive(request.filesToWait.waitMarkerFileUri);
                await this._whenFileDeleted(waitMarkerFileUri);
                // Focus active terminal
                this._terminalService.activeInstance?.focus();
            }
        }
        _whenFileDeleted(path) {
            // Complete when wait marker file is deleted
            return new Promise(resolve => {
                let running = false;
                const interval = (0, dom_1.disposableWindowInterval)((0, dom_1.getActiveWindow)(), async () => {
                    if (!running) {
                        running = true;
                        const exists = await this._fileService.exists(path);
                        running = false;
                        if (!exists) {
                            interval.dispose();
                            resolve(undefined);
                        }
                    }
                }, 1000);
            });
        }
    };
    exports.TerminalNativeContribution = TerminalNativeContribution;
    exports.TerminalNativeContribution = TerminalNativeContribution = __decorate([
        __param(0, files_1.IFileService),
        __param(1, terminal_1.ITerminalService),
        __param(2, remoteAgentService_1.IRemoteAgentService),
        __param(3, native_1.INativeHostService)
    ], TerminalNativeContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxOYXRpdmVDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9lbGVjdHJvbi1zYW5kYm94L3Rlcm1pbmFsTmF0aXZlQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHNCQUFVO1FBR3pELFlBQ2dDLFlBQTBCLEVBQ3RCLGdCQUFrQyxFQUNoRCxrQkFBdUMsRUFDeEMsaUJBQXFDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBTHVCLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQ3RCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFNckUscUJBQVcsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFVLEVBQUUsT0FBK0IsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUxRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUM7Z0JBQ3ZDLGNBQWMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUU7YUFDeEQsQ0FBQyxDQUFDO1lBRUgsTUFBTSxVQUFVLEdBQUcsa0JBQWtCLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdEQsSUFBSSxVQUFVLElBQUksVUFBVSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUM5QyxJQUFBLDRDQUEyQixHQUFFLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7UUFFTyxXQUFXO1lBQ2xCLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4RCxRQUFRLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxDQUFDO1lBQy9CLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLE9BQStCO1lBQy9ELDRGQUE0RjtZQUM1RiwwRkFBMEY7WUFDMUYsNkVBQTZFO1lBQzdFLElBQUksT0FBTyxDQUFDLFdBQVcsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM3RCxNQUFNLGlCQUFpQixHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUUvQyx3QkFBd0I7Z0JBQ3hCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFDL0MsQ0FBQztRQUNGLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxJQUFTO1lBQ2pDLDRDQUE0QztZQUM1QyxPQUFPLElBQUksT0FBTyxDQUFPLE9BQU8sQ0FBQyxFQUFFO2dCQUNsQyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ3BCLE1BQU0sUUFBUSxHQUFHLElBQUEsOEJBQXdCLEVBQUMsSUFBQSxxQkFBZSxHQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7b0JBQ3ZFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDZCxPQUFPLEdBQUcsSUFBSSxDQUFDO3dCQUNmLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ3BELE9BQU8sR0FBRyxLQUFLLENBQUM7d0JBRWhCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzs0QkFDYixRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7NEJBQ25CLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDcEIsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNWLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUE3RFksZ0VBQTBCO3lDQUExQiwwQkFBMEI7UUFJcEMsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSwyQkFBZ0IsQ0FBQTtRQUNoQixXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEsMkJBQWtCLENBQUE7T0FQUiwwQkFBMEIsQ0E2RHRDIn0=