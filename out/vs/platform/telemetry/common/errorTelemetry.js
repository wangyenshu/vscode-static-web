/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/platform/files/common/files"], function (require, exports, arrays_1, errors_1, lifecycle_1, objects_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ErrorEvent = void 0;
    var ErrorEvent;
    (function (ErrorEvent) {
        function compare(a, b) {
            if (a.callstack < b.callstack) {
                return -1;
            }
            else if (a.callstack > b.callstack) {
                return 1;
            }
            return 0;
        }
        ErrorEvent.compare = compare;
    })(ErrorEvent || (exports.ErrorEvent = ErrorEvent = {}));
    class BaseErrorTelemetry {
        static { this.ERROR_FLUSH_TIMEOUT = 5 * 1000; }
        constructor(telemetryService, flushDelay = BaseErrorTelemetry.ERROR_FLUSH_TIMEOUT) {
            this._flushHandle = -1;
            this._buffer = [];
            this._disposables = new lifecycle_1.DisposableStore();
            this._telemetryService = telemetryService;
            this._flushDelay = flushDelay;
            // (1) check for unexpected but handled errors
            const unbind = errors_1.errorHandler.addListener((err) => this._onErrorEvent(err));
            this._disposables.add((0, lifecycle_1.toDisposable)(unbind));
            // (2) install implementation-specific error listeners
            this.installErrorListeners();
        }
        dispose() {
            clearTimeout(this._flushHandle);
            this._flushBuffer();
            this._disposables.dispose();
        }
        installErrorListeners() {
            // to override
        }
        _onErrorEvent(err) {
            if (!err || err.code) {
                return;
            }
            // unwrap nested errors from loader
            if (err.detail && err.detail.stack) {
                err = err.detail;
            }
            // If it's the no telemetry error it doesn't get logged
            // TOOD @lramos15 hacking in FileOperation error because it's too messy to adopt ErrorNoTelemetry. A better solution should be found
            if (errors_1.ErrorNoTelemetry.isErrorNoTelemetry(err) || err instanceof files_1.FileOperationError || (typeof err?.message === 'string' && err.message.includes('Unable to read file'))) {
                return;
            }
            // work around behavior in workerServer.ts that breaks up Error.stack
            const callstack = Array.isArray(err.stack) ? err.stack.join('\n') : err.stack;
            const msg = err.message ? err.message : (0, objects_1.safeStringify)(err);
            // errors without a stack are not useful telemetry
            if (!callstack) {
                return;
            }
            this._enqueue({ msg, callstack });
        }
        _enqueue(e) {
            const idx = (0, arrays_1.binarySearch)(this._buffer, e, ErrorEvent.compare);
            if (idx < 0) {
                e.count = 1;
                this._buffer.splice(~idx, 0, e);
            }
            else {
                if (!this._buffer[idx].count) {
                    this._buffer[idx].count = 0;
                }
                this._buffer[idx].count += 1;
            }
            if (this._flushHandle === -1) {
                this._flushHandle = setTimeout(() => {
                    this._flushBuffer();
                    this._flushHandle = -1;
                }, this._flushDelay);
            }
        }
        _flushBuffer() {
            for (const error of this._buffer) {
                this._telemetryService.publicLogError2('UnhandledError', error);
            }
            this._buffer.length = 0;
        }
    }
    exports.default = BaseErrorTelemetry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JUZWxlbWV0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvY29tbW9uL2Vycm9yVGVsZW1ldHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdDaEcsSUFBaUIsVUFBVSxDQVMxQjtJQVRELFdBQWlCLFVBQVU7UUFDMUIsU0FBZ0IsT0FBTyxDQUFDLENBQWEsRUFBRSxDQUFhO1lBQ25ELElBQUksQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO2lCQUFNLElBQUksQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUNELE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQVBlLGtCQUFPLFVBT3RCLENBQUE7SUFDRixDQUFDLEVBVGdCLFVBQVUsMEJBQVYsVUFBVSxRQVMxQjtJQUVELE1BQThCLGtCQUFrQjtpQkFFakMsd0JBQW1CLEdBQVcsQ0FBQyxHQUFHLElBQUksQUFBbkIsQ0FBb0I7UUFRckQsWUFBWSxnQkFBbUMsRUFBRSxVQUFVLEdBQUcsa0JBQWtCLENBQUMsbUJBQW1CO1lBSjVGLGlCQUFZLEdBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdkIsWUFBTyxHQUFpQixFQUFFLENBQUM7WUFDaEIsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUd2RCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsZ0JBQWdCLENBQUM7WUFDMUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFFOUIsOENBQThDO1lBQzlDLE1BQU0sTUFBTSxHQUFHLHFCQUFZLENBQUMs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