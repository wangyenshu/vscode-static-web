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
define(["require", "exports", "vs/base/common/async", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/common/basePty", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, async_1, terminal_1, basePty_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemotePty = void 0;
    let RemotePty = class RemotePty extends basePty_1.BasePty {
        constructor(id, shouldPersist, _remoteTerminalChannel, _remoteAgentService, _logService) {
            super(id, shouldPersist);
            this._remoteTerminalChannel = _remoteTerminalChannel;
            this._remoteAgentService = _remoteAgentService;
            this._logService = _logService;
            this._startBarrier = new async_1.Barrier();
        }
        async start() {
            // Fetch the environment to check shell permissions
            const env = await this._remoteAgentService.getEnvironment();
            if (!env) {
                // Extension host processes are only allowed in remote extension hosts currently
                throw new Error('Could not fetch remote environment');
            }
            this._logService.trace('Spawning remote agent process', { terminalId: this.id });
            const startResult = await this._remoteTerminalChannel.start(this.id);
            if (startResult && 'message' in startResult) {
                // An error occurred
                return startResult;
            }
            this._startBarrier.open();
            return startResult;
        }
        async detach(forcePersist) {
            await this._startBarrier.wait();
            return this._remoteTerminalChannel.detachFromProcess(this.id, forcePersist);
        }
        shutdown(immediate) {
            this._startBarrier.wait().then(_ => {
                this._remoteTerminalChannel.shutdown(this.id, immediate);
            });
        }
        input(data) {
            if (this._inReplay) {
                return;
            }
            this._startBarrier.wait().then(_ => {
                this._remoteTerminalChannel.input(this.id, data);
            });
        }
        processBinary(e) {
            return this._remoteTerminalChannel.processBinary(this.id, e);
        }
        resize(cols, rows) {
            if (this._inReplay || this._lastDimensions.cols === cols && this._lastDimensions.rows === rows) {
                return;
            }
            this._startBarrier.wait().then(_ => {
                this._lastDimensions.cols = cols;
                this._lastDimensions.rows = rows;
                this._remoteTerminalChannel.resize(this.id, cols, rows);
            });
        }
        async clearBuffer() {
            await this._remoteTerminalChannel.clearBuffer(this.id);
        }
        freePortKillProcess(port) {
            if (!this._remoteTerminalChannel.freePortKillProcess) {
                throw new Error('freePortKillProcess does not exist on the local pty service');
            }
            return this._remoteTerminalChannel.freePortKillProcess(port);
        }
        acknowledgeDataEvent(charCount) {
            // Support flow control for server spawned processes
            if (this._inReplay) {
                return;
            }
            this._startBarrier.wait().then(_ => {
                this._remoteTerminalChannel.acknowledgeDataEvent(this.id, charCount);
            });
        }
        async setUnicodeVersion(version) {
            return this._remoteTerminalChannel.setUnicodeVersion(this.id, version);
        }
        async refreshProperty(type) {
            return this._remoteTerminalChannel.refreshProperty(this.id, type);
        }
        async updateProperty(type, value) {
            return this._remoteTerminalChannel.updateProperty(this.id, type, value);
        }
        handleOrphanQuestion() {
            this._remoteTerminalChannel.orphanQuestionReply(this.id);
        }
    };
    exports.RemotePty = RemotePty;
    exports.RemotePty = RemotePty = __decorate([
        __param(3, remoteAgentService_1.IRemoteAgentService),
        __param(4, terminal_1.ITerminalLogService)
    ], RemotePty);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlUHR5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci9yZW1vdGVQdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0sU0FBUyxHQUFmLE1BQU0sU0FBVSxTQUFRLGlCQUFPO1FBR3JDLFlBQ0MsRUFBVSxFQUNWLGFBQXNCLEVBQ0wsc0JBQW1ELEVBQzlCLG1CQUF3QyxFQUN4QyxXQUFnQztZQUV0RSxLQUFLLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBSlIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUE2QjtZQUM5Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ3hDLGdCQUFXLEdBQVgsV0FBVyxDQUFxQjtZQUd0RSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksZUFBTyxFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLO1lBQ1YsbURBQW1EO1lBQ25ELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzVELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixnRkFBZ0Y7Z0JBQ2hGLE1BQU0sSUFBSSxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztZQUN2RCxDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFakYsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVyRSxJQUFJ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