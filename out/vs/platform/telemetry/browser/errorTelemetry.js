/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/telemetry/common/errorTelemetry"], function (require, exports, window_1, errors_1, lifecycle_1, errorTelemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ErrorTelemetry extends errorTelemetry_1.default {
        installErrorListeners() {
            let oldOnError;
            const that = this;
            if (typeof window_1.mainWindow.onerror === 'function') {
                oldOnError = window_1.mainWindow.onerror;
            }
            window_1.mainWindow.onerror = function (message, filename, line, column, error) {
                that._onUncaughtError(message, filename, line, column, error);
                oldOnError?.apply(this, [message, filename, line, column, error]);
            };
            this._disposables.add((0, lifecycle_1.toDisposable)(() => {
                if (oldOnError) {
                    window_1.mainWindow.onerror = oldOnError;
                }
            }));
        }
        _onUncaughtError(msg, file, line, column, err) {
            const data = {
                callstack: msg,
                msg,
                file,
                line,
                column
            };
            if (err) {
                // If it's the no telemetry error it doesn't get logged
                if (errors_1.ErrorNoTelemetry.isErrorNoTelemetry(err)) {
                    return;
                }
                const { name, message, stack } = err;
                data.uncaught_error_name = name;
                if (message) {
                    data.uncaught_error_msg = message;
                }
                if (stack) {
                    data.callstack = Array.isArray(err.stack)
                        ? err.stack = err.stack.join('\n')
                        : err.stack;
                }
            }
            this._enqueue(data);
        }
    }
    exports.default = ErrorTelemetry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JUZWxlbWV0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvYnJvd3Nlci9lcnJvclRlbGVtZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxNQUFxQixjQUFlLFNBQVEsd0JBQWtCO1FBQzFDLHFCQUFxQjtZQUN2QyxJQUFJLFVBQStCLENBQUM7WUFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQUksT0FBTyxtQkFBVSxDQUFDLE9BQU8sS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDOUMsVUFBVSxHQUFHLG1CQUFVLENBQUMsT0FBTyxDQUFDO1lBQ2pDLENBQUM7WUFDRCxtQkFBVSxDQUFDLE9BQU8sR0FBRyxVQUFVLE9BQXVCLEVBQUUsUUFBaUIsRUFBRSxJQUFhLEVBQUUsTUFBZSxFQUFFLEtBQWE7Z0JBQ3ZILElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFpQixFQUFFLFFBQWtCLEVBQUUsSUFBYyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDNUYsVUFBVSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNuRSxDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN2QyxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixtQkFBVSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7Z0JBQ2pDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGdCQUFnQixDQUFDLEdBQVcsRUFBRSxJQUFZLEVBQUUsSUFBWSxFQUFFLE1BQWUsRUFBRSxHQUFTO1lBQzNGLE1BQU0sSUFBSSxHQUFlO2dCQUN4QixTQUFTLEVBQUUsR0FBRztnQkFDZCxHQUFHO2dCQUNILElBQUk7Z0JBQ0osSUFBSTtnQkFDSixNQUFNO2FBQ04sQ0FBQztZQUVGLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1QsdURBQXVEO2dCQUN2RCxJQUFJLHlCQUFnQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzlDLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxHQUFHLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7Z0JBQ2hDLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLE9BQU8sQ0FBQztnQkFDbkMsQ0FBQztnQkFDRCxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO3dCQUN4QyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7d0JBQ2xDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO2dCQUNkLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQixDQUFDO0tBQ0Q7SUEvQ0QsaUNBK0NDIn0=