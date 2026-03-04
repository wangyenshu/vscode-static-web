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
define(["require", "exports", "vs/base/common/path", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/node/ps", "vs/platform/log/common/log"], function (require, exports, path_1, decorators_1, event_1, lifecycle_1, ps_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChildProcessMonitor = exports.ignoreProcessNames = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The amount of time to throttle checks when the process receives output.
         */
        Constants[Constants["InactiveThrottleDuration"] = 5000] = "InactiveThrottleDuration";
        /**
         * The amount of time to debounce check when the process receives input.
         */
        Constants[Constants["ActiveDebounceDuration"] = 1000] = "ActiveDebounceDuration";
    })(Constants || (Constants = {}));
    exports.ignoreProcessNames = [];
    /**
     * Monitors a process for child processes, checking at differing times depending on input and output
     * calls into the monitor.
     */
    let ChildProcessMonitor = class ChildProcessMonitor extends lifecycle_1.Disposable {
        set hasChildProcesses(value) {
            if (this._hasChildProcesses !== value) {
                this._hasChildProcesses = value;
                this._logService.debug('ChildProcessMonitor: Has child processes changed', value);
                this._onDidChangeHasChildProcesses.fire(value);
            }
        }
        /**
         * Whether the process has child processes.
         */
        get hasChildProcesses() { return this._hasChildProcesses; }
        constructor(_pid, _logService) {
            super();
            this._pid = _pid;
            this._logService = _logService;
            this._hasChildProcesses = false;
            this._onDidChangeHasChildProcesses = this._register(new event_1.Emitter());
            /**
             * An event that fires when whether the process has child processes changes.
             */
            this.onDidChangeHasChildProcesses = this._onDidChangeHasChildProcesses.event;
        }
        /**
         * Input was triggered on the process.
         */
        handleInput() {
            this._refreshActive();
        }
        /**
         * Output was triggered on the process.
         */
        handleOutput() {
            this._refreshInactive();
        }
        async _refreshActive() {
            if (this._store.isDisposed) {
                return;
            }
            try {
                const processItem = await (0, ps_1.listProcesses)(this._pid);
                this.hasChildProcesses = this._processContainsChildren(processItem);
            }
            catch (e) {
                this._logService.debug('ChildProcessMonitor: Fetching process tree failed', e);
            }
        }
        _refreshInactive() {
            this._refreshActive();
        }
        _processContainsChildren(processItem) {
            // No child processes
            if (!processItem.children) {
                return false;
            }
            // A single child process, handle special cases
            if (processItem.children.length === 1) {
                const item = processItem.children[0];
                let cmd;
                if (item.cmd.startsWith(`"`)) {
                    cmd = item.cmd.substring(1, item.cmd.indexOf(`"`, 1));
                }
                else {
                    const spaceIndex = item.cmd.indexOf(` `);
                    if (spaceIndex === -1) {
                        cmd = item.cmd;
                    }
                    else {
                        cmd = item.cmd.substring(0, spaceIndex);
                    }
                }
                return exports.ignoreProcessNames.indexOf((0, path_1.parse)(cmd).name) === -1;
            }
            // Fallback, count child processes
            return processItem.children.length > 0;
        }
    };
    exports.ChildProcessMonitor = ChildProcessMonitor;
    __decorate([
        (0, decorators_1.debounce)(1000 /* Constants.ActiveDebounceDuration */)
    ], ChildProcessMonitor.prototype, "_refreshActive", null);
    __decorate([
        (0, decorators_1.throttle)(5000 /* Constants.InactiveThrottleDuration */)
    ], ChildProcessMonitor.prototype, "_refreshInactive", null);
    exports.ChildProcessMonitor = ChildProcessMonitor = __decorate([
        __param(1, log_1.ILogService)
    ], ChildProcessMonitor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hpbGRQcm9jZXNzTW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL25vZGUvY2hpbGRQcm9jZXNzTW9uaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVaEcsSUFBVyxTQVNWO0lBVEQsV0FBVyxTQUFTO1FBQ25COztXQUVHO1FBQ0gsb0ZBQStCLENBQUE7UUFDL0I7O1dBRUc7UUFDSCxnRkFBNkIsQ0FBQTtJQUM5QixDQUFDLEVBVFUsU0FBUyxLQUFULFNBQVMsUUFTbkI7SUFFWSxRQUFBLGtCQUFrQixHQUFhLEVBQUUsQ0FBQztJQUUvQzs7O09BR0c7SUFDSSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBRWxELElBQVksaUJBQWlCLENBQUMsS0FBYztZQUMzQyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztnQkFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsa0RBQWtELEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2xGLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNGLENBQUM7UUFDRDs7V0FFRztRQUNILElBQUksaUJBQWlCLEtBQWMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBUXBFLFlBQ2tCLElBQVksRUFDaEIsV0FBeUM7WUFFdEQsS0FBSyxFQUFFLENBQUM7WUFIUyxTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ0MsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFyQi9DLHVCQUFrQixHQUFZLEtBQUss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